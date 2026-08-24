# Prompt Claude Design — Go Gourmet (refonte visuelle)

> Copier/coller tout ce qui suit dans Claude Design.

---

## Mission

Tu es designer produit. Crée un **canvas de design multi-artboards** pour la refonte visuelle de **Go Gourmet**, une PWA existante de gestion de recettes, de planning de repas et de liste de courses, utilisée par un foyer (couple/famille) au quotidien.

L'app fonctionne déjà : il ne s'agit **pas** d'inventer un produit, mais de **remonter le niveau visuel des écrans existants** en conservant l'ADN de la marque. Chaque écran maquetté doit rester implémentable tel quel en React + CSS.

## Contexte produit

- **Nom** : Go Gourmet
- **Nature** : Progressive Web App installable, **thème sombre uniquement**, pensée mobile/tablette d'abord
- **Utilisateurs** : les membres d'un même **foyer** (household). Connexion Google, données 100 % partagées entre les membres du foyer (recettes, ingrédients, planning, courses).
- **Langue de l'interface** : **français** (tous les libellés en français)
- **Promesse** : « Organisez vos recettes et repas » — de la recette au planning de la semaine, jusqu'à la liste de courses générée automatiquement.

### Parcours principal (le cœur du produit)

1. J'enregistre mes recettes (ingrédients + étapes + photo)
2. Je remplis le planning de la semaine (7 jours × midi/soir) en piochant dans mes recettes
3. La liste de courses se génère automatiquement depuis le planning, agrégée par ingrédient et **groupée par rayon de magasin**
4. En magasin, je passe en **« Mode Course »** plein écran pour cocher au fur et à mesure
5. En cuisine, je passe en **« Mode Cuisson »** pas-à-pas pour suivre la recette

## Stack et contraintes techniques (à respecter dans les maquettes)

- React 19 + Vite, **CSS Modules** (pas de Tailwind), **aucune librairie UI** — tout est fait main
- Icônes : **lucide-react** (icônes linéaires, stroke 1.5 à 2.5). Certains éléments utilisent aussi des **emojis** (catégories d'ingrédients, types de recette)
- Firebase : Auth Google, Firestore, Storage (photos de recettes et d'ingrédients)
- Drag and drop (dnd-kit) sur le planning
- Saisie vocale (Web Speech API) pour dicter les étapes d'une recette
- **Pas de router** : navigation par état, 4 onglets principaux, donc les écrans sont des vues plein écran et non des URLs
- PWA : penser aux safe-areas iOS, aux cibles tactiles de 44 px minimum, à l'usage à une main

## Identité visuelle actuelle (à affiner, pas à jeter)

Tokens CSS réellement en production :

```
/* Fonds — bleu nuit */
--bg-primary:   #1a2332
--bg-secondary: #243447
--bg-tertiary:  #2d3f56
--bg-hover:     #364a65

/* Textes */
--text-primary:   #f0f6fc
--text-secondary: #9ba9be
--text-muted:     #5a6a85

/* Accent principal — orange */
--accent-primary:       #ff7300
--accent-primary-hover: #ff8c1a
--accent-primary-light: #ffa347
--accent-primary-glow:  rgba(255,115,0,0.2)

/* Sémantique */
--accent-green:  #22c55e    --accent-purple: #8b5cf6
--accent-pink:   #ec4899    --accent-yellow: #eab308
--accent-teal:   #14b8a6    --accent-blue:   (aliasé sur l'orange)
--success: #22c55e    --error: #ef4444    --warning: #f59e0b

/* Bordures */
--border-color:  #3a4d66
--border-subtle: #2d3f56

/* Base actuelle */
police : system-ui / -apple-system / Segoe UI   •   rayon : 8px   •   transitions : 0.2s
```

**Direction demandée : « affiner l'existant ».**

- Garder l'ADN : **fond bleu nuit + accent orange, dark only**. Ne pas proposer de mode clair, ne pas changer la couleur d'accent.
- Faire progresser : la **hiérarchie typographique** (l'app n'a aujourd'hui qu'une police système et trois tailles de titres — propose une échelle typo complète et une police plus caractérielle pour les titres), le **rythme d'espacement** (échelle 4/8 px cohérente), le **traitement des cartes** (élévation, bordures, états hover/active/focus), la **densité d'information** (l'app est aujourd'hui trop dense sur mobile par endroits), un **usage plus assumé de la photo** de plat.
- Rationaliser les **emojis** : proposer un système cohérent, en gardant l'emoji comme signal de catégorie mais en l'encadrant visuellement (pastille, fond teinté) au lieu de le laisser flotter dans le texte.
- Livrer aussi une **planche de tokens révisés** (palette, échelle typo, spacing, rayons, ombres, états) directement traduisible en variables CSS.

## Vocabulaire et modèle de données

- **Foyer (household)** : nom, membres, code d'invitation, paramètres par défaut (nombre de portions)
- **Recette** : nom, photo, `type` (Entrée 🥗 / Plat 🍽️ / Dessert 🍰 / Apéritif 🥂 / Petit-déjeuner 🥐 / Goûter 🍪), `servings` (nombre de personnes), liste d'ingrédients (ingrédient + quantité + unité), **étapes ordonnées** (chaque étape peut être liée à des ingrédients précis), **tags**
- **Tags de recette** (chacun a sa couleur et son icône lucide) : Végétarien (vert), Vegan (émeraude), Équilibré (rose), Épicé (orange), Rapide (bleu), Gastronomique (jaune), Réconfortant (ambre), Sans gluten (violet), Faible en glucides (teal)
- **Ingrédient** : catalogue partagé du foyer, avec photo, et ses **11 catégories** — Fruits & Légumes 🥬, Viandes & Poissons 🥩, Produits laitiers 🧀, Épicerie salée 🍝, Épicerie sucrée 🍪, Surgelés ❄️, Boissons 🥤, Pain & Viennoiserie 🥖, Condiments & Sauces 🧂, Conserves 🥫, Autres 📦
- **Unités** : g, kg, ml, L, c. à café, c. à soupe, unité(s), pincée(s) — avec conversion automatique à l'agrégation (1500 g devient 1,5 kg)
- **Planning (mealPlan)** : une semaine = numéro de semaine + année, 14 créneaux (7 jours × midi/soir). Un créneau contient soit une **recette**, soit un **repas libre** (texte saisi à la main, badge ✏️), soit rien. Un plat peut être **étalé sur plusieurs jours** (badge 📌 « 2/3 »). La semaine porte aussi des **extras** (articles ajoutés à la main).
- **Items permanents** : articles récurrents (lait, papier toilette, café…) qui reviennent dans chaque liste de courses
- **Rayons de la liste de courses** (8, distincts des catégories d'ingrédients) : Fruits & Légumes, Viandes & Poissons, Produits laitiers, Épicerie, Surgelés, Boissons, Boulangerie, Autres — plus une section « ✅ Cochés » en bas de liste

## Architecture de navigation

4 destinations principales : **bottom tab bar sur mobile**, **barre de navigation horizontale en haut sur desktop** (logo « Go Gourmet » à gauche).

| Onglet | Icône lucide | Contenu |
|---|---|---|
| Recettes | `BookOpen` | liste des recettes (vue par défaut) |
| Planning | `Calendar` | semaine de repas |
| Courses | `ShoppingCart` | liste de courses |
| Plus | `MoreHorizontal` | ingrédients, foyer, réglages, compte |

Le détail d'une recette s'ouvre **par-dessus** l'onglet courant : **panneau latéral droit sur desktop** (avec overlay), **bottom sheet ou plein écran sur mobile**. Le Mode Cuisson et le Mode Course sont des **vues plein écran sans navigation**.

## Écrans à maquetter

Pour **chaque écran ci-dessous, deux artboards** : **mobile 390 × 844** et **desktop 1440 × 900**, sauf mention contraire. Ordonne le canvas par flux, avec un titre de section au-dessus de chaque groupe.

### 1. Recettes

1. **Liste des recettes** — en-tête « Mes Recettes » + bouton primaire « Nouvelle recette » ; barre de recherche avec **bascule du mode de recherche : « Nom » / « Ingrédient »** ; filtres par **type de recette** (puces avec compteur : « Tous (24) », « 🍽️ Plat (12) »…) ; filtres par **tags** (puces colorées, sélection multiple, chips actifs retirables) ; **grille de cartes recette** : photo 16:9 avec placeholder quand la photo manque, nom, type, nombre de portions, nombre d'étapes, tags. Montre aussi l'état vide (aucune recette) et l'état filtré sans résultat.
2. **Détail recette** — photo en héro, nom, badges type + tags, sélecteur de portions, liste des ingrédients (avec vignette d'ingrédient), étapes numérotées, actions : « Lancer le mode cuisson » (action primaire), Modifier, Supprimer, Fermer. Desktop = panneau latéral droit d'environ 480 px ; mobile = plein écran.
3. **Formulaire de recette** — nom, sélection du type, portions, upload et aperçu de photo, **sélecteur d'ingrédients** (recherche dans le catalogue du foyer, création à la volée, quantité + unité par ingrédient), **éditeur d'étapes** (réordonnables par drag, une seule étape ouverte à la fois en accordéon, possibilité de **rattacher des ingrédients à une étape**, **bouton de dictée vocale** avec état « écoute en cours »), sélection des tags. Montre les états de champ : normal, focus, erreur.
4. **Mode Cuisson** — plein écran, priorité mobile : bouton « Quitter » collant, nom de la recette + portions + nombre d'étapes, **barre de progression** « Étape 3 / 7 », instruction en très gros texte lisible à distance, **ingrédients nécessaires à cette étape** (vignettes), navigation Précédent / Suivant en bas, écran de fin « Recette terminée ».

### 2. Planning hebdo

5. **Planning, vue grille** (desktop) — en-tête « Planning des repas » + navigation de semaine (← Semaine 12 · 17–23 mars →) + bascule grille/liste. **Grille 7 colonnes (jours, aujourd'hui mis en évidence) × 2 lignes (Midi / Soir)**. Chaque case dans ses 5 états : vide (« + Ajouter » discret), remplie (mini photo du plat + nom + actions au survol), passée (grisée), repas libre (badge ✏️), plat multi-jours (badge 📌 2/3). Montre aussi un **drag and drop en cours** : case source estompée, case cible surlignée.
6. **Planning, vue liste** (mobile) — un bloc par jour, Midi et Soir empilés, jour courant épinglé en haut.
7. **Sélecteur de recette** (modale desktop / bottom sheet mobile) — recherche, filtres rapides par type, liste compacte de recettes avec vignette, onglet « Repas libre » pour saisir un texte, option « étaler sur N jours ».
8. **Templates de semaine** (modale) — enregistrer la semaine courante comme modèle, appliquer un modèle existant, liste des modèles.
9. **Extras de la semaine** — section listant les articles ajoutés manuellement au planning, qui iront dans les courses.

### 3. Liste de courses

10. **Liste de courses** — en-tête « Liste de Courses » + sous-titre « Générée automatiquement à partir de votre planning » ; **bandeau de stats** (nombre d'articles, nombre de cochés, progression en %) ; boutons « Mode Course » (primaire) et « Ajouter », plus un menu ⋮ (Tout cocher / Tout décocher / Cocher les items perso / Décocher les items perso) ; **sections repliables par rayon** avec emoji et compteur ; ligne d'article : checkbox, nom, quantité agrégée + unité, provenance (« pour Risotto, Curry »), badge pour les **items permanents**, suppression pour les items ajoutés à la main ; section « ✅ Cochés » en fin de liste ; formulaire d'ajout inline (nom, rayon, quantité, unité).
11. **Mode Course** — plein écran, **mobile prioritaire**, pensé pour être utilisé **d'une main, en marchant, dans un supermarché** : contrastes très marqués, cibles tactiles larges, barre de progression collante en haut, articles regroupés par rayon, article coché barré et estompé, sortie facile. C'est l'écran signature du produit : soigne-le particulièrement.
12. **Gestion des items permanents** — liste des articles récurrents du foyer, ajout, suppression.

### 4. Onboarding et réglages

13. **Connexion** — carte centrée, logo (icône `Utensils` dans une pastille), « Go Gourmet », « Organisez vos recettes et repas », titre « Bienvenue », bouton « Se connecter avec Google » avec le logo Google, état de chargement, état d'erreur.
14. **Mise en place du foyer** — deux voies : **créer un foyer** (nom) ou **rejoindre un foyer** (code d'invitation), plus un écran de succès.
15. **Ingrédients** (catalogue du foyer) — recherche, filtre par catégorie, **sections par catégorie** avec emoji, ligne d'ingrédient (photo ou placeholder, nom, catégorie, unité par défaut), formulaire d'ajout/édition avec upload de photo, état vide.
16. **Plus / Réglages** — sections : Pages (accès Ingrédients), Informations du foyer (nom éditable), Inviter des membres (code + lien à copier, bouton « Copier »), Membres du foyer (avatars Google, badge créateur), Paramètres par défaut (portions par défaut), Compte (avatar, nom, email, Se déconnecter), Application (version, installation PWA).

## Composants récurrents à traiter comme un système

Barre de navigation (mobile en bas / desktop en haut, état actif orange) • carte recette • puce de filtre (type, tag, actif/inactif) • badge de tag coloré • boutons primaire / secondaire / fantôme / icône seule • champ texte, select, textarea (normal / focus / erreur / désactivé) • checkbox de course (cochée / non cochée) • case de créneau de planning (5 états) • en-tête de section repliable • modale desktop et bottom sheet mobile • panneau latéral droit • bandeau de stats • barre de progression • états vides illustrés • skeletons de chargement • toasts succès et erreur • avatar de membre.

## Contenu de démo (à utiliser, pas de lorem ipsum)

- **Recettes** : Risotto aux champignons, Curry de lentilles corail, Poulet rôti au citron, Gratin dauphinois, Buddha bowl, Chili sin carne, Blanquette de veau, Tarte tatin, Velouté de butternut, Pad thaï aux crevettes
- **Ingrédients** : riz arborio, champignons de Paris, parmesan, lentilles corail, lait de coco, poulet fermier, pommes de terre, crème fraîche, pois chiches, patate douce
- **Foyer** : « Chez Antoine & Marie », 2 membres. Semaine 12, 17–23 mars.

## Contraintes à ne pas enfreindre

- **Français partout**, dark only, accent orange conservé
- **Mobile-first** : si un compromis est nécessaire, il se fait au bénéfice du mobile
- Ne pas introduire de fonctionnalité absente de la liste ci-dessus (pas de notes ou d'étoiles, pas de nutrition, pas de dimension sociale, pas de suggestions IA) : c'est une refonte visuelle, pas une extension de périmètre
- Rester implémentable en CSS Modules sans librairie de composants : pas d'effets impossibles à reproduire raisonnablement
- Icônes cohérentes avec lucide-react : linéaires, pas de pictogrammes pleins
- Accessibilité : contraste AA minimum sur le fond bleu nuit, états focus visibles, cibles tactiles de 44 px minimum

## Livrable attendu

Un canvas organisé en 4 sections (Recettes / Planning / Courses / Onboarding et réglages), chaque écran en version mobile et desktop côte à côte, **précédé d'une planche « Fondations »** (palette révisée avec codes hex, échelle typo, spacing, rayons, ombres, états des composants clés). Annote les artboards avec les noms d'écrans utilisés dans le code : `Recipes`, `RecipeDetail`, `RecipeForm`, `CookingMode`, `Planning`, `RecipePicker`, `TemplatesModal`, `ShoppingList`, `Ingredients`, `Login`, `HouseholdSetup`, `Settings`.
