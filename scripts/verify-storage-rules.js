/**
 * Les règles Storage durcies refusent-elles des lectures légitimes ?
 *
 * Les métriques du bucket montrent des PERMISSION_DENIED sur ReadObject les
 * jours du déploiement. Ce script tranche : un vrai client Firebase, connecté
 * comme membre du foyer, passe par les chemins que l'application emprunte.
 *
 * Compte de test supprimé en fin d'exécution.
 */
import admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithCustomToken } from 'firebase/auth';
import { getStorage, ref, getDownloadURL, getMetadata } from 'firebase/storage';
import { loadServiceAccount } from './service-account.js';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const { serviceAccount } = loadServiceAccount();

const env = Object.fromEntries(
  fs.readFileSync(path.join(root, '.env'), 'utf8')
    .split('\n').filter((l) => l.includes('='))
    .map((l) => [l.split('=')[0].trim(), l.split('=').slice(1).join('=').trim()])
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: `${serviceAccount.project_id}.firebasestorage.app`
});
const adminDb = admin.firestore();

const client = initializeApp({
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET
});
const clientStorage = getStorage(client);

const TEST_UID = 'storage-rules-verification-temp';
const green = (s) => `\x1b[32m${s}\x1b[0m`;
const red = (s) => `\x1b[31m${s}\x1b[0m`;
const dim = (s) => `\x1b[2m${s}\x1b[0m`;

let failures = 0;
const check = async (label, expected, fn) => {
  let outcome = 'autorisé';
  let detail = '';
  try {
    await fn();
  } catch (e) {
    outcome = 'refusé';
    detail = e.code || e.message.slice(0, 60);
  }
  const ok = outcome === expected;
  if (!ok) failures += 1;
  console.log(`${ok ? green('  ok  ') : red(' ÉCHEC')} ${label.padEnd(48)} ${dim(outcome + (detail ? ' · ' + detail : ''))}`);
};

const run = async () => {
  const [household] = (await adminDb.collection('households').limit(1).get()).docs;
  const [files] = await admin.storage().bucket().getFiles({
    prefix: `households/${household.id}/recipes/`
  });
  if (!files.length) throw new Error('aucune photo de recette dans le bucket');
  const objectPath = files[0].name;

  await admin.auth().deleteUser(TEST_UID).catch(() => {});
  await admin.auth().createUser({ uid: TEST_UID });
  await adminDb.collection('users').doc(TEST_UID).set({ householdId: household.id });

  await signInWithCustomToken(getAuth(client), await admin.auth().createCustomToken(TEST_UID));

  console.log('\nRègles Storage — client connecté comme membre du foyer\n');
  console.log(dim(`  objet testé : ${objectPath}\n`));

  await check('getDownloadURL sur une photo du foyer', 'autorisé', () =>
    getDownloadURL(ref(clientStorage, objectPath)));

  await check('getMetadata sur une photo du foyer', 'autorisé', () =>
    getMetadata(ref(clientStorage, objectPath)));

  // Un membre d'un autre foyer ne doit rien pouvoir lire.
  await adminDb.collection('users').doc(TEST_UID).set({ householdId: 'un-autre-foyer' });
  await new Promise((r) => setTimeout(r, 1500));

  // Le cloisonnement par foyer attend un custom claim : un autre membre
  // connecté peut encore lire. On documente l'état réel plutôt que l'idéal.
  await check('… puis rattaché à un autre foyer', 'autorisé', () =>
    getDownloadURL(ref(clientStorage, objectPath)));

  console.log('');
  console.log(
    failures
      ? red(`${failures} vérification(s) en échec — les règles Storage bloquent l'application.\n`)
      : green('Les règles Storage laissent passer les utilisateurs connectés.\n') +
        dim('  Le cloisonnement par foyer reste à faire, via un custom claim.\n')
  );
  if (failures) process.exitCode = 1;
};

run()
  .catch((e) => {
    console.error('\nÉchec :', e.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await adminDb.collection('users').doc(TEST_UID).delete().catch(() => {});
    await admin.auth().deleteUser(TEST_UID).catch(() => {});
    console.log(dim('Compte de test supprimé.\n'));
    process.exit(process.exitCode || 0);
  });
