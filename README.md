# Go Gourmet

Application PWA de gestion de recettes de cuisine avec planning de repas et génération de listes de courses.

## Fonctionnalités actuelles

- Authentification Google via Firebase
- Système de foyers partagés
- Thème sombre minimaliste optimisé mobile/tablette
- Progressive Web App (PWA)

## Installation

1. Cloner le projet et installer les dépendances :
```bash
npm install
```

2. Configurer Firebase :
   - Créer un projet Firebase sur https://console.firebase.google.com
   - Activer l'authentification Google dans la section Authentication
   - Ajouter votre domaine autorisé (localhost:5173 pour le dev)
   - Créer une base de données Firestore (mode production)
   - Copier et coller les règles depuis le fichier `firestore.rules` dans la section Rules de Firestore
   - Copier les identifiants Firebase dans le fichier `.env`

3. Configurer les variables d'environnement :
   - Copier `.env.example` vers `.env`
   - Remplir avec vos identifiants Firebase

4. Lancer le serveur de développement :
```bash
npm run dev
```

## Configuration Firebase

### Firestore Database

Créer les collections suivantes dans Firestore :

#### Collection `users`
```
users/{userId}
  - email: string
  - displayName: string
  - photoURL: string
  - createdAt: string
  - householdId: string | null
```

#### Collection `households`
```
households/{householdId}
  - name: string
  - members: array<string>
  - createdBy: string
  - createdAt: string
```

### Règles de sécurité Firestore

**IMPORTANT** : Les règles de sécurité sont dans le fichier [firestore.rules](firestore.rules).

Pour les déployer :
1. Aller dans la console Firebase > Firestore Database > Rules
2. Copier-coller le contenu du fichier `firestore.rules`
3. Cliquer sur "Publier"

Les collections `users` et `households` seront créées automatiquement lors de la première utilisation.

## Structure du projet

```
src/
├── components/       # Composants réutilisables
├── contexts/         # Contexts React (Auth, Household)
├── pages/           # Pages de l'application
├── services/        # Services (Firebase)
├── utils/           # Fonctions utilitaires
└── App.jsx          # Composant principal
```

## Technologies

- React 18
- Vite
- Firebase (Auth + Firestore)
- PWA (vite-plugin-pwa)

## À venir

- Gestion des recettes
- Gestion des ingrédients
- Planning de repas hebdomadaire
- Génération automatique de liste de courses
- Organisation par catégories de magasin
