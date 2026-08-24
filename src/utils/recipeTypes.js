export const RECIPE_TYPES = [
  { id: 'entree', label: 'Entrée', icon: '🥗', tone: 'green' },
  { id: 'plat', label: 'Plat', icon: '🍽️', tone: 'neutral' },
  { id: 'dessert', label: 'Dessert', icon: '🍰', tone: 'pink' },
  { id: 'appetizer', label: 'Apéritif', icon: '🥂', tone: 'purple' },
  { id: 'breakfast', label: 'Petit-déjeuner', icon: '🥐', tone: 'amber' },
  { id: 'snack', label: 'Goûter', icon: '🍪', tone: 'yellow' }
];

export const getRecipeTypeById = (id) => {
  return RECIPE_TYPES.find(type => type.id === id);
};
