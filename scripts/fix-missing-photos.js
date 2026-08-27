/**
 * Rattrape les photos manquantes après un import.
 *
 * upload.wikimedia.org limite le débit : lors d'un import en rafale, une
 * partie des téléchargements repart en 429 et la recette est créée sans
 * image. Ce script reprend uniquement celles qui n'en ont pas, lentement.
 *
 *   node scripts/fix-missing-photos.js           # simulation
 *   node scripts/fix-missing-photos.js --apply
 */
import admin from 'firebase-admin';
import { randomUUID } from 'crypto';
import { loadServiceAccount } from './service-account.js';
import { loadAllBatches } from './data/index.js';

const { serviceAccount } = loadServiceAccount();
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: `${serviceAccount.project_id}.firebasestorage.app`
});

const db = admin.firestore();
const bucket = admin.storage().bucket();
const APPLY = process.argv.includes('--apply');

const green = (s) => `\x1b[32m${s}\x1b[0m`;
const red = (s) => `\x1b[31m${s}\x1b[0m`;
const yellow = (s) => `\x1b[33m${s}\x1b[0m`;
const dim = (s) => `\x1b[2m${s}\x1b[0m`;

const UA = 'GoGourmet/1.0 (application de recettes familiale ; contact via github.com/AntoineSinety/go-gourmet)';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const COMMONS = 'https://commons.wikimedia.org/w/api.php';

const REJECT =
  /\b(flower|plant|leaf|leaves|field|farm|seedling|blossom|tree|garden|sprout|slips|logo|map|diagram|chart|stamp|coin|label|packaging|recall|painting|drawing|museum|virus|mosque|church)\b/i;

const findPhoto = async (query, width, attempt = 0) => {
  const url =
    `${COMMONS}?action=query&generator=search` +
    `&gsrsearch=${encodeURIComponent(`filetype:bitmap ${query}`)}` +
    `&gsrnamespace=6&gsrlimit=8&prop=imageinfo` +
    `&iiprop=url|size|extmetadata&iiurlwidth=${width}&format=json`;

  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok || !(res.headers.get('content-type') || '').includes('json')) {
    if (attempt >= 4) return null;
    await sleep(3000 * (attempt + 1));
    return findPhoto(query, width, attempt + 1);
  }

  const pages = Object.values((await res.json()).query?.pages || {});
  const words = query.toLowerCase().split(/\s+/).filter((w) => w.length > 3);

  const scored = pages
    .map((page) => {
      const info = page.imageinfo?.[0];
      if (!info) return null;
      const title = page.title.replace('File:', '');
      if (REJECT.test(title)) return null;
      const hits = words.filter((w) => title.toLowerCase().includes(w)).length;
      // Paysage et bonne définition : un original de 450 px est flou en bandeau.
      const quality = (info.width >= info.height ? 1 : 0) + (info.width >= 1000 ? 2 : 0);
      return { page, info, title, score: hits * 2 + quality };
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score);

  if (!scored.length) return null;
  const best = scored[0];
  const meta = best.info.extmetadata || {};
  const strip = (h) => (h || '').replace(/<[^>]*>/g, '').trim();

  return {
    url: best.info.thumburl || best.info.url,
    title: best.title,
    credit: {
      author: strip(meta.Artist?.value).slice(0, 120) || 'Wikimedia Commons',
      license: meta.LicenseShortName?.value || 'voir la source',
      source: best.info.descriptionurl
    }
  };
};

/**
 * upload.wikimedia.org bride par adresse IP et annonce la durée dans
 * `Retry-After` — souvent 600 secondes. Réessayer avant l'échéance ne fait que
 * consommer les tentatives : on attend ce que le serveur demande.
 */
const uploadPhoto = async (imageUrl, targetPath, attempt = 0) => {
  const res = await fetch(imageUrl, { headers: { 'User-Agent': UA } });
  if (res.status === 429 || res.status === 503) {
    if (attempt >= 2) throw new Error(`HTTP ${res.status} après 3 tentatives`);
    const wait = Math.min(Number(res.headers.get('retry-after')) || 30, 900);
    console.log(dim(`        HTTP ${res.status}, pause de ${wait} s comme demandé`));
    await sleep(wait * 1000 + 2000);
    return uploadPhoto(imageUrl, targetPath, attempt + 1);
  }
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const buffer = Buffer.from(await res.arrayBuffer());
  const token = randomUUID();
  await bucket.file(targetPath).save(buffer, {
    contentType: res.headers.get('content-type') || 'image/jpeg',
    metadata: { metadata: { firebaseStorageDownloadTokens: token } }
  });

  return `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(targetPath)}?alt=media&token=${token}`;
};

const run = async () => {
  const { RECIPES, NEW_INGREDIENTS } = await loadAllBatches();

  const [household] = (await db.collection('households').limit(1).get()).docs;

  const queryByName = new Map([
    ...RECIPES.map((r) => [r.name, { query: r.imageQuery, width: 1200 }]),
    ...NEW_INGREDIENTS.map((i) => [i.name, { query: i.imageQuery, width: 400 }])
  ]);

  const targets = [];

  for (const doc of (await db.collection('recipes').get()).docs) {
    const data = doc.data();
    if (data.imageUrl) continue;
    const spec = queryByName.get(data.name);
    if (spec) targets.push({ doc, kind: 'recipe', name: data.name, ...spec });
  }

  for (const doc of (await db.collection('ingredients').get()).docs) {
    const data = doc.data();
    if (data.imageUrl) continue;
    const spec = queryByName.get(data.name);
    if (spec) targets.push({ doc, kind: 'ingredient', name: data.name, ...spec });
  }

  console.log(`\n${targets.length} élément(s) sans photo\n`);
  if (!targets.length) {
    console.log(green('Rien à rattraper.\n'));
    return;
  }
  if (!APPLY) console.log(yellow('SIMULATION — ajoutez --apply pour écrire.\n'));

  let fixed = 0;

  for (const t of targets) {
    const photo = await findPhoto(t.query, t.width);
    await sleep(1500);

    if (!photo) {
      console.log(`${red(' aucune')} ${t.name.slice(0, 46)}`);
      continue;
    }

    if (!APPLY) {
      console.log(`${green('  trouvée')} ${t.name.slice(0, 44).padEnd(46)} ${dim(photo.title.slice(0, 44))}`);
      continue;
    }

    try {
      const path =
        t.kind === 'recipe'
          ? `households/${household.id}/recipes/${t.doc.id}_${Date.now()}.jpg`
          : `global/ingredients/${t.doc.id}_${Date.now()}.jpg`;

      const url = await uploadPhoto(photo.url, path);
      await t.doc.ref.update(
        t.kind === 'recipe' ? { imageUrl: url, imageCredit: photo.credit } : { imageUrl: url }
      );

      fixed += 1;
      console.log(`${green('  ok  ')} ${t.name.slice(0, 44).padEnd(46)} ${dim(photo.title.slice(0, 44))}`);
    } catch (e) {
      console.log(`${red(' ÉCHEC')} ${t.name.slice(0, 44).padEnd(46)} ${dim(e.message)}`);
    }

    await sleep(2500);
  }

  console.log('');
  console.log(APPLY ? green(`${fixed} photo(s) rattrapée(s).\n`) : yellow('Simulation terminée.\n'));
};

run()
  .catch((e) => {
    console.error('\nÉchec :', e.message);
    process.exitCode = 1;
  })
  .finally(() => process.exit(process.exitCode || 0));
