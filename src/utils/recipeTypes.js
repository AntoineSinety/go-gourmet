export const RECIPE_TYPES = [
  { id: 'entree', label: 'Entrée', icon: '🥗' },
  { id: 'plat', label: 'Plat', icon: '🍽️' },
  { id: 'dessert', label: 'Dessert', icon: '🍰' },
  { id: 'appetizer', label: 'Apéritif', icon: '🥂' },
  { id: 'breakfast', label: 'Petit-déjeuner', icon: '🥐' },
  { id: 'snack', label: 'Goûter', icon: '🍪' }
];

export const getRecipeTypeById = (id) => {
  return RECIPE_TYPES.find(type => type.id === id);
};
