/**
 * Rayons de la liste de courses (8), distincts des catégories d'ingrédients.
 * L'ordre est celui du parcours en magasin, tel que défini dans le canvas.
 */
export const SHOPPING_AISLES = [
  { id: 'Fruits & Légumes', label: 'Fruits & Légumes', icon: '🥬', tone: 'green' },
  { id: 'Viandes & Poissons', label: 'Viandes & Poissons', icon: '🥩', tone: 'red' },
  { id: 'Produits laitiers', label: 'Produits laitiers', icon: '🧀', tone: 'yellow' },
  { id: 'Épicerie', label: 'Épicerie', icon: '🍝', tone: 'amber' },
  { id: 'Surgelés', label: 'Surgelés', icon: '❄️', tone: 'teal' },
  { id: 'Boissons', label: 'Boissons', icon: '🥤', tone: 'sky' },
  { id: 'Boulangerie', label: 'Boulangerie', icon: '🥖', tone: 'purple' },
  { id: 'Autres', label: 'Autres', icon: '📦', tone: 'neutral' }
];

export const CHECKED_AISLE = { id: '✓ Cochés', label: 'Cochés', icon: '✅', tone: 'green' };

export const AISLE_NAMES = SHOPPING_AISLES.map(a => a.id);

export const getAisle = (id) =>
  SHOPPING_AISLES.find(a => a.id === id) ||
  (id === CHECKED_AISLE.id ? CHECKED_AISLE : SHOPPING_AISLES[SHOPPING_AISLES.length - 1]);
