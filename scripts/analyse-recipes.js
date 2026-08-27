/**
 * Analyse du catalogue existant : style d'écriture, granularité des étapes,
 * vocabulaire d'ingrédients, conventions de portions et d'unités.
 *
 * Sert de référence avant d'ajouter de nouvelles recettes, pour qu'elles
 * s'intègrent au lieu de détonner.
 *
 *   node scripts/analyse-recipes.js
 */
import admin from 'firebase-admin';
import { loadServiceAccount } from './service-account.js';

const { serviceAccount } = loadServiceAccount();
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

const dim = (s) => `\x1b[2m${s}\x1b[0m`;
const bold = (s) => `\x1b[1m${s}\x1b[0m`;

const recipes = (await db.collection('recipes').get()).docs.map((d) => ({ id: d.id, ...d.data() }));
const ingredients = (await db.collection('ingredients').get()).docs.map((d) => ({ id: d.id, ...d.data() }));

console.log(bold(`\n${recipes.length} recettes · ${ingredients.length} ingrédients au catalogue\n`));

for (const r of recipes) {
  const steps = r.steps || [];
  const ings = r.ingredients || [];
  console.log(bold(`── ${r.name}`));
  console.log(
    dim(`   ${r.type} · ${r.servings} pers. · ${ings.length} ingrédients · ${steps.length} étapes` +
        ` · tags: ${(r.tags || []).join(', ') || '—'}`)
  );

  console.log(dim('   ingrédients :'));
  ings.forEach((i) => {
    const q = i.quantity != null ? `${i.quantity} ${i.unit || ''}`.trim() : '—';
    console.log(`     ${String(q).padEnd(16)} ${i.name}   ${dim(i.category || '?')}`);
  });

  console.log(dim('   étapes :'));
  steps.forEach((s, n) => {
    const attached = (s.ingredientIds || []).length;
    console.log(`     ${n + 1}. ${(s.instruction || '').replace(/\s+/g, ' ')}` +
      (attached ? dim(`  [${attached} ingr. rattaché(s)]`) : dim('  [aucun rattachement]')));
  });
  console.log('');
}

// ---- Statistiques transverses ---------------------------------------------
const stepLengths = recipes.flatMap((r) => (r.steps || []).map((s) => (s.instruction || '').length));
const avg = (a) => Math.round(a.reduce((x, y) => x + y, 0) / a.length);

console.log(bold('── Conventions observées\n'));
console.log(`Longueur moyenne d'une étape : ${avg(stepLengths)} caractères ` +
  dim(`(min ${Math.min(...stepLengths)}, max ${Math.max(...stepLengths)})`));
console.log(`Étapes par recette           : ${avg(recipes.map((r) => (r.steps || []).length))}`);
console.log(`Ingrédients par recette      : ${avg(recipes.map((r) => (r.ingredients || []).length))}`);
console.log(`Portions                     : ${[...new Set(recipes.map((r) => r.servings))].sort().join(', ')}`);

const attached = recipes.flatMap((r) => (r.steps || [])).filter((s) => (s.ingredientIds || []).length).length;
const totalSteps = recipes.flatMap((r) => r.steps || []).length;
console.log(`Étapes avec ingrédients liés : ${attached}/${totalSteps}`);

const units = {};
recipes.flatMap((r) => r.ingredients || []).forEach((i) => { units[i.unit || '—'] = (units[i.unit || '—'] || 0) + 1; });
console.log(`Unités utilisées             : ${Object.entries(units).sort((a,b)=>b[1]-a[1]).map(([u,n]) => `${u}(${n})`).join(' ')}`);

const types = {};
recipes.forEach((r) => { types[r.type || '?'] = (types[r.type || '?'] || 0) + 1; });
console.log(`Types                        : ${Object.entries(types).map(([t,n]) => `${t}(${n})`).join(' ')}`);

const tagCount = {};
recipes.flatMap((r) => r.tags || []).forEach((t) => { tagCount[t] = (tagCount[t] || 0) + 1; });
console.log(`Tags                         : ${Object.entries(tagCount).map(([t,n]) => `${t}(${n})`).join(' ') || '— aucun'}`);

// ---- Catalogue d'ingrédients ----------------------------------------------
console.log(bold('\n── Catalogue d\'ingrédients par catégorie\n'));
const byCat = {};
ingredients.forEach((i) => { (byCat[i.category] ||= []).push(i.name); });
Object.entries(byCat).sort().forEach(([c, names]) => {
  console.log(`${c} ${dim(`(${names.length})`)}`);
  console.log(dim('  ' + names.sort((a, b) => a.localeCompare(b, 'fr')).join(' · ')));
});

const used = new Set(recipes.flatMap((r) => (r.ingredients || []).map((i) => i.ingredientId)));
console.log(`\nIngrédients jamais utilisés dans une recette : ${ingredients.length - used.size}/${ingredients.length}`);

process.exit(0);
