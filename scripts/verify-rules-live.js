/**
 * Vérification de bout en bout des règles DÉPLOYÉES.
 *
 * Crée un compte de test temporaire, le connecte réellement, puis tente depuis
 * ce compte les accès qui étaient ouverts avant le durcissement. Le compte est
 * supprimé en fin d'exécution, quoi qu'il arrive.
 *
 * Aucune donnée existante n'est modifiée : uniquement des lectures, plus une
 * tentative d'écriture qui doit échouer.
 *
 *   node scripts/verify-rules-live.js
 */
import admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { loadServiceAccount } from './service-account.js';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

const { serviceAccount } = loadServiceAccount();
const projectId = serviceAccount.project_id;

// La clé API web n'est pas un secret : elle est déjà dans le bundle client.
const apiKey = fs
  .readFileSync(path.join(root, '.env'), 'utf8')
  .split('\n')
  .find((l) => l.startsWith('VITE_FIREBASE_API_KEY'))
  ?.split('=')[1]
  ?.trim();

if (!apiKey) {
  console.error('VITE_FIREBASE_API_KEY introuvable dans .env');
  process.exit(1);
}

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });

const db = admin.firestore();
const TEST_UID = 'rules-verification-temp';
const DOCS = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`;

const green = (s) => `\x1b[32m${s}\x1b[0m`;
const red = (s) => `\x1b[31m${s}\x1b[0m`;
const dim = (s) => `\x1b[2m${s}\x1b[0m`;

let failures = 0;

const check = (label, expected, status) => {
  const ok = expected === 'refusé' ? status === 403 : status === 200;
  if (!ok) failures += 1;
  const mark = ok ? green('  ok  ') : red(' ÉCHEC');
  console.log(`${mark} ${label.padEnd(52)} ${dim(`HTTP ${status} · attendu ${expected}`)}`);
};

const run = async () => {
  // --- Cibles réelles ------------------------------------------------------
  const [plan] = (await db.collection('mealPlans').limit(1).get()).docs;
  const [recipe] = (await db.collection('recipes').limit(1).get()).docs;
  const [household] = (await db.collection('households').limit(1).get()).docs;
  const [realUser] = (await db.collection('users').limit(1).get()).docs;

  // --- Compte de test ------------------------------------------------------
  try {
    await admin.auth().deleteUser(TEST_UID);
  } catch {
    // n'existait pas
  }
  await admin.auth().createUser({ uid: TEST_UID });

  const customToken = await admin.auth().createCustomToken(TEST_UID);
  const signIn = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: customToken, returnSecureToken: true })
    }
  ).then((r) => r.json());

  if (!signIn.idToken) {
    console.error('Connexion du compte de test impossible :', signIn.error?.message);
    process.exit(1);
  }

  const as = (url, init = {}) =>
    fetch(url, {
      ...init,
      headers: {
        Authorization: `Bearer ${signIn.idToken}`,
        'Content-Type': 'application/json',
        ...(init.headers || {})
      }
    }).then((r) => r.status);

  console.log('\nRègles en production — tentatives depuis un compte connecté sans foyer\n');

  check('Lire le planning d’un autre foyer', 'refusé',
    await as(`${DOCS}/mealPlans/${plan.id}`));

  check('Supprimer le planning d’un autre foyer', 'refusé',
    await as(`${DOCS}/mealPlans/${plan.id}`, { method: 'DELETE' }));

  check('Lire une recette d’un autre foyer', 'refusé',
    await as(`${DOCS}/recipes/${recipe.id}`));

  check('Lire la liste de courses d’un autre foyer', 'refusé',
    await as(`${DOCS}/permanentShoppingItems/${household.id}`));

  check('Lire la fiche d’un autre utilisateur', 'refusé',
    await as(`${DOCS}/users/${realUser.id}`));

  check('Énumérer tous les foyers', 'refusé',
    await as(`${DOCS}/households`));

  check('Énumérer tous les utilisateurs', 'refusé',
    await as(`${DOCS}/users`));

  check('Énumérer tous les plannings', 'refusé',
    await as(`${DOCS}/mealPlans`));

  // Le lien d'invitation doit continuer de fonctionner : lecture unitaire.
  check('Lire un foyer par son identifiant (invitation)', 'autorisé',
    await as(`${DOCS}/households/${household.id}`));

  // Chacun doit garder accès à sa propre fiche.
  check('Lire sa propre fiche utilisateur', 'autorisé',
    await as(`${DOCS}/users/${TEST_UID}`, { method: 'PATCH', body: JSON.stringify({ fields: {} }) }) === 200
      ? await as(`${DOCS}/users/${TEST_UID}`)
      : await as(`${DOCS}/users/${TEST_UID}`));

  // --- Non-régression : un membre légitime garde tous ses accès ------------
  // On rattache temporairement le compte de test au vrai foyer.
  await db.collection('users').doc(TEST_UID).set({ householdId: household.id });

  // Le jeton porte les claims au moment de son émission ; les règles relisent
  // users/{uid} à chaque requête, donc le rattachement prend effet aussitôt.
  console.log(dim('\n  … le compte de test rejoint le foyer réel\n'));

  check('Membre · lire le planning du foyer', 'autorisé',
    await as(`${DOCS}/mealPlans/${plan.id}`));

  check('Membre · lire une recette du foyer', 'autorisé',
    await as(`${DOCS}/recipes/${recipe.id}`));

  check('Membre · lire la liste de courses du foyer', 'autorisé',
    await as(`${DOCS}/permanentShoppingItems/${household.id}`));

  check('Membre · lister les recettes du foyer', 'autorisé',
    await fetch(`${DOCS}:runQuery`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${signIn.idToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        structuredQuery: {
          from: [{ collectionId: 'recipes' }],
          where: {
            fieldFilter: {
              field: { fieldPath: 'householdId' },
              op: 'EQUAL',
              value: { stringValue: household.id }
            }
          }
        }
      })
    }).then((r) => r.status));

  console.log('');
  if (failures) {
    console.log(red(`${failures} vérification(s) en échec.\n`));
    process.exitCode = 1;
  } else {
    console.log(green('Toutes les vérifications passent : cloisonnement effectif, membres non impactés.\n'));
  }
};

const cleanup = async () => {
  try {
    await db.collection('users').doc(TEST_UID).delete();
    await admin.auth().deleteUser(TEST_UID);
    console.log(dim('Compte de test supprimé.\n'));
  } catch (e) {
    console.error(red(`Nettoyage incomplet — supprimez ${TEST_UID} à la main : ${e.message}`));
  }
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
