/**
 * Rapatrie les photos d'ingrédients dans Firebase Storage.
 *
 * Le script d'import d'origine a téléversé les images du catalogue global via
 * l'API Cloud Storage brute, en accès public. Trois conséquences :
 *
 *   - elles sont lisibles par n'importe qui sur Internet, sans authentification,
 *     et aucune règle Storage ne s'y applique ;
 *   - leur hôte (storage.googleapis.com) ne correspond pas au motif de cache du
 *     service worker, donc elles sont retéléchargées à chaque affichage ;
 *   - elles vivent à la racine du bucket, hors de toute arborescence.
 *
 * Ce script les télécharge et les réémet sous global/ingredients/, avec un
 * jeton de téléchargement Firebase, puis repointe les documents.
 *
 * Les anciens objets ne sont PAS supprimés : voir --cleanup une fois la
 * migration vérifiée.
 *
 *   node scripts/migrate-ingredient-images.js            # simulation
 *   node scripts/migrate-ingredient-images.js --apply    # exécution
 *   node scripts/migrate-ingredient-images.js --refresh-recipes  # copies embarquées
 *   node scripts/migrate-ingredient-images.js --cleanup  # purge des anciens
 */
import admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';
import { randomUUID } from 'crypto';
import { fileURLToPath } from 'url';
import { loadServiceAccount } from './service-account.js';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const { serviceAccount } = loadServiceAccount();

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: `${serviceAccount.project_id}.firebasestorage.app`
});

const db = admin.firestore();
const bucket = admin.storage().bucket();

const APPLY = process.argv.includes('--apply');
const CLEANUP = process.argv.includes('--cleanup');
const REFRESH = process.argv.includes('--refresh-recipes');

const green = (s) => `\x1b[32m${s}\x1b[0m`;
const red = (s) => `\x1b[31m${s}\x1b[0m`;
const yellow = (s) => `\x1b[33m${s}\x1b[0m`;
const dim = (s) => `\x1b[2m${s}\x1b[0m`;

const ko = (n) => `${Math.round(n / 1024)} Ko`;

/** Chemin de l'objet dans le bucket, extrait d'une URL publique GCS. */
const objectPathFromPublicUrl = (url) =>
  decodeURIComponent(new URL(url).pathname.replace(`/${bucket.name}/`, ''));

/** URL de téléchargement Firebase, celle que produit getDownloadURL(). */
const downloadUrl = (objectPath, token) =>
  `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/` +
  `${encodeURIComponent(objectPath)}?alt=media&token=${token}`;

const migrate = async () => {
  const docs = (await db.collection('ingredients').get()).docs;

  const todo = docs.filter((d) => {
    const url = d.data().imageUrl;
    return url && new URL(url).host === 'storage.googleapis.com';
  });

  console.log(`\n${docs.length} ingrédients · ${todo.length} à rapatrier\n`);

  if (!todo.length) {
    console.log(green('Rien à faire.\n'));
    return;
  }

  if (!APPLY) {
    console.log(yellow('SIMULATION — rien ne sera écrit. Ajoutez --apply pour exécuter.\n'));
  } else {
    // Sauvegarde des URL actuelles : la migration redevient réversible.
    const backup = Object.fromEntries(todo.map((d) => [d.id, d.data().imageUrl]));
    const file = path.join(root, `backup-ingredient-images-${Date.now()}.json`);
    fs.writeFileSync(file, JSON.stringify(backup, null, 2));
    console.log(dim(`Sauvegarde des URL actuelles : ${path.basename(file)}\n`));
  }

  let migrated = 0;
  let failed = 0;
  let bytes = 0;

  for (const doc of todo) {
    const data = doc.data();
    const name = (data.name || doc.id).padEnd(28).slice(0, 28);

    try {
      const response = await fetch(data.imageUrl);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const buffer = Buffer.from(await response.arrayBuffer());
      const contentType = response.headers.get('content-type') || 'image/jpeg';
      const ext = objectPathFromPublicUrl(data.imageUrl).split('.').pop().toLowerCase();
      bytes += buffer.length;

      const target = `global/ingredients/${doc.id}_${Date.now()}.${ext}`;

      if (APPLY) {
        const token = randomUUID();
        await bucket.file(target).save(buffer, {
          contentType,
          metadata: {
            // C'est ce jeton qui rend l'URL lisible par le navigateur, et que
            // getDownloadURL() renverrait côté client.
            metadata: { firebaseStorageDownloadTokens: token }
          }
        });
        await doc.ref.update({ imageUrl: downloadUrl(target, token) });
      }

      migrated += 1;
      console.log(`${green('  ok  ')} ${name} ${dim(ko(buffer.length).padStart(8))}  ${dim(target.slice(0, 46))}`);
    } catch (error) {
      failed += 1;
      console.log(`${red(' ÉCHEC')} ${name} ${dim(error.message.slice(0, 60))}`);
    }
  }

  console.log('');
  console.log(`${migrated} rapatriée(s), ${failed} en échec · ${(bytes / 1024 / 1024).toFixed(1)} Mo transférés`);
  console.log(
    APPLY
      ? green('\nLes documents pointent désormais vers Firebase Storage.\n') +
        dim('  Vérifiez l’application, puis lancez --cleanup pour purger les anciens objets.\n')
      : yellow('\nSimulation terminée. Relancez avec --apply.\n')
  );
};

/**
 * Les recettes embarquent une copie de `imageUrl` par ingrédient, figée au
 * moment où l'ingrédient a été ajouté. L'affichage ne s'en sert pas — il
 * résout l'image depuis le catalogue — mais ces copies pointent encore vers
 * les anciens objets publics. On les réaligne pour que la purge ne laisse
 * aucune référence morte.
 */
const refreshRecipes = async () => {
  const catalogue = new Map(
    (await db.collection('ingredients').get()).docs.map((d) => [d.id, d.data().imageUrl || null])
  );

  const recipes = (await db.collection('recipes').get()).docs;
  let touched = 0;

  for (const recipe of recipes) {
    const ingredients = recipe.data().ingredients || [];
    let changed = false;

    const next = ingredients.map((ing) => {
      if (!catalogue.has(ing.ingredientId)) return ing;
      const fresh = catalogue.get(ing.ingredientId);
      if ((ing.imageUrl || null) === fresh) return ing;
      changed = true;
      return { ...ing, imageUrl: fresh };
    });

    if (!changed) continue;
    touched += 1;
    console.log(`${green('  ok  ')} ${(recipe.data().name || recipe.id).slice(0, 40)}`);
    if (APPLY) await recipe.ref.update({ ingredients: next });
  }

  console.log('');
  console.log(
    touched
      ? (APPLY
          ? green(`${touched} recette(s) réalignée(s) sur le catalogue.\n`)
          : yellow(`${touched} recette(s) à réaligner. Relancez avec --apply.\n`))
      : green('Aucune recette à réaligner.\n')
  );
};

/** Supprime les objets publics devenus inutiles, après vérification. */
const cleanup = async () => {
  const docs = (await db.collection('ingredients').get()).docs;
  const stillUsed = new Set(
    docs
      .map((d) => d.data().imageUrl)
      .filter((u) => u && new URL(u).host === 'storage.googleapis.com')
      .map(objectPathFromPublicUrl)
  );

  if (stillUsed.size) {
    console.log(red(`\n${stillUsed.size} document(s) pointent encore vers des URL publiques.`));
    console.log('Terminez la migration avant la purge.\n');
    process.exitCode = 1;
    return;
  }

  const [files] = await bucket.getFiles({ prefix: 'ingredients/' });
  const size = files.reduce((a, f) => a + Number(f.metadata.size), 0);

  console.log(`\n${files.length} objet(s) publics à la racine · ${(size / 1024 / 1024).toFixed(1)} Mo`);

  if (!APPLY) {
    console.log(yellow('\nSIMULATION — ajoutez --apply pour supprimer.\n'));
    return;
  }

  for (const file of files) await file.delete();
  console.log(green(`\n${files.length} objet(s) supprimés.\n`));
};

(CLEANUP ? cleanup() : REFRESH ? refreshRecipes() : migrate())
  .catch((e) => {
    console.error('\nÉchec :', e.message);
    process.exitCode = 1;
  })
  .finally(() => process.exit(process.exitCode || 0));
