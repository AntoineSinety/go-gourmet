/**
 * Sélection du lot de recettes à importer.
 *
 * Les lots sont figés une fois insérés : on en ajoute un nouveau plutôt que
 * de modifier le précédent, pour que relancer un import reste sans surprise.
 */
const BATCHES = ['./recipes-batch-1.js', './recipes-batch-2.js'];

/** `--batch=N` (1-indexé) ; par défaut, le dernier lot. */
export const loadBatch = async (argv = process.argv) => {
  const flag = argv.find((a) => a.startsWith('--batch='));
  const index = flag ? Number(flag.split('=')[1]) - 1 : BATCHES.length - 1;

  if (!Number.isInteger(index) || index < 0 || index >= BATCHES.length) {
    throw new Error(`lot inconnu : choisissez --batch=1 à ${BATCHES.length}`);
  }

  const module = await import(BATCHES[index]);
  return { number: index + 1, RECIPES: module.RECIPES, NEW_INGREDIENTS: module.NEW_INGREDIENTS };
};

/** Tous les lots réunis — utile pour rattraper des photos manquantes. */
export const loadAllBatches = async () => {
  const modules = await Promise.all(BATCHES.map((p) => import(p)));
  return {
    RECIPES: modules.flatMap((m) => m.RECIPES),
    NEW_INGREDIENTS: modules.flatMap((m) => m.NEW_INGREDIENTS)
  };
};
