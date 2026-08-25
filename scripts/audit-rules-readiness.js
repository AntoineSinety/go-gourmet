/**
 * Audit en LECTURE SEULE : vérifie que le durcissement des règles Firestore
 * n'enfermera aucun document existant.
 *
 * Les nouvelles règles cloisonnent chaque collection par `householdId`.
 * Un document historique dépourvu de ce champ deviendrait illisible pour tout
 * le monde. Ce script les recense avant tout déploiement.
 *
 * Aucune écriture n'est effectuée.
 *
 *   node scripts/audit-rules-readiness.js
 */
import admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const keyPath =
  process.env.GOOGLE_APPLICATION_CREDENTIALS ||
  path.join(__dirname, 'serviceAccountKey.json');

if (!fs.existsSync(keyPath)) {
  console.error(`Clé de service introuvable : ${keyPath}`);
  console.error('Définissez GOOGLE_APPLICATION_CREDENTIALS ou placez la clé dans scripts/.');
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(JSON.parse(fs.readFileSync(keyPath, 'utf8')))
});

const db = admin.firestore();

/** Collections cloisonnées par un champ `householdId` sur le document. */
const SCOPED_BY_FIELD = ['recipes', 'ingredients', 'mealPlans', 'mealPlanTemplates'];

/** Collections dont l'identifiant du document EST l'identifiant du foyer. */
const SCOPED_BY_DOC_ID = ['permanentShoppingItems'];

const dim = (s) => `\x1b[2m${s}\x1b[0m`;
const red = (s) => `\x1b[31m${s}\x1b[0m`;
const green = (s) => `\x1b[32m${s}\x1b[0m`;
const yellow = (s) => `\x1b[33m${s}\x1b[0m`;

const run = async () => {
  console.log('\nAudit de compatibilité des règles durcies\n');

  const households = await db.collection('households').get();
  const householdIds = new Set(households.docs.map((d) => d.id));
  console.log(`Foyers : ${householdIds.size}`);

  const users = await db.collection('users').get();
  const orphanUsers = users.docs.filter((d) => {
    const hid = d.data().householdId;
    return hid && !householdIds.has(hid);
  });
  console.log(`Utilisateurs : ${users.size}` +
    (orphanUsers.length ? red(` · ${orphanUsers.length} pointent vers un foyer inexistant`) : ''));

  console.log('');
  let blocking = 0;

  for (const name of SCOPED_BY_FIELD) {
    const snap = await db.collection(name).get();
    const missing = [];
    const dangling = [];

    snap.forEach((doc) => {
      const hid = doc.data().householdId;
      if (!hid) missing.push(doc.id);
      else if (hid !== 'global' && !householdIds.has(hid)) dangling.push(`${doc.id} → ${hid}`);
    });

    blocking += missing.length;

    const status = missing.length ? red('BLOQUANT') : green('ok');
    console.log(`${name.padEnd(22)} ${String(snap.size).padStart(4)} doc(s)   ${status}`);

    if (missing.length) {
      console.log(red(`  ${missing.length} sans householdId — deviendraient illisibles :`));
      console.log(dim(`    ${missing.slice(0, 10).join(', ')}${missing.length > 10 ? ' …' : ''}`));
    }
    if (dangling.length) {
      console.log(yellow(`  ${dangling.length} rattaché(s) à un foyer inexistant (déjà inaccessibles aujourd'hui) :`));
      console.log(dim(`    ${dangling.slice(0, 5).join(', ')}${dangling.length > 5 ? ' …' : ''}`));
    }
  }

  for (const name of SCOPED_BY_DOC_ID) {
    const snap = await db.collection(name).get();
    const bad = snap.docs.filter((d) => !householdIds.has(d.id)).map((d) => d.id);

    blocking += bad.length;

    const status = bad.length ? red('BLOQUANT') : green('ok');
    console.log(`${name.padEnd(22)} ${String(snap.size).padStart(4)} doc(s)   ${status}`);

    if (bad.length) {
      console.log(red(`  ${bad.length} dont l'identifiant n'est pas un foyer connu :`));
      console.log(dim(`    ${bad.slice(0, 10).join(', ')}`));
    }
  }

  // Le champ `members` sert de base aux règles : il doit contenir des uid en
  // chaîne, alors que l'écran Réglages y écrit des objets { id, name }.
  console.log('');
  let mixed = 0;
  households.forEach((doc) => {
    const members = doc.data().members;
    if (!Array.isArray(members)) return;
    if (members.some((m) => typeof m !== 'string')) mixed += 1;
  });
  console.log(
    mixed
      ? yellow(`members : ${mixed} foyer(s) contiennent des objets et non des uid (voir F4)`)
      : green('members : tous les foyers ne contiennent que des uid')
  );

  console.log('');
  if (blocking) {
    console.log(red(`${blocking} document(s) seraient rendus inaccessibles. Migration requise avant déploiement.`));
    process.exitCode = 1;
  } else {
    console.log(green('Aucun document ne serait enfermé. Les règles durcies peuvent être déployées.'));
  }
  console.log('');
};

run().catch((error) => {
  console.error('\nÉchec de l’audit :', error.message);
  process.exit(1);
});
