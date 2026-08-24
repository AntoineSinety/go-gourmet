import { AISLE_NAMES } from './shoppingAisles';

const DAY_KEYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

/**
 * Construit la liste de courses à partir du planning.
 *
 * Règles reprises telles quelles du comportement existant :
 * - seuls les repas d'aujourd'hui et à venir comptent ;
 * - un repas marqué `skipShoppingList` est ignoré ;
 * - un plat étalé sur plusieurs jours n'est compté qu'une fois ;
 * - les quantités sont ajustées au ratio de portions du créneau ;
 * - les items permanents rejoignent leur rayon ; le tri entre cochés et non
 *   cochés est fait à l'affichage.
 *
 * @returns {Array<{ category: string, items: Array }>} rayons triés dans l'ordre du magasin
 */
export const buildShoppingList = (mealPlan, recipes, permanentItems, checkedItems = {}) => {
  if (!mealPlan || !recipes?.length) return [];

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const futureMeals = [];
  const processedMultiDay = new Set();

  Object.entries(mealPlan.meals || {}).forEach(([slotId, meal]) => {
    const [dayKey] = slotId.split('_');
    const dayIndex = DAY_KEYS.indexOf(dayKey);

    const mealDate = new Date(mealPlan.startDate);
    mealDate.setDate(mealDate.getDate() + dayIndex);
    mealDate.setHours(0, 0, 0, 0);

    if (mealDate < today) return;
    if (meal.skipShoppingList) return;

    if (meal.isMultiDay) {
      const multiDayKey = meal.multiDayMealIds?.slice().sort().join('_');
      if (processedMultiDay.has(multiDayKey)) return;
      processedMultiDay.add(multiDayKey);
    }

    futureMeals.push({ ...meal, slotId, date: mealDate });
  });

  mealPlan.extras?.forEach(extra => {
    futureMeals.push({ ...extra, isExtra: true });
  });

  // Agrégation par (nom, unité)
  const ingredientMap = {};

  futureMeals.forEach(meal => {
    const recipe = recipes.find(r => r.id === meal.recipeId);
    if (!recipe?.ingredients) return;

    const servingsRatio = meal.servings / (recipe.servings || 1);

    recipe.ingredients.forEach(ingredient => {
      const key = `${ingredient.name}_${ingredient.unit || ''}`;

      if (!ingredientMap[key]) {
        ingredientMap[key] = {
          name: ingredient.name,
          unit: ingredient.unit || '',
          quantity: 0,
          category: ingredient.category || 'Autres',
          fromRecipes: []
        };
      }

      ingredientMap[key].quantity += (ingredient.quantity || 0) * servingsRatio;
      ingredientMap[key].fromRecipes.push(recipe.name);
    });
  });

  const grouped = Object.values(ingredientMap).reduce((acc, item) => {
    (acc[item.category] ||= []).push(item);
    return acc;
  }, {});

  const permanent = permanentItems || [];

  permanent.forEach(item => {
    (grouped[item.category] ||= []).push({ ...item, isPermanent: true, fromRecipes: [] });
  });

  const orderOf = (category) => {
    const index = AISLE_NAMES.indexOf(category);
    return index === -1 ? AISLE_NAMES.length : index;
  };

  return Object.entries(grouped)
    .map(([category, items]) => ({
      category,
      items: items.slice().sort((a, b) => a.name.localeCompare(b.name, 'fr'))
    }))
    .sort((a, b) => orderOf(a.category) - orderOf(b.category) || a.category.localeCompare(b.category, 'fr'));
};

/** Clé de coche d'un article : les items permanents ont un id stable, les autres non. */
export const itemKey = (category, item) =>
  item.isPermanent ? item.id : `${category}_${item.name}`;

/** Nombre d'articles restant à cocher, pour le badge de l'onglet Courses. */
export const countRemaining = (list, checkedItems = {}) =>
  list.reduce(
    (total, { category, items }) =>
      total + items.filter(item => !checkedItems[itemKey(category, item)]).length,
    0
  );

/** Nombre total d'articles de la liste, cochés compris. */
export const countTotal = (list) =>
  list.reduce((total, { items }) => total + items.length, 0);
