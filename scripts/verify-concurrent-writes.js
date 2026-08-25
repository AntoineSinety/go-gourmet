/**
 * Vérifie que deux membres qui écrivent en même temps ne s'effacent plus.
 *
 * Reproduit le scénario du bug F1 sur un document de test : deux clients
 * partent du même état, puis écrivent chacun de leur côté. Avec l'ancienne
 * approche (réécriture de la map entière), le second écrasait le premier.
 *
 * Le document de test est supprimé en fin d'exécution.
 *
 *   node scripts/verify-concurrent-writes.js
 */
import admin from 'firebase-admin';
import { loadServiceAccount } from './service-account.js';

const { serviceAccount } = loadServiceAccount();
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });

const db = admin.firestore();
const { FieldPath, FieldValue } = admin.firestore;

// Firestore réserve les identifiants encadrés de doubles tirets bas.
const TEST_DOC = 'zz-verification-ecritures-concurrentes';
const ref = db.collection('mealPlans').doc(TEST_DOC);

const green = (s) => `\x1b[32m${s}\x1b[0m`;
const red = (s) => `\x1b[31m${s}\x1b[0m`;
const dim = (s) => `\x1b[2m${s}\x1b[0m`;

let failures = 0;
const check = (label, condition, detail) => {
  if (!condition) failures += 1;
  console.log(`${condition ? green('  ok  ') : red(' ÉCHEC')} ${label}`);
  if (detail) console.log(dim(`        ${detail}`));
};

const run = async () => {
  console.log('\nÉcritures concurrentes sur le planning\n');

  // État de départ, vu par les deux clients.
  await ref.set({
    householdId: 'zz-verification',
    meals: { monday_lunch: { recipeName: 'Existant' } },
    checkedItems: {}
  });

  // --- Deux membres écrivent des créneaux différents ----------------------
  // Antoine et Marie sont partis du même snapshot ; Marie écrit après lui.
  await ref.update(new FieldPath('meals', 'tuesday_lunch'), { recipeName: 'Ajout Antoine' });
  await ref.update(new FieldPath('meals', 'wednesday_dinner'), { recipeName: 'Ajout Marie' });

  let meals = (await ref.get()).data().meals;

  check('Le repas d’Antoine survit à l’écriture de Marie',
    meals.tuesday_lunch?.recipeName === 'Ajout Antoine',
    `tuesday_lunch = ${JSON.stringify(meals.tuesday_lunch)}`);

  check('Le repas de Marie est bien enregistré',
    meals.wednesday_dinner?.recipeName === 'Ajout Marie');

  check('Le créneau préexistant n’a pas été emporté',
    meals.monday_lunch?.recipeName === 'Existant');

  // --- Suppression ciblée --------------------------------------------------
  await ref.update(new FieldPath('meals', 'tuesday_lunch'), FieldValue.delete());
  meals = (await ref.get()).data().meals;

  check('Vider un créneau ne touche que celui-là',
    meals.tuesday_lunch === undefined && meals.wednesday_dinner?.recipeName === 'Ajout Marie');

  // --- Cochage concurrent en magasin --------------------------------------
  // Clés réalistes : espaces, accents, esperluette.
  const k1 = 'Fruits & Légumes_Champignons de Paris';
  const k2 = 'Produits laitiers_Crème fraîche';

  await ref.update(new FieldPath('checkedItems', k1), true);
  await ref.update(new FieldPath('checkedItems', k2), true);

  let checked = (await ref.get()).data().checkedItems;

  check('Deux personnes cochent en même temps : les deux coches tiennent',
    checked[k1] === true && checked[k2] === true,
    `${Object.keys(checked).length} clé(s) : ${Object.keys(checked).join(' · ')}`);

  check('Les clés à espaces, accents et « & » sont écrites telles quelles',
    Object.prototype.hasOwnProperty.call(checked, k1));

  // --- Décochage ciblé -----------------------------------------------------
  await ref.update(new FieldPath('checkedItems', k1), FieldValue.delete());
  checked = (await ref.get()).data().checkedItems;

  check('Décocher un article laisse les autres cochés',
    checked[k1] === undefined && checked[k2] === true);

  console.log('');
  if (failures) {
    console.log(red(`${failures} vérification(s) en échec.\n`));
    process.exitCode = 1;
  } else {
    console.log(green('Les écritures fusionnent : plus de perte silencieuse entre membres.\n'));
  }
};

run()
  .catch((e) => {
    console.error('\nÉchec :', e.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await ref.delete().catch(() => {});
    console.log(dim('Document de test supprimé.\n'));
    process.exit(process.exitCode || 0);
  });
