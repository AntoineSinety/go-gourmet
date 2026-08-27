/**
 * Insertion d'un lot de recettes, avec photos et ingrédients manquants.
 *
 * Les photos viennent de Wikimedia Commons, seule source d'images libres
 * accessible sans clé d'API et dont la licence est explicite. On demande la
 * vignette générée par Commons plutôt que l'original : les fichiers font
 * souvent 3000 px de large pour plusieurs mégaoctets.
 *
 * Les licences CC BY-SA imposent l'attribution : elle est stockée sur la
 * recette dans `imageCredit` et affichée sous la photo.
 *
 *   node scripts/import-recipe-batch.js              # simulation
 *   node scripts/import-recipe-batch.js --photos     # simulation + photos trouvées
 *   node scripts/import-recipe-batch.js --apply      # exécution
 */
import admin from 'firebase-admin';
import { randomUUID } from 'crypto';
import { loadServiceAccount } from './service-account.js';
import { RECIPES, NEW_INGREDIENTS } from './data/recipes-batch-1.js';

const { serviceAccount } = loadServiceAccount();
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: `${serviceAccount.project_id}.firebasestorage.app`
});

const db = admin.firestore();
const bucket = admin.storage().bucket();

const APPLY = process.argv.includes('--apply');
const WITH_PHOTOS = APPLY || process.argv.includes('--photos');

const green = (s) => `\x1b[32m${s}\x1b[0m`;
const red = (s) => `\x1b[31m${s}\x1b[0m`;
const yellow = (s) => `\x1b[33m${s}\x1b[0m`;
const dim = (s) => `\x1b[2m${s}\x1b[0m`;
const bold = (s) => `\x1b[1m${s}\x1b[0m`;

/** Comparaison de noms insensible à la casse, aux accents et aux espaces. */
const key = (s) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim();

// ---------------------------------------------------------------------------
// Photos
// ---------------------------------------------------------------------------

const COMMONS = 'https://commons.wikimedia.org/w/api.php';

const UA = 'GoGourmet/1.0 (application de recettes familiale ; contact via github.com/AntoineSinety/go-gourmet)';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Titres à écarter : Commons contient beaucoup de photos de la plante ou de
 * l'animal vivant, qui n'ont rien à faire sur une carte de recette.
 */
const REJECT = /\b(flower|plant|leaf|leaves|field|farm|seed|blossom|tree|garden|logo|map|diagram|chart|stamp|coin|label|packaging|recall)\b/i;

/**
 * Cherche une image libre sur Commons.
 *
 * Commons limite le débit : on espace les appels et on réessaie. Et comme la
 * pertinence du premier résultat est inégale, on prend plusieurs candidats et
 * on garde celui dont le titre recoupe le mieux la requête.
 */
const findPhoto = async (query, width, { attempt = 0 } = {}) => {
  const url =
    `${COMMONS}?action=query&generator=search` +
    `&gsrsearch=${encodeURIComponent(`filetype:bitmap ${query}`)}` +
    `&gsrnamespace=6&gsrlimit=8&prop=imageinfo` +
    `&iiprop=url|size|extmetadata&iiurlwidth=${width}&format=json`;

  const res = await fetch(url, { headers: { 'User-Agent': UA } });

  // 429 ou message texte : on laisse retomber puis on réessaie.
  if (!res.ok || !(res.headers.get('content-type') || '').includes('json')) {
    if (attempt >= 3) return null;
    await sleep(2000 * (attempt + 1));
    return findPhoto(query, width, { attempt: attempt + 1 });
  }

  const json = await res.json();
  const pages = Object.values(json.query?.pages || {});
  if (!pages.length) return null;

  const words = query.toLowerCase().split(/\s+/).filter((w) => w.length > 3);

  const scored = pages
    .map((page) => {
      const info = page.imageinfo?.[0];
      if (!info) return null;
      const title = page.title.replace('File:', '');
      if (REJECT.test(title)) return null;

      const lower = title.toLowerCase();
      const hits = words.filter((w) => lower.includes(w)).length;
      // Le paysage cadre mieux une carte 16:9 que le portrait.
      const landscape = info.width >= info.height ? 1 : 0;

      return { page, info, title, score: hits * 2 + landscape };
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score);

  if (!scored.length) return null;

  const best = scored[0];
  const meta = best.info.extmetadata || {};
  const strip = (html) => (html || '').replace(/<[^>]*>/g, '').trim();

  return {
    url: best.info.thumburl || best.info.url,
    title: best.title,
    score: best.score,
    candidates: scored.length,
    credit: {
      author: strip(meta.Artist?.value).slice(0, 120) || 'Wikimedia Commons',
      license: meta.LicenseShortName?.value || 'voir la source',
      source:
        best.info.descriptionurl ||
        `https://commons.wikimedia.org/wiki/${encodeURIComponent(best.page.title)}`
    }
  };
};

/**
 * Téléverse une image dans Storage et renvoie son URL de téléchargement.
 *
 * upload.wikimedia.org limite le débit indépendamment de l'API : on réessaie
 * avec une attente croissante plutôt que d'abandonner la photo.
 */
const uploadPhoto = async (imageUrl, targetPath, attempt = 0) => {
  const res = await fetch(imageUrl, { headers: { 'User-Agent': UA } });

  if (res.status === 429 || res.status === 503) {
    if (attempt >= 4) throw new Error(`téléchargement HTTP ${res.status} après 5 tentatives`);
    await sleep(3000 * (attempt + 1));
    return uploadPhoto(imageUrl, targetPath, attempt + 1);
  }
  if (!res.ok) throw new Error(`téléchargement HTTP ${res.status}`);

  const buffer = Buffer.from(await res.arrayBuffer());
  const token = randomUUID();

  await bucket.file(targetPath).save(buffer, {
    contentType: res.headers.get('content-type') || 'image/jpeg',
    metadata: { metadata: { firebaseStorageDownloadTokens: token } }
  });

  return {
    url:
      `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/` +
      `${encodeURIComponent(targetPath)}?alt=media&token=${token}`,
    bytes: buffer.length
  };
};

// ---------------------------------------------------------------------------

const run = async () => {
  const [household] = (await db.collection('households').limit(1).get()).docs;
  if (!household) throw new Error('aucun foyer en base');

  const catalogue = (await db.collection('ingredients').get()).docs.map((d) => ({
    id: d.id,
    ...d.data()
  }));

  const byName = new Map();
  catalogue.forEach((i) => {
    // En cas de doublon (Épinard / Épinards), on garde le premier rencontré.
    if (!byName.has(key(i.name))) byName.set(key(i.name), i);
  });

  console.log(bold(`\n${RECIPES.length} recettes · ${NEW_INGREDIENTS.length} ingrédients à créer\n`));
  if (!APPLY) console.log(yellow('SIMULATION — rien ne sera écrit. Ajoutez --apply pour exécuter.\n'));

  // ---- 1. Ingrédients manquants -------------------------------------------
  console.log(bold('Ingrédients'));
  const created = new Map();

  for (const ing of NEW_INGREDIENTS) {
    if (byName.has(key(ing.name))) {
      console.log(`${dim('  déjà')} ${ing.name}`);
      continue;
    }

    let photo = null;
    if (WITH_PHOTOS) {
      photo = await findPhoto(ing.imageQuery, 400).catch(() => null);
      await sleep(1200);
    }

    if (!APPLY) {
      console.log(`${green('  créer')} ${ing.name.padEnd(22)} ${dim(photo ? photo.title.slice(0, 46) : 'sans photo')}`);
      created.set(key(ing.name), { id: `dry-${key(ing.name)}`, ...ing });
      continue;
    }

    const ref = db.collection('ingredients').doc();
    let imageUrl = null;

    if (photo) {
      try {
        imageUrl = (await uploadPhoto(photo.url, `global/ingredients/${ref.id}_${Date.now()}.jpg`)).url;
      } catch (e) {
        console.log(red(`        photo non récupérée : ${e.message}`));
      }
    }

    await ref.set({
      name: ing.name,
      category: ing.category,
      defaultUnit: ing.defaultUnit,
      householdId: 'global',
      imageUrl,
      createdAt: new Date().toISOString()
    });

    created.set(key(ing.name), { id: ref.id, ...ing, imageUrl });
    console.log(`${green('  créé')} ${ing.name.padEnd(22)} ${dim(photo ? photo.title.slice(0, 46) : 'sans photo')}`);
  }

  const resolve = (name) => byName.get(key(name)) || created.get(key(name)) || null;

  // ---- 2. Recettes ---------------------------------------------------------
  console.log(bold('\nRecettes'));
  let inserted = 0;
  const problems = [];

  for (const recipe of RECIPES) {
    const missing = recipe.ingredients.filter((i) => !resolve(i.name)).map((i) => i.name);
    if (missing.length) {
      problems.push(`${recipe.name} → ingrédient introuvable : ${missing.join(', ')}`);
      console.log(`${red(' ÉCHEC')} ${recipe.name}`);
      continue;
    }

    const ingredients = recipe.ingredients.map((i) => {
      const found = resolve(i.name);
      return {
        ingredientId: found.id,
        name: found.name,
        category: found.category,
        imageUrl: found.imageUrl || null,
        quantity: i.quantity,
        unit: i.unit
      };
    });

    const steps = recipe.steps.map((s, order) => ({
      order,
      instruction: s.text,
      ingredientIds: (s.uses || []).map((n) => resolve(n)?.id).filter(Boolean)
    }));

    let photo = null;
    if (WITH_PHOTOS) {
      photo = await findPhoto(recipe.imageQuery, 1200).catch(() => null);
      await sleep(1200);
    }

    if (!APPLY) {
      console.log(
        `${green('  ajout')} ${recipe.name.slice(0, 44).padEnd(46)}` +
        `${dim(`${recipe.calories} kcal · ${recipe.protein} g P · ${ingredients.length} ingr.`)}`
      );
      if (WITH_PHOTOS) {
        console.log(dim(`         photo : ${photo ? `[${photo.score}] ${photo.title.slice(0, 58)}` : '— aucune trouvée'}`));
      }
      inserted += 1;
      continue;
    }

    const ref = db.collection('recipes').doc();
    let imageUrl = null;
    let imageCredit = null;

    if (photo) {
      try {
        imageUrl = (await uploadPhoto(photo.url, `households/${household.id}/recipes/${ref.id}_${Date.now()}.jpg`)).url;
        imageCredit = photo.credit;
      } catch (e) {
        console.log(red(`        photo non récupérée : ${e.message}`));
      }
    }

    await ref.set({
      householdId: household.id,
      name: recipe.name,
      type: recipe.type,
      servings: recipe.servings,
      calories: recipe.calories,
      protein: recipe.protein,
      tags: recipe.tags || [],
      ingredients,
      steps,
      imageUrl,
      imageCredit,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    inserted += 1;
    console.log(`${green('  créée')} ${recipe.name.slice(0, 44).padEnd(46)}${dim(photo ? photo.title.slice(0, 40) : 'sans photo')}`);
  }

  console.log('');
  if (problems.length) {
    console.log(red('Problèmes :'));
    problems.forEach((p) => console.log('  ' + p));
    console.log('');
  }
  console.log(
    APPLY
      ? green(`${inserted} recette(s) ajoutée(s).\n`)
      : yellow(`${inserted} recette(s) prête(s). Relancez avec --apply.\n`)
  );
};

run()
  .catch((e) => {
    console.error('\nÉchec :', e.message);
    process.exitCode = 1;
  })
  .finally(() => process.exit(process.exitCode || 0));
