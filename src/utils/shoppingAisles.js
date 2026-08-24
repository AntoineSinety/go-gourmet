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

/**
 * Les recettes stockent la catégorie d'ingrédient (11 valeurs), la liste de
 * courses raisonne en rayons de magasin (8). Cette table fait le pont ;
 * plusieurs catégories retombent volontairement sur « Épicerie ».
 */
const CATEGORY_TO_AISLE = {
  'fruits-legumes': 'Fruits & Légumes',
  'viandes-poissons': 'Viandes & Poissons',
  'produits-laitiers': 'Produits laitiers',
  'epicerie-salee': 'Épicerie',
  'epicerie-sucree': 'Épicerie',
  condiments: 'Épicerie',
  conserves: 'Épicerie',
  surgeles: 'Surgelés',
  boissons: 'Boissons',
  'pain-viennoiserie': 'Boulangerie',
  autres: 'Autres'
};

/**
 * Ramène une valeur de catégorie à un rayon. Accepte déjà un nom de rayon
 * (cas des articles ajoutés à la main) ou un identifiant de catégorie
 * d'ingrédient ; tout le reste tombe dans « Autres ».
 */
export const toAisle = (category) => {
  if (!category) return 'Autres';
  if (AISLE_NAMES.includes(category)) return category;
  return CATEGORY_TO_AISLE[category] || 'Autres';
};

export const getAisle = (id) =>
  SHOPPING_AISLES.find(a => a.id === id) ||
  (id === CHECKED_AISLE.id ? CHECKED_AISLE : SHOPPING_AISLES[SHOPPING_AISLES.length - 1]);
