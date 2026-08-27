/**
 * Premier lot de recettes, conçu pour un déficit calorique tenable à deux.
 *
 * Principes appliqués :
 *   - ~450 à 570 kcal par portion, avec 30 à 45 g de protéines quand c'est
 *     possible : c'est la satiété qui fait tenir un déficit, pas la volonté.
 *   - Beaucoup de légumes, pour le volume dans l'assiette à calories égales.
 *   - Matières grasses mesurées à la cuillère, jamais « un filet ».
 *   - Majorité en 20 à 30 minutes, un bébé dans les pattes.
 *   - Le catalogue existant d'abord : 9 ingrédients seulement sont à créer.
 *
 * Style repris de l'existant : étapes courtes, à l'infinitif, sans blabla.
 *
 * `ingredients` référence le catalogue par nom (résolu à l'insertion).
 * `steps[].uses` liste les ingrédients rattachés, par nom également.
 * `imageQuery` sert à chercher une photo libre sur Wikimedia Commons.
 */

/** Ingrédients absents du catalogue, créés à l'insertion. */
export const NEW_INGREDIENTS = [
  { name: 'Lentilles corail', category: 'epicerie-salee', defaultUnit: 'g', imageQuery: 'red lentils' },
  { name: 'Pois chiches', category: 'conserves', defaultUnit: 'g', imageQuery: 'chickpeas' },
  { name: 'Haricots rouges', category: 'conserves', defaultUnit: 'g', imageQuery: 'kidney beans' },
  { name: 'Patate douce', category: 'fruits-legumes', defaultUnit: 'g', imageQuery: 'sweet potatoes' },
  { name: 'Feta', category: 'produits-laitiers', defaultUnit: 'g', imageQuery: 'feta cheese' },
  { name: 'Fromage blanc 0%', category: 'produits-laitiers', defaultUnit: 'g', imageQuery: 'quark cheese' },
  { name: 'Lait de coco léger', category: 'conserves', defaultUnit: 'ml', imageQuery: 'coconut milk can' },
  { name: 'Cumin moulu', category: 'condiments', defaultUnit: 'cuillere-cafe', imageQuery: 'cumin seeds spice' },
  { name: 'Gingembre frais', category: 'fruits-legumes', defaultUnit: 'g', imageQuery: 'ginger root' }
];

export const RECIPES = [
  {
    name: 'Cabillaud rôti au citron, brocoli et quinoa',
    type: 'plat',
    servings: 2,
    calories: 480,
    protein: 45,
    tags: ['healthy', 'quick'],
    imageQuery: 'cooked cod fillet',
    note: 'Le poisson blanc est imbattable en déficit : très peu de calories pour beaucoup de protéines.',
    ingredients: [
      { name: 'Cabillaud', quantity: 300, unit: 'g' },
      { name: 'Brocoli', quantity: 400, unit: 'g' },
      { name: 'Quinoa', quantity: 120, unit: 'g' },
      { name: 'Citron', quantity: 1, unit: 'piece' },
      { name: "Huile d'olive", quantity: 1, unit: 'cuillere-soupe' },
      { name: 'Ail', quantity: 2, unit: 'piece' }
    ],
    steps: [
      { text: 'Préchauffer le four à 200°. Rincer le quinoa et le cuire 15 min dans deux fois son volume d\'eau salée.', uses: ['Quinoa'] },
      { text: 'Détailler le brocoli en fleurettes, les mélanger avec la moitié de l\'huile et l\'ail écrasé. Étaler sur une plaque, enfourner 20 min.', uses: ['Brocoli', "Huile d'olive", 'Ail'] },
      { text: 'À mi-cuisson, poser le cabillaud sur la plaque. Arroser du reste d\'huile et du jus de citron, saler, poivrer.', uses: ['Cabillaud', 'Citron', "Huile d'olive"] },
      { text: 'Servir le poisson et le brocoli sur le quinoa, avec le reste du citron en quartiers.', uses: [] }
    ]
  },

  {
    name: 'Poulet mariné au yaourt et paprika, légumes rôtis',
    type: 'plat',
    servings: 2,
    calories: 520,
    protein: 48,
    tags: ['healthy', 'quick'],
    imageQuery: 'roasted chicken vegetables',
    note: 'La marinade au yaourt attendrit sans ajouter de gras. Tout cuit sur une seule plaque.',
    ingredients: [
      { name: 'Blanc de poulet', quantity: 320, unit: 'g' },
      { name: 'Yaourt nature', quantity: 100, unit: 'g' },
      { name: 'Paprika', quantity: 2, unit: 'cuillere-cafe' },
      { name: 'Courgette', quantity: 2, unit: 'piece' },
      { name: 'Poivron rouge', quantity: 1, unit: 'piece' },
      { name: 'Oignon', quantity: 1, unit: 'piece' },
      { name: "Huile d'olive", quantity: 1, unit: 'cuillere-soupe' },
      { name: 'Ail', quantity: 2, unit: 'piece' }
    ],
    steps: [
      { text: 'Mélanger le yaourt, le paprika, l\'ail écrasé, du sel et du poivre. Y enrober le poulet et laisser 10 min, le temps de couper les légumes.', uses: ['Yaourt nature', 'Paprika', 'Ail', 'Blanc de poulet'] },
      { text: 'Préchauffer le four à 210°. Couper courgettes, poivron et oignon en gros morceaux, mélanger à l\'huile sur une plaque.', uses: ['Courgette', 'Poivron rouge', 'Oignon', "Huile d'olive"] },
      { text: 'Enfourner les légumes 10 min, puis ajouter le poulet et poursuivre 18 min. Le poulet doit être ferme, les légumes colorés.', uses: ['Blanc de poulet'] }
    ]
  },

  {
    name: 'Chili de dinde aux haricots rouges',
    type: 'plat',
    servings: 4,
    calories: 430,
    protein: 38,
    tags: ['healthy', 'spicy'],
    imageQuery: 'chili con carne bowl',
    note: 'Se congèle très bien en portions. Meilleur réchauffé le lendemain.',
    ingredients: [
      { name: 'Dinde', quantity: 500, unit: 'g' },
      { name: 'Haricots rouges', quantity: 400, unit: 'g' },
      { name: 'Coulis de tomates', quantity: 500, unit: 'g' },
      { name: 'Poivron rouge', quantity: 1, unit: 'piece' },
      { name: 'Oignon', quantity: 1, unit: 'piece' },
      { name: 'Ail', quantity: 3, unit: 'piece' },
      { name: 'Cumin moulu', quantity: 2, unit: 'cuillere-cafe' },
      { name: 'Paprika', quantity: 2, unit: 'cuillere-cafe' },
      { name: "Huile d'olive", quantity: 1, unit: 'cuillere-soupe' }
    ],
    steps: [
      { text: 'Faire revenir l\'oignon et le poivron émincés dans l\'huile, 5 min à feu vif.', uses: ['Oignon', 'Poivron rouge', "Huile d'olive"] },
      { text: 'Ajouter la dinde et l\'écraser à la cuillère pour la détacher. Cuire jusqu\'à ce qu\'elle ne soit plus rosée.', uses: ['Dinde'] },
      { text: 'Ajouter l\'ail, le cumin et le paprika, mélanger 1 min pour réveiller les épices.', uses: ['Ail', 'Cumin moulu', 'Paprika'] },
      { text: 'Verser le coulis et les haricots rincés. Laisser mijoter 20 min à découvert, saler en fin de cuisson.', uses: ['Coulis de tomates', 'Haricots rouges'] }
    ]
  },

  {
    name: 'Curry de lentilles corail aux épinards',
    type: 'plat',
    servings: 4,
    calories: 440,
    protein: 22,
    tags: ['vegetarian', 'healthy'],
    imageQuery: 'lentil curry',
    note: 'Sans viande et rassasiant : les lentilles apportent fibres et protéines.',
    ingredients: [
      { name: 'Lentilles corail', quantity: 300, unit: 'g' },
      { name: 'Épinards', quantity: 200, unit: 'g' },
      { name: 'Lait de coco léger', quantity: 400, unit: 'ml' },
      { name: 'Oignon', quantity: 1, unit: 'piece' },
      { name: 'Ail', quantity: 3, unit: 'piece' },
      { name: 'Gingembre frais', quantity: 20, unit: 'g' },
      { name: 'Curry', quantity: 2, unit: 'cuillere-soupe' },
      { name: "Huile d'olive", quantity: 1, unit: 'cuillere-soupe' }
    ],
    steps: [
      { text: 'Faire revenir l\'oignon dans l\'huile 5 min, puis ajouter ail et gingembre râpés.', uses: ['Oignon', "Huile d'olive", 'Ail', 'Gingembre frais'] },
      { text: 'Ajouter le curry, mélanger 30 secondes, puis les lentilles rincées et 600 ml d\'eau.', uses: ['Curry', 'Lentilles corail'] },
      { text: 'Cuire 15 min à couvert : les lentilles doivent se défaire.', uses: [] },
      { text: 'Verser le lait de coco et les épinards, laisser tomber 3 min. Saler, poivrer.', uses: ['Lait de coco léger', 'Épinards'] }
    ]
  },

  {
    name: 'Omelette épinards feta et salade',
    type: 'plat',
    servings: 2,
    calories: 410,
    protein: 30,
    tags: ['vegetarian', 'quick'],
    imageQuery: 'omelette plate',
    note: 'Le dîner de secours : douze minutes, tout vient du frigo.',
    ingredients: [
      { name: 'Oeufs', quantity: 6, unit: 'piece' },
      { name: 'Épinards', quantity: 150, unit: 'g' },
      { name: 'Feta', quantity: 80, unit: 'g' },
      { name: 'Salade verte', quantity: 100, unit: 'g' },
      { name: "Huile d'olive", quantity: 1, unit: 'cuillere-soupe' }
    ],
    steps: [
      { text: 'Faire tomber les épinards 2 min dans la moitié de l\'huile, puis les réserver et essorer l\'eau rendue.', uses: ['Épinards', "Huile d'olive"] },
      { text: 'Battre les œufs, saler légèrement — la feta l\'est déjà. Verser dans la poêle chaude.', uses: ['Oeufs'] },
      { text: 'Quand le dessous prend, répartir épinards et feta émiettée, plier et laisser 1 min.', uses: ['Feta', 'Épinards'] },
      { text: 'Servir avec la salade assaisonnée du reste d\'huile et d\'un peu de vinaigre.', uses: ['Salade verte', "Huile d'olive"] }
    ]
  },

  {
    name: 'Saumon en papillote, poireaux et petits pois',
    type: 'plat',
    servings: 2,
    calories: 540,
    protein: 40,
    tags: ['healthy', 'quick'],
    imageQuery: 'cooked salmon fillet',
    note: 'Aucune matière grasse ajoutée : la papillote cuit à la vapeur du légume.',
    ingredients: [
      { name: 'Saumon', quantity: 300, unit: 'g' },
      { name: 'Poireau', quantity: 2, unit: 'piece' },
      { name: 'Petits pois', quantity: 200, unit: 'g' },
      { name: 'Citron', quantity: 1, unit: 'piece' },
      { name: 'Crème fraîche', quantity: 2, unit: 'cuillere-soupe' }
    ],
    steps: [
      { text: 'Préchauffer le four à 200°. Émincer finement les blancs de poireau.', uses: ['Poireau'] },
      { text: 'Sur deux feuilles de papier cuisson, répartir poireaux et petits pois. Poser le saumon dessus.', uses: ['Poireau', 'Petits pois', 'Saumon'] },
      { text: 'Ajouter une cuillère de crème, deux rondelles de citron, sel et poivre. Fermer hermétiquement.', uses: ['Crème fraîche', 'Citron'] },
      { text: 'Enfourner 20 min. Ouvrir à table, la vapeur fait le spectacle.', uses: [] }
    ]
  },

  {
    name: 'Bowl quinoa, pois chiches rôtis et yaourt citron',
    type: 'plat',
    servings: 2,
    calories: 560,
    protein: 24,
    tags: ['vegetarian', 'healthy'],
    imageQuery: 'quinoa salad bowl',
    note: 'Les pois chiches rôtis remplacent le croquant des croûtons, sans le pain.',
    ingredients: [
      { name: 'Pois chiches', quantity: 400, unit: 'g' },
      { name: 'Quinoa', quantity: 120, unit: 'g' },
      { name: 'Concombre', quantity: 1, unit: 'piece' },
      { name: 'Tomate', quantity: 2, unit: 'piece' },
      { name: 'Yaourt nature', quantity: 150, unit: 'g' },
      { name: 'Citron', quantity: 1, unit: 'piece' },
      { name: 'Cumin moulu', quantity: 1, unit: 'cuillere-cafe' },
      { name: "Huile d'olive", quantity: 1, unit: 'cuillere-soupe' }
    ],
    steps: [
      { text: 'Préchauffer le four à 210°. Égoutter et sécher les pois chiches, les mélanger à l\'huile et au cumin.', uses: ['Pois chiches', "Huile d'olive", 'Cumin moulu'] },
      { text: 'Enfourner 20 min en secouant à mi-cuisson. Ils doivent être dorés et croquants.', uses: [] },
      { text: 'Pendant ce temps, cuire le quinoa 15 min et couper concombre et tomates en dés.', uses: ['Quinoa', 'Concombre', 'Tomate'] },
      { text: 'Mélanger le yaourt avec le jus de citron, du sel et du poivre. Assembler le bowl et napper.', uses: ['Yaourt nature', 'Citron'] }
    ]
  },

  {
    name: 'Crevettes sautées ail et citron, courgettes et riz',
    type: 'plat',
    servings: 2,
    calories: 490,
    protein: 38,
    tags: ['healthy', 'quick'],
    imageQuery: 'shrimp rice dish',
    note: 'Vingt minutes montre en main. Les crevettes cuisent en trois minutes, ne pas les oublier.',
    ingredients: [
      { name: 'Crevettes', quantity: 300, unit: 'g' },
      { name: 'Courgette', quantity: 2, unit: 'piece' },
      { name: 'Riz blanc', quantity: 120, unit: 'g' },
      { name: 'Ail', quantity: 3, unit: 'piece' },
      { name: 'Citron', quantity: 1, unit: 'piece' },
      { name: "Huile d'olive", quantity: 1, unit: 'cuillere-soupe' },
      { name: 'Basilic', quantity: 1, unit: 'cuillere-soupe' }
    ],
    steps: [
      { text: 'Lancer le riz. Couper les courgettes en demi-rondelles.', uses: ['Riz blanc', 'Courgette'] },
      { text: 'Saisir les courgettes à feu vif dans l\'huile, 6 min, sans les noyer. Réserver.', uses: ['Courgette', "Huile d'olive"] },
      { text: 'Dans la même poêle, faire sauter l\'ail émincé puis les crevettes, 3 min à peine.', uses: ['Ail', 'Crevettes'] },
      { text: 'Remettre les courgettes, ajouter le jus de citron et le basilic. Servir sur le riz.', uses: ['Citron', 'Basilic', 'Riz blanc'] }
    ]
  },

  {
    name: 'Boulettes de bœuf à la tomate et spaghettis',
    type: 'plat',
    servings: 4,
    calories: 570,
    protein: 42,
    tags: ['comfort'],
    imageQuery: 'spaghetti meatballs',
    note: 'La version allégée du plat plaisir : moins de pâtes, plus de sauce et de viande.',
    ingredients: [
      { name: 'Bœuf haché', quantity: 500, unit: 'g' },
      { name: 'Pâtes spaghetti', quantity: 240, unit: 'g' },
      { name: 'Coulis de tomates', quantity: 500, unit: 'g' },
      { name: 'Oeufs', quantity: 1, unit: 'piece' },
      { name: 'Oignon', quantity: 1, unit: 'piece' },
      { name: 'Ail', quantity: 3, unit: 'piece' },
      { name: 'Basilic', quantity: 2, unit: 'cuillere-soupe' },
      { name: "Huile d'olive", quantity: 1, unit: 'cuillere-soupe' }
    ],
    steps: [
      { text: 'Mélanger le bœuf, l\'œuf, la moitié de l\'oignon râpé, du sel et du poivre. Former une vingtaine de boulettes.', uses: ['Bœuf haché', 'Oeufs', 'Oignon'] },
      { text: 'Les colorer sur toutes les faces dans l\'huile, puis les réserver.', uses: ["Huile d'olive"] },
      { text: 'Faire revenir le reste d\'oignon et l\'ail, verser le coulis, remettre les boulettes. Mijoter 20 min à couvert.', uses: ['Oignon', 'Ail', 'Coulis de tomates'] },
      { text: 'Cuire les spaghettis al dente. Servir avec le basilic ciselé.', uses: ['Pâtes spaghetti', 'Basilic'] }
    ]
  },

  {
    name: 'Shakshuka aux poivrons',
    type: 'plat',
    servings: 2,
    calories: 400,
    protein: 24,
    tags: ['vegetarian', 'quick', 'spicy'],
    imageQuery: 'shakshuka',
    note: 'Se mange aussi bien au dîner qu\'au brunch. Une seule poêle à laver.',
    ingredients: [
      { name: 'Oeufs', quantity: 4, unit: 'piece' },
      { name: 'Coulis de tomates', quantity: 400, unit: 'g' },
      { name: 'Poivron rouge', quantity: 1, unit: 'piece' },
      { name: 'Poivron vert', quantity: 1, unit: 'piece' },
      { name: 'Oignon', quantity: 1, unit: 'piece' },
      { name: 'Ail', quantity: 2, unit: 'piece' },
      { name: 'Cumin moulu', quantity: 1, unit: 'cuillere-cafe' },
      { name: 'Paprika', quantity: 1, unit: 'cuillere-cafe' },
      { name: "Huile d'olive", quantity: 1, unit: 'cuillere-soupe' }
    ],
    steps: [
      { text: 'Émincer oignon et poivrons, les faire fondre 10 min dans l\'huile à feu moyen.', uses: ['Oignon', 'Poivron rouge', 'Poivron vert', "Huile d'olive"] },
      { text: 'Ajouter ail, cumin et paprika, puis le coulis. Laisser réduire 10 min.', uses: ['Ail', 'Cumin moulu', 'Paprika', 'Coulis de tomates'] },
      { text: 'Creuser quatre puits, y casser les œufs. Couvrir et cuire 6 min : le blanc pris, le jaune coulant.', uses: ['Oeufs'] }
    ]
  },

  {
    name: 'Gratin de chou-fleur allégé',
    type: 'plat',
    servings: 4,
    calories: 300,
    protein: 26,
    tags: ['vegetarian', 'healthy', 'comfort'],
    imageQuery: 'cauliflower gratin',
    note: 'Le gratin sans béchamel : le fromage blanc et les œufs remplacent beurre et farine. Un tiers des calories de la version classique.',
    ingredients: [
      { name: 'Chou-fleur', quantity: 1, unit: 'piece' },
      { name: 'Fromage blanc 0%', quantity: 400, unit: 'g' },
      { name: 'Oeufs', quantity: 3, unit: 'piece' },
      { name: 'Emmental', quantity: 80, unit: 'g' },
      { name: 'Ail', quantity: 1, unit: 'piece' }
    ],
    steps: [
      { text: 'Détailler le chou-fleur en fleurettes et le cuire 10 min à l\'eau bouillante salée. Bien égoutter.', uses: ['Chou-fleur'] },
      { text: 'Fouetter le fromage blanc, les œufs, l\'ail écrasé, sel, poivre et une râpée de muscade si vous en avez.', uses: ['Fromage blanc 0%', 'Oeufs', 'Ail'] },
      { text: 'Verser sur le chou-fleur dans un plat, parsemer d\'emmental. Enfourner 25 min à 190°.', uses: ['Emmental'] }
    ]
  },

  {
    name: 'Poulet et patate douce à l\'airfryer',
    type: 'plat',
    servings: 2,
    calories: 530,
    protein: 46,
    tags: ['healthy', 'quick'],
    imageQuery: 'baked chicken breast',
    note: 'Pensée pour un petit airfryer : deux fournées, la patate douce d\'abord. Marche aussi au four à 210° pendant 30 min sur une plaque.',
    ingredients: [
      { name: 'Blanc de poulet', quantity: 320, unit: 'g' },
      { name: 'Patate douce', quantity: 400, unit: 'g' },
      { name: 'Haricots verts', quantity: 300, unit: 'g' },
      { name: 'Paprika', quantity: 2, unit: 'cuillere-cafe' },
      { name: "Huile d'olive", quantity: 1, unit: 'cuillere-soupe' }
    ],
    steps: [
      { text: 'Couper la patate douce en cubes de 2 cm, mélanger avec la moitié de l\'huile et du paprika.', uses: ['Patate douce', "Huile d'olive", 'Paprika'] },
      { text: 'Airfryer 18 min à 190°, en secouant le panier à mi-parcours. Réserver au chaud.', uses: [] },
      { text: 'Enrober le poulet du reste d\'huile et de paprika, puis 14 min à 190° en retournant à mi-cuisson.', uses: ['Blanc de poulet', "Huile d'olive", 'Paprika'] },
      { text: 'Pendant ce temps, cuire les haricots verts 8 min à la vapeur ou à l\'eau bouillante.', uses: ['Haricots verts'] }
    ]
  }
];
