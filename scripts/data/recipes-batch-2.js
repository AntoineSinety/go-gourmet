/**
 * Deuxième lot, conçu pour rééquilibrer le catalogue.
 *
 * Le premier lot n'a produit que des plats, et le catalogue en comptait déjà
 * presque exclusivement. Or en déficit calorique, ce ne sont pas les dîners
 * qui posent problème — ils sont pesés et réfléchis — mais le petit-déjeuner
 * avalé debout et le goûter de 17 h. D'où la répartition ici :
 *
 *   3 petits-déjeuners  ~350 kcal, 24 g de protéines
 *   2 goûters           ~150 kcal, une vraie satiété
 *   3 entrées           ~200 kcal, dont deux qui se congèlent
 *   7 plats             400 à 540 kcal
 *   2 desserts          ~180 kcal
 *
 * Contraintes du foyer : ni ananas ni kiwi (allergie), four, plaques,
 * micro-ondes, congélateur, et un petit airfryer.
 *
 * Mêmes conventions que le lot 1 : étapes courtes à l'infinitif, ingrédients
 * et `steps[].uses` référencés par nom, `imageQuery` pour Wikimedia Commons.
 */

/** Ingrédients absents du catalogue, créés à l'insertion. */
export const NEW_INGREDIENTS = [
  { name: "Flocons d'avoine", category: 'epicerie-sucree', defaultUnit: 'g', imageQuery: 'rolled oats' },
  { name: 'Amandes', category: 'epicerie-sucree', defaultUnit: 'g', imageQuery: 'almonds' },
  { name: 'Cacao non sucré', category: 'epicerie-sucree', defaultUnit: 'cuillere-soupe', imageQuery: 'cocoa powder' },
  { name: 'Levure chimique', category: 'epicerie-sucree', defaultUnit: 'cuillere-cafe', imageQuery: 'baking powder tin' },
  { name: 'Thon au naturel', category: 'conserves', defaultUnit: 'g', imageQuery: 'canned tuna' },
  { name: 'Tofu ferme', category: 'autres', defaultUnit: 'g', imageQuery: 'tofu block' },
  { name: 'Boulgour', category: 'epicerie-salee', defaultUnit: 'g', imageQuery: 'bulgur' },
  { name: 'Lentilles vertes', category: 'epicerie-salee', defaultUnit: 'g', imageQuery: 'green lentils' },
  { name: 'Betterave cuite', category: 'fruits-legumes', defaultUnit: 'g', imageQuery: 'boiled beetroot' },
  { name: 'Potimarron', category: 'fruits-legumes', defaultUnit: 'g', imageQuery: 'red kuri squash' },
  { name: 'Butternut', category: 'fruits-legumes', defaultUnit: 'g', imageQuery: 'butternut pumpkin' },
  { name: 'Poire', category: 'fruits-legumes', defaultUnit: 'piece', imageQuery: 'pears fruit' },
  { name: 'Menthe fraîche', category: 'fruits-legumes', defaultUnit: 'g', imageQuery: 'fresh mint' },
  { name: 'Cannelle', category: 'condiments', defaultUnit: 'cuillere-cafe', imageQuery: 'cinnamon sticks' },
  { name: 'Curcuma', category: 'condiments', defaultUnit: 'cuillere-cafe', imageQuery: 'turmeric powder' },
  { name: 'Moutarde', category: 'condiments', defaultUnit: 'cuillere-soupe', imageQuery: 'dijon mustard' },
  { name: 'Sauce soja', category: 'condiments', defaultUnit: 'cuillere-soupe', imageQuery: 'soy sauce' },
  { name: 'Graines de sésame', category: 'condiments', defaultUnit: 'cuillere-soupe', imageQuery: 'sesame seeds' }
];

export const RECIPES = [
  // =========================================================================
  // Petits-déjeuners
  // =========================================================================
  {
    name: 'Overnight oats fromage blanc, myrtilles et amandes',
    type: 'breakfast',
    servings: 2,
    calories: 360,
    protein: 24,
    tags: ['healthy', 'quick', 'vegetarian'],
    imageQuery: 'oatmeal with blueberries',
    note: 'Se prépare la veille en trois minutes. Le seul petit-déjeuner qui tient jusqu\'à midi sans y penser le matin.',
    ingredients: [
      { name: "Flocons d'avoine", quantity: 80, unit: 'g' },
      { name: 'Fromage blanc 0%', quantity: 400, unit: 'g' },
      { name: 'Myrtille', quantity: 150, unit: 'g' },
      { name: 'Amandes', quantity: 20, unit: 'g' },
      { name: 'Miel', quantity: 2, unit: 'cuillere-cafe' }
    ],
    steps: [
      { text: 'Répartir les flocons d\'avoine dans deux bocaux ou deux bols.', uses: ["Flocons d'avoine"] },
      { text: 'Ajouter le fromage blanc et le miel, mélanger jusqu\'à ce que tous les flocons soient humides.', uses: ['Fromage blanc 0%', 'Miel'] },
      { text: 'Couvrir et laisser au réfrigérateur toute la nuit : les flocons gonflent et s\'attendrissent.', uses: [] },
      { text: 'Au matin, garnir de myrtilles et d\'amandes concassées.', uses: ['Myrtille', 'Amandes'] }
    ]
  },

  {
    name: 'Œufs brouillés aux épinards sur pain complet',
    type: 'breakfast',
    servings: 2,
    calories: 350,
    protein: 25,
    tags: ['healthy', 'quick', 'vegetarian'],
    imageQuery: 'scrambled eggs toast',
    note: 'Feu doux et remuer sans arrêt : c\'est la seule règle des œufs brouillés réussis.',
    ingredients: [
      { name: 'Oeufs', quantity: 6, unit: 'piece' },
      { name: 'Épinards', quantity: 200, unit: 'g' },
      { name: 'Pain de mie complet', quantity: 2, unit: 'piece' },
      { name: "Huile d'olive", quantity: 1, unit: 'cuillere-soupe' },
      { name: 'Ail', quantity: 1, unit: 'piece' }
    ],
    steps: [
      { text: 'Faire tomber les épinards à la poêle avec l\'huile et l\'ail écrasé, 3 min. Saler, réserver.', uses: ['Épinards', "Huile d'olive", 'Ail'] },
      { text: 'Battre les œufs à la fourchette, saler, poivrer. Les verser dans la poêle sur feu doux.', uses: ['Oeufs'] },
      { text: 'Remuer sans arrêt à la spatule et retirer du feu quand ils sont encore crémeux : ils finissent de cuire hors du feu.', uses: ['Oeufs'] },
      { text: 'Griller le pain, le couvrir des épinards puis des œufs.', uses: ['Pain de mie complet', 'Épinards'] }
    ]
  },

  {
    name: 'Pancakes protéinés banane et avoine',
    type: 'breakfast',
    servings: 2,
    calories: 390,
    protein: 24,
    tags: ['healthy', 'vegetarian'],
    imageQuery: 'banana pancakes',
    note: 'Sans farine ni sucre ajouté : la banane suffit. Se congèlent très bien, à réchauffer au grille-pain.',
    ingredients: [
      { name: "Flocons d'avoine", quantity: 80, unit: 'g' },
      { name: 'Banane', quantity: 2, unit: 'piece' },
      { name: 'Oeufs', quantity: 3, unit: 'piece' },
      { name: 'Fromage blanc 0%', quantity: 200, unit: 'g' },
      { name: 'Levure chimique', quantity: 1, unit: 'cuillere-cafe' },
      { name: 'Huile de tournesol', quantity: 1, unit: 'cuillere-cafe' }
    ],
    steps: [
      { text: 'Mixer les flocons d\'avoine, les bananes, les œufs, la moitié du fromage blanc et la levure jusqu\'à obtenir une pâte lisse.', uses: ["Flocons d'avoine", 'Banane', 'Oeufs', 'Fromage blanc 0%', 'Levure chimique'] },
      { text: 'Laisser reposer 5 min : la pâte épaissit et les pancakes se tiennent mieux.', uses: [] },
      { text: 'Huiler très légèrement une poêle antiadhésive. Cuire des petits tas de pâte 2 min par face, à feu moyen.', uses: ['Huile de tournesol'] },
      { text: 'Servir avec le reste de fromage blanc.', uses: ['Fromage blanc 0%'] }
    ]
  },

  // =========================================================================
  // Goûters
  // =========================================================================
  {
    name: 'Fromage blanc, pomme râpée et cannelle',
    type: 'snack',
    servings: 2,
    calories: 220,
    protein: 18,
    tags: ['healthy', 'quick', 'vegetarian', 'glutenfree'],
    imageQuery: 'fromage blanc',
    note: 'Deux minutes, 18 g de protéines : de quoi passer 17 h sans ouvrir le placard à gâteaux.',
    ingredients: [
      { name: 'Fromage blanc 0%', quantity: 400, unit: 'g' },
      { name: 'Pomme', quantity: 2, unit: 'piece' },
      { name: 'Amandes', quantity: 16, unit: 'g' },
      { name: 'Cannelle', quantity: 1, unit: 'cuillere-cafe' },
      { name: 'Miel', quantity: 2, unit: 'cuillere-cafe' }
    ],
    steps: [
      { text: 'Râper les pommes avec la peau, juste avant de servir pour éviter qu\'elles noircissent.', uses: ['Pomme'] },
      { text: 'Mélanger au fromage blanc avec la cannelle et le miel.', uses: ['Fromage blanc 0%', 'Cannelle', 'Miel'] },
      { text: 'Parsemer d\'amandes concassées.', uses: ['Amandes'] }
    ]
  },

  {
    name: 'Pois chiches rôtis épicés à l\'airfryer',
    type: 'snack',
    servings: 4,
    calories: 130,
    protein: 6,
    tags: ['healthy', 'vegan', 'vegetarian', 'spicy'],
    imageQuery: 'roasted chickpeas',
    note: 'L\'alternative aux chips. Les sécher soigneusement est ce qui fait la différence entre croustillant et mou.',
    ingredients: [
      { name: 'Pois chiches', quantity: 240, unit: 'g' },
      { name: "Huile d'olive", quantity: 1, unit: 'cuillere-soupe' },
      { name: 'Paprika', quantity: 1, unit: 'cuillere-cafe' },
      { name: 'Cumin moulu', quantity: 1, unit: 'cuillere-cafe' }
    ],
    steps: [
      { text: 'Égoutter, rincer et sécher les pois chiches dans un torchon en les roulant : ils doivent être parfaitement secs.', uses: ['Pois chiches'] },
      { text: 'Les mélanger à l\'huile, au paprika, au cumin et à une bonne pincée de sel.', uses: ["Huile d'olive", 'Paprika', 'Cumin moulu'] },
      { text: 'Cuire à l\'airfryer 15 min à 190°, en secouant le panier toutes les 5 min. À défaut, 30 min au four à 200°.', uses: [] },
      { text: 'Laisser refroidir à l\'air libre : ils croustillent en refroidissant. Se gardent 3 jours dans un bocal.', uses: [] }
    ]
  },

  // =========================================================================
  // Entrées
  // =========================================================================
  {
    name: 'Velouté de potimarron au lait de coco',
    type: 'entree',
    servings: 4,
    calories: 150,
    protein: 4,
    tags: ['healthy', 'vegan', 'vegetarian', 'glutenfree'],
    imageQuery: 'pumpkin soup bowl',
    note: 'La peau du potimarron se mange : ni épluchage, ni déchet. Se congèle par portions.',
    ingredients: [
      { name: 'Potimarron', quantity: 800, unit: 'g' },
      { name: 'Oignon', quantity: 1, unit: 'piece' },
      { name: 'Lait de coco léger', quantity: 200, unit: 'ml' },
      { name: 'Bouillon de volaille', quantity: 500, unit: 'ml' },
      { name: 'Cumin moulu', quantity: 1, unit: 'cuillere-cafe' },
      { name: "Huile d'olive", quantity: 1, unit: 'cuillere-soupe' }
    ],
    steps: [
      { text: 'Laver le potimarron, retirer les graines et le couper en cubes sans l\'éplucher.', uses: ['Potimarron'] },
      { text: 'Faire revenir l\'oignon émincé dans l\'huile 5 min, ajouter le cumin et poursuivre 30 secondes.', uses: ['Oignon', "Huile d'olive", 'Cumin moulu'] },
      { text: 'Ajouter le potimarron et le bouillon, couvrir et laisser mijoter 20 min à petits bouillons.', uses: ['Potimarron', 'Bouillon de volaille'] },
      { text: 'Mixer finement, incorporer le lait de coco hors du feu, rectifier le sel.', uses: ['Lait de coco léger'] }
    ]
  },

  {
    name: 'Salade de betterave, feta et menthe',
    type: 'entree',
    servings: 2,
    calories: 220,
    protein: 8,
    tags: ['healthy', 'quick', 'vegetarian', 'glutenfree'],
    imageQuery: 'beetroot salad',
    note: 'Dix minutes sans cuisson. La menthe est ce qui empêche la betterave d\'être ennuyeuse.',
    ingredients: [
      { name: 'Betterave cuite', quantity: 300, unit: 'g' },
      { name: 'Feta', quantity: 80, unit: 'g' },
      { name: 'Menthe fraîche', quantity: 10, unit: 'g' },
      { name: 'Oignon', quantity: 1, unit: 'piece' },
      { name: "Huile d'olive", quantity: 1, unit: 'cuillere-soupe' },
      { name: 'Citron', quantity: 1, unit: 'piece' }
    ],
    steps: [
      { text: 'Couper les betteraves en dés d\'un centimètre et émincer l\'oignon très finement.', uses: ['Betterave cuite', 'Oignon'] },
      { text: 'Fouetter l\'huile avec le jus du citron, du sel et du poivre.', uses: ["Huile d'olive", 'Citron'] },
      { text: 'Mélanger betteraves, oignon et vinaigrette, laisser reposer 5 min.', uses: [] },
      { text: 'Émietter la feta par-dessus et ajouter la menthe ciselée au dernier moment.', uses: ['Feta', 'Menthe fraîche'] }
    ]
  },

  {
    name: 'Soupe de lentilles au cumin',
    type: 'entree',
    servings: 4,
    calories: 230,
    protein: 13,
    tags: ['healthy', 'vegetarian', 'comfort'],
    imageQuery: 'lentil soup bowl',
    note: 'Rassasiante pour son prix et ses calories. Le double se congèle sans rien perdre.',
    ingredients: [
      { name: 'Lentilles vertes', quantity: 200, unit: 'g' },
      { name: 'Carotte', quantity: 2, unit: 'piece' },
      { name: 'Oignon', quantity: 1, unit: 'piece' },
      { name: 'Ail', quantity: 2, unit: 'piece' },
      { name: 'Cumin moulu', quantity: 2, unit: 'cuillere-cafe' },
      { name: 'Bouillon de volaille', quantity: 1, unit: 'l' },
      { name: "Huile d'olive", quantity: 1, unit: 'cuillere-soupe' }
    ],
    steps: [
      { text: 'Faire revenir l\'oignon et les carottes en dés dans l\'huile, 5 min.', uses: ['Oignon', 'Carotte', "Huile d'olive"] },
      { text: 'Ajouter l\'ail écrasé et le cumin, remuer 30 secondes pour réveiller les épices.', uses: ['Ail', 'Cumin moulu'] },
      { text: 'Verser les lentilles rincées et le bouillon. Cuire 30 min à couvert, sans saler avant la fin.', uses: ['Lentilles vertes', 'Bouillon de volaille'] },
      { text: 'Mixer un tiers de la soupe seulement : elle épaissit tout en gardant de la matière.', uses: [] }
    ]
  },

  // =========================================================================
  // Plats
  // =========================================================================
  {
    name: 'Filet mignon, poêlée de champignons et boulgour',
    type: 'plat',
    servings: 2,
    calories: 500,
    protein: 41,
    tags: ['healthy'],
    imageQuery: 'roast pork tenderloin sliced',
    note: 'Le filet mignon est la pièce de porc la plus maigre. Le sortir du four à 63° à cœur, encore rosé.',
    ingredients: [
      { name: 'Filet mignon', quantity: 300, unit: 'g' },
      { name: 'Champignon de Paris', quantity: 300, unit: 'g' },
      { name: 'Boulgour', quantity: 120, unit: 'g' },
      { name: 'Ail', quantity: 2, unit: 'piece' },
      { name: 'Romarin', quantity: 1, unit: 'cuillere-cafe' },
      { name: "Huile d'olive", quantity: 1, unit: 'cuillere-soupe' }
    ],
    steps: [
      { text: 'Préchauffer le four à 200°. Saisir le filet mignon salé et poivré 2 min par face dans la moitié de l\'huile.', uses: ['Filet mignon', "Huile d'olive"] },
      { text: 'Ajouter le romarin, enfourner la poêle 15 min. Laisser reposer 5 min hors du four avant de trancher.', uses: ['Romarin', 'Filet mignon'] },
      { text: 'Cuire le boulgour 10 min dans deux fois son volume d\'eau salée, puis le laisser gonfler à couvert.', uses: ['Boulgour'] },
      { text: 'Poêler les champignons émincés à feu vif dans le reste d\'huile, sans les remuer au début pour qu\'ils colorent. Ajouter l\'ail en fin de cuisson.', uses: ['Champignon de Paris', "Huile d'olive", 'Ail'] }
    ]
  },

  {
    name: 'Salade de thon, pois chiches et concombre',
    type: 'plat',
    servings: 2,
    calories: 380,
    protein: 36,
    tags: ['healthy', 'quick', 'glutenfree'],
    imageQuery: 'tuna bean salad',
    note: 'Aucune cuisson, se transporte au travail, et 36 g de protéines. Meilleure préparée une heure à l\'avance.',
    ingredients: [
      { name: 'Thon au naturel', quantity: 240, unit: 'g' },
      { name: 'Pois chiches', quantity: 260, unit: 'g' },
      { name: 'Concombre', quantity: 1, unit: 'piece' },
      { name: 'Poivron rouge', quantity: 1, unit: 'piece' },
      { name: 'Oignon', quantity: 1, unit: 'piece' },
      { name: 'Citron', quantity: 1, unit: 'piece' },
      { name: "Huile d'olive", quantity: 1, unit: 'cuillere-soupe' }
    ],
    steps: [
      { text: 'Égoutter le thon et rincer les pois chiches à l\'eau froide.', uses: ['Thon au naturel', 'Pois chiches'] },
      { text: 'Couper le concombre et le poivron en dés, émincer l\'oignon finement.', uses: ['Concombre', 'Poivron rouge', 'Oignon'] },
      { text: 'Assaisonner avec l\'huile, le jus de citron, du sel et beaucoup de poivre.', uses: ["Huile d'olive", 'Citron'] },
      { text: 'Mélanger et laisser reposer au frais au moins 15 min, le temps que les pois chiches s\'imprègnent.', uses: [] }
    ]
  },

  {
    name: 'Sauté de dinde au sésame, brocoli et riz',
    type: 'plat',
    servings: 2,
    calories: 510,
    protein: 45,
    tags: ['healthy', 'quick'],
    imageQuery: 'stir fried broccoli',
    note: 'Tout est prêt en 20 min si les ingrédients sont coupés avant d\'allumer le feu — un sauté ne se prépare pas en cours de route.',
    ingredients: [
      { name: 'Dinde', quantity: 320, unit: 'g' },
      { name: 'Brocoli', quantity: 400, unit: 'g' },
      { name: 'Riz blanc', quantity: 100, unit: 'g' },
      { name: 'Sauce soja', quantity: 2, unit: 'cuillere-soupe' },
      { name: 'Graines de sésame', quantity: 1, unit: 'cuillere-soupe' },
      { name: 'Gingembre frais', quantity: 10, unit: 'g' },
      { name: 'Ail', quantity: 2, unit: 'piece' },
      { name: 'Huile de tournesol', quantity: 1, unit: 'cuillere-soupe' }
    ],
    steps: [
      { text: 'Lancer le riz. Couper la dinde en lanières, le brocoli en petites fleurettes, râper le gingembre, écraser l\'ail.', uses: ['Riz blanc', 'Dinde', 'Brocoli', 'Gingembre frais', 'Ail'] },
      { text: 'Saisir la dinde à feu vif dans l\'huile, 4 min, puis la réserver.', uses: ['Dinde', 'Huile de tournesol'] },
      { text: 'Jeter le brocoli dans la poêle avec 3 cuillères d\'eau, couvrir 4 min : il cuit à la vapeur tout en restant croquant.', uses: ['Brocoli'] },
      { text: 'Remettre la dinde, ajouter l\'ail, le gingembre et la sauce soja. Faire sauter 1 min, parsemer de sésame.', uses: ['Dinde', 'Ail', 'Gingembre frais', 'Sauce soja', 'Graines de sésame'] }
    ]
  },

  {
    name: 'Tofu croustillant à l\'airfryer, riz et haricots verts',
    type: 'plat',
    servings: 2,
    calories: 480,
    protein: 28,
    tags: ['healthy', 'vegan', 'vegetarian'],
    imageQuery: 'crispy tofu',
    note: 'Presser le tofu est l\'étape que tout le monde saute et qui décide du résultat : sans elle, il reste spongieux.',
    ingredients: [
      { name: 'Tofu ferme', quantity: 300, unit: 'g' },
      { name: 'Riz blanc', quantity: 100, unit: 'g' },
      { name: 'Haricots verts', quantity: 300, unit: 'g' },
      { name: 'Sauce soja', quantity: 2, unit: 'cuillere-soupe' },
      { name: 'Graines de sésame', quantity: 1, unit: 'cuillere-soupe' },
      { name: 'Gingembre frais', quantity: 10, unit: 'g' },
      { name: 'Huile de tournesol', quantity: 1, unit: 'cuillere-soupe' }
    ],
    steps: [
      { text: 'Presser le tofu 15 min sous une assiette lestée pour en chasser l\'eau, puis le couper en cubes.', uses: ['Tofu ferme'] },
      { text: 'Mélanger les cubes à la sauce soja, au gingembre râpé et à l\'huile.', uses: ['Tofu ferme', 'Sauce soja', 'Gingembre frais', 'Huile de tournesol'] },
      { text: 'Cuire à l\'airfryer 15 min à 200°, en secouant à mi-cuisson. À défaut, 25 min au four à 210°.', uses: [] },
      { text: 'Cuire le riz et les haricots verts à la vapeur 10 min. Servir le tofu par-dessus, parsemé de sésame.', uses: ['Riz blanc', 'Haricots verts', 'Graines de sésame'] }
    ]
  },

  {
    name: 'Dinde à la moutarde, haricots verts et pommes de terre',
    type: 'plat',
    servings: 2,
    calories: 400,
    protein: 45,
    tags: ['healthy', 'quick'],
    imageQuery: 'cooked turkey breast',
    note: 'La sauce est montée au fromage blanc hors du feu : le crémeux d\'une sauce à la crème pour un quart des calories.',
    ingredients: [
      { name: 'Dinde', quantity: 320, unit: 'g' },
      { name: 'Haricots verts', quantity: 400, unit: 'g' },
      { name: 'Pomme de terre', quantity: 200, unit: 'g' },
      { name: 'Moutarde', quantity: 2, unit: 'cuillere-soupe' },
      { name: 'Fromage blanc 0%', quantity: 100, unit: 'g' },
      { name: "Huile d'olive", quantity: 1, unit: 'cuillere-soupe' }
    ],
    steps: [
      { text: 'Cuire les pommes de terre en cubes et les haricots verts à l\'eau bouillante salée, 15 min.', uses: ['Pomme de terre', 'Haricots verts'] },
      { text: 'Saisir la dinde en escalopes dans l\'huile, 4 min par face. Saler, poivrer, réserver au chaud.', uses: ['Dinde', "Huile d'olive"] },
      { text: 'Déglacer la poêle avec un fond d\'eau, gratter les sucs et retirer du feu.', uses: [] },
      { text: 'Hors du feu seulement, incorporer la moutarde puis le fromage blanc — sur le feu, il trancherait. Napper la dinde.', uses: ['Moutarde', 'Fromage blanc 0%'] }
    ]
  },

  {
    name: 'Curry de poulet au curcuma et butternut',
    type: 'plat',
    servings: 4,
    calories: 450,
    protein: 35,
    tags: ['healthy', 'comfort'],
    imageQuery: 'chicken curry',
    note: 'Meilleur réchauffé le lendemain. Se congèle par portions, sans le riz.',
    ingredients: [
      { name: 'Blanc de poulet', quantity: 500, unit: 'g' },
      { name: 'Butternut', quantity: 600, unit: 'g' },
      { name: 'Lait de coco léger', quantity: 200, unit: 'ml' },
      { name: 'Riz blanc', quantity: 200, unit: 'g' },
      { name: 'Oignon', quantity: 1, unit: 'piece' },
      { name: 'Ail', quantity: 2, unit: 'piece' },
      { name: 'Gingembre frais', quantity: 15, unit: 'g' },
      { name: 'Curcuma', quantity: 2, unit: 'cuillere-cafe' },
      { name: 'Curry', quantity: 1, unit: 'cuillere-soupe' },
      { name: "Huile d'olive", quantity: 1, unit: 'cuillere-soupe' }
    ],
    steps: [
      { text: 'Faire revenir l\'oignon émincé dans l\'huile 5 min, ajouter l\'ail, le gingembre râpé, le curcuma et le curry. Remuer 1 min.', uses: ['Oignon', "Huile d'olive", 'Ail', 'Gingembre frais', 'Curcuma', 'Curry'] },
      { text: 'Ajouter le poulet en cubes et le faire dorer sur toutes les faces.', uses: ['Blanc de poulet'] },
      { text: 'Ajouter le butternut en cubes et 200 ml d\'eau. Couvrir et laisser mijoter 20 min.', uses: ['Butternut'] },
      { text: 'Verser le lait de coco, poursuivre 5 min à découvert pour épaissir. Servir avec le riz.', uses: ['Lait de coco léger', 'Riz blanc'] }
    ]
  },

  {
    name: 'Tortilla espagnole allégée',
    type: 'plat',
    servings: 4,
    calories: 370,
    protein: 18,
    tags: ['vegetarian', 'glutenfree', 'comfort'],
    imageQuery: 'tortilla espanola',
    note: 'Les pommes de terre sont cuites à l\'eau plutôt que confites dans l\'huile : la moitié des calories de la vraie.',
    ingredients: [
      { name: 'Pomme de terre', quantity: 600, unit: 'g' },
      { name: 'Oeufs', quantity: 10, unit: 'piece' },
      { name: 'Oignon', quantity: 2, unit: 'piece' },
      { name: "Huile d'olive", quantity: 2, unit: 'cuillere-soupe' }
    ],
    steps: [
      { text: 'Cuire les pommes de terre en rondelles fines 10 min à l\'eau bouillante salée, puis les égoutter soigneusement.', uses: ['Pomme de terre'] },
      { text: 'Faire fondre les oignons émincés dans l\'huile à feu doux, 10 min, jusqu\'à ce qu\'ils soient translucides.', uses: ['Oignon', "Huile d'olive"] },
      { text: 'Battre les œufs, saler généreusement, y mélanger pommes de terre et oignons. Laisser reposer 10 min.', uses: ['Oeufs'] },
      { text: 'Cuire à feu doux dans une poêle antiadhésive 8 min, puis retourner à l\'aide d\'une assiette et poursuivre 5 min. Le centre doit rester moelleux.', uses: [] }
    ]
  },

  {
    name: 'Boulgour aux légumes rôtis et feta',
    type: 'plat',
    servings: 2,
    calories: 460,
    protein: 17,
    tags: ['healthy', 'vegetarian'],
    imageQuery: 'bulgur salad',
    note: 'Un soir sans viande. Les légumes rôtis à haute température concentrent leur sucre, c\'est ce qui rend le plat intéressant.',
    ingredients: [
      { name: 'Boulgour', quantity: 120, unit: 'g' },
      { name: 'Aubergine', quantity: 1, unit: 'piece' },
      { name: 'Courgette', quantity: 1, unit: 'piece' },
      { name: 'Poivron rouge', quantity: 1, unit: 'piece' },
      { name: 'Feta', quantity: 80, unit: 'g' },
      { name: 'Citron', quantity: 1, unit: 'piece' },
      { name: "Huile d'olive", quantity: 1, unit: 'cuillere-soupe' },
      { name: 'Ail', quantity: 2, unit: 'piece' }
    ],
    steps: [
      { text: 'Préchauffer le four à 220°. Couper aubergine, courgette et poivron en gros dés.', uses: ['Aubergine', 'Courgette', 'Poivron rouge'] },
      { text: 'Mélanger à l\'huile et à l\'ail écrasé, étaler sur une plaque sans les entasser, enfourner 25 min.', uses: ["Huile d'olive", 'Ail'] },
      { text: 'Cuire le boulgour 10 min dans deux fois son volume d\'eau salée, puis le laisser gonfler à couvert.', uses: ['Boulgour'] },
      { text: 'Mélanger le tout, arroser du jus de citron et émietter la feta par-dessus.', uses: ['Citron', 'Feta'] }
    ]
  },

  // =========================================================================
  // Desserts
  // =========================================================================
  {
    name: 'Mousse au chocolat et fromage blanc',
    type: 'dessert',
    servings: 4,
    calories: 210,
    protein: 13,
    tags: ['vegetarian', 'glutenfree'],
    imageQuery: 'mousse au chocolat',
    note: 'Un dessert à 13 g de protéines. Incorporer les blancs délicatement, sinon la mousse retombe.',
    ingredients: [
      { name: 'Fromage blanc 0%', quantity: 400, unit: 'g' },
      { name: 'Chocolat noir', quantity: 80, unit: 'g' },
      { name: 'Oeufs', quantity: 3, unit: 'piece' },
      { name: 'Cacao non sucré', quantity: 2, unit: 'cuillere-soupe' },
      { name: 'Miel', quantity: 2, unit: 'cuillere-soupe' }
    ],
    steps: [
      { text: 'Faire fondre le chocolat au micro-ondes par tranches de 30 secondes, en remuant entre chaque.', uses: ['Chocolat noir'] },
      { text: 'Mélanger le fromage blanc, le cacao et le miel, puis incorporer le chocolat fondu encore tiède.', uses: ['Fromage blanc 0%', 'Cacao non sucré', 'Miel', 'Chocolat noir'] },
      { text: 'Monter les blancs d\'œufs en neige ferme avec une pincée de sel.', uses: ['Oeufs'] },
      { text: 'Les incorporer en trois fois, à la maryse et de bas en haut. Réfrigérer 3 h.', uses: [] }
    ]
  },

  {
    name: 'Poires rôties à la cannelle et aux amandes',
    type: 'dessert',
    servings: 4,
    calories: 160,
    protein: 3,
    tags: ['healthy', 'vegetarian', 'glutenfree'],
    imageQuery: 'roasted pears',
    note: 'Se prépare pendant que le plat principal finit de cuire, dans le même four.',
    ingredients: [
      { name: 'Poire', quantity: 4, unit: 'piece' },
      { name: 'Amandes', quantity: 20, unit: 'g' },
      { name: 'Miel', quantity: 2, unit: 'cuillere-soupe' },
      { name: 'Cannelle', quantity: 2, unit: 'cuillere-cafe' }
    ],
    steps: [
      { text: 'Préchauffer le four à 190°. Couper les poires en deux et retirer le cœur à la cuillère.', uses: ['Poire'] },
      { text: 'Les poser face coupée vers le haut dans un plat, arroser de miel et saupoudrer de cannelle.', uses: ['Miel', 'Cannelle'] },
      { text: 'Enfourner 25 min, en arrosant une fois du jus rendu.', uses: [] },
      { text: 'Parsemer d\'amandes concassées et remettre 5 min pour les torréfier.', uses: ['Amandes'] }
    ]
  }
];
