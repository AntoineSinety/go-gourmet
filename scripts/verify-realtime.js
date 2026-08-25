/**
 * Vérifie que l'écoute en direct fonctionne côté client, règles comprises.
 *
 * Un client Firebase réel (même SDK que l'application, authentifié comme un
 * membre du foyer) s'abonne à un document ; l'admin écrit dedans ; on mesure
 * si la notification arrive. C'est ce qui distingue « Marie ajoute une recette
 * et Antoine la voit » de « … et Antoine doit recharger ».
 *
 * Tout ce qui est créé ici est supprimé en fin d'exécution.
 *
 *   node scripts/verify-realtime.js
 */
import admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithCustomToken } from 'firebase/auth';
import {
  getFirestore,
  doc,
  onSnapshot,
  collection,
  query,
  where,
  onSnapshot as onQuerySnapshot
} from 'firebase/firestore';
import { loadServiceAccount } from './service-account.js';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const { serviceAccount } = loadServiceAccount();

const env = Object.fromEntries(
  fs
    .readFileSync(path.join(root, '.env'), 'utf8')
    .split('\n')
    .filter((l) => l.includes('='))
    .map((l) => [l.split('=')[0].trim(), l.split('=').slice(1).join('=').trim()])
);

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const adminDb = admin.firestore();

const client = initializeApp({
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID
});
const clientDb = getFirestore(client);

const TEST_UID = 'realtime-verification-temp';
const TEST_PLAN = 'zz-verification-temps-reel';
const TEST_RECIPE = 'zz-verification-recette';

const green = (s) => `\x1b[32m${s}\x1b[0m`;
const red = (s) => `\x1b[31m${s}\x1b[0m`;
const dim = (s) => `\x1b[2m${s}\x1b[0m`;

let failures = 0;
const check = (label, ok, detail) => {
  if (!ok) failures += 1;
  console.log(`${ok ? green('  ok  ') : red(' ÉCHEC')} ${label}`);
  if (detail) console.log(dim(`        ${detail}`));
};

/** Attend qu'une notification satisfasse `predicate`, ou expire. */
const waitFor = (subscribe, predicate, timeout = 8000) =>
  new Promise((resolve) => {
    const started = Date.now();
    let unsubscribe = () => {};
    const timer = setTimeout(() => {
      unsubscribe();
      resolve({ ok: false, ms: timeout });
    }, timeout);

    unsubscribe = subscribe((value) => {
      if (!predicate(value)) return;
      clearTimeout(timer);
      unsubscribe();
      resolve({ ok: true, ms: Date.now() - started });
    });
  });

const run = async () => {
  const [household] = (await adminDb.collection('households').limit(1).get()).docs;

  await admin.auth().deleteUser(TEST_UID).catch(() => {});
  await admin.auth().createUser({ uid: TEST_UID });
  await adminDb.collection('users').doc(TEST_UID).set({ householdId: household.id });

  const token = await admin.auth().createCustomToken(TEST_UID);
  await signInWithCustomToken(getAuth(client), token);

  console.log('\nÉcoute en direct — client authentifié comme membre du foyer\n');

  // --- Le planning ---------------------------------------------------------
  await adminDb.collection('mealPlans').doc(TEST_PLAN).set({
    householdId: household.id,
    meals: {},
    checkedItems: {}
  });

  const planPromise = waitFor(
    (cb) => onSnapshot(doc(clientDb, 'mealPlans', TEST_PLAN), (s) => cb(s.data())),
    (data) => data?.meals?.friday_dinner?.recipeName === 'Ajouté par l’autre membre'
  );

  // Laisse l'abonnement s'établir avant d'écrire.
  await new Promise((r) => setTimeout(r, 1200));
  await adminDb
    .collection('mealPlans')
    .doc(TEST_PLAN)
    .update('meals.friday_dinner', { recipeName: 'Ajouté par l’autre membre' });

  const planResult = await planPromise;
  check(
    'Un repas ajouté par l’autre membre arrive sans rechargement',
    planResult.ok,
    planResult.ok ? `reçu en ${planResult.ms} ms` : 'aucune notification en 8 s'
  );

  // --- Les articles cochés en magasin --------------------------------------
  const checkPromise = waitFor(
    (cb) => onSnapshot(doc(clientDb, 'mealPlans', TEST_PLAN), (s) => cb(s.data())),
    (data) => data?.checkedItems?.['Fruits & Légumes_Citrons'] === true
  );

  await new Promise((r) => setTimeout(r, 800));
  await adminDb
    .collection('mealPlans')
    .doc(TEST_PLAN)
    .update(new admin.firestore.FieldPath('checkedItems', 'Fruits & Légumes_Citrons'), true);

  const checkResult = await checkPromise;
  check(
    'Un article coché par l’autre membre arrive en direct',
    checkResult.ok,
    checkResult.ok ? `reçu en ${checkResult.ms} ms` : 'aucune notification en 8 s'
  );

  // --- Les recettes (requête, pas document unique) -------------------------
  const recipePromise = waitFor(
    (cb) =>
      onQuerySnapshot(
        query(collection(clientDb, 'recipes'), where('householdId', '==', household.id)),
        (snap) => cb(snap.docs.map((d) => d.data().name))
      ),
    (names) => names.includes('Recette de vérification')
  );

  await new Promise((r) => setTimeout(r, 1200));
  await adminDb.collection('recipes').doc(TEST_RECIPE).set({
    householdId: household.id,
    name: 'Recette de vérification',
    createdAt: new Date().toISOString()
  });

  const recipeResult = await recipePromise;
  check(
    'Une recette ajoutée par l’autre membre apparaît dans la liste',
    recipeResult.ok,
    recipeResult.ok ? `reçu en ${recipeResult.ms} ms` : 'aucune notification en 8 s'
  );

  console.log('');
  if (failures) {
    console.log(red(`${failures} vérification(s) en échec.\n`));
    process.exitCode = 1;
  } else {
    console.log(green('Le partage est effectif : les deux écrans restent synchronisés.\n'));
  }
};

const cleanup = async () => {
  await adminDb.collection('mealPlans').doc(TEST_PLAN).delete().catch(() => {});
  await adminDb.collection('recipes').doc(TEST_RECIPE).delete().catch(() => {});
  await adminDb.collection('users').doc(TEST_UID).delete().catch(() => {});
  await admin.auth().deleteUser(TEST_UID).catch(() => {});
  console.log(dim('Données de test supprimées.\n'));
};

run()
  .catch((e) => {
    console.error('\nÉchec :', e.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await cleanup();
    process.exit(process.exitCode || 0);
  });
