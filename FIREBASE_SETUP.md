# Guide de Configuration Firebase

## Étape 1 : Créer un projet Firebase

1. Aller sur https://console.firebase.google.com
2. Cliquer sur "Ajouter un projet"
3. Donner un nom (ex: "go-gourmet")
4. Désactiver Google Analytics (optionnel)
5. Créer le projet

## Étape 2 : Créer une application Web

1. Dans la page d'accueil du projet, cliquer sur l'icône Web `</>`
2. Donner un nom à l'application (ex: "Go Gourmet Web")
3. **Cocher** "Configurer aussi Firebase Hosting" (pour le PWA)
4. Cliquer sur "Enregistrer l'application"
5. **Copier les informations de configuration** qui ressemblent à :

```javascript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "xxx.firebaseapp.com",
  projectId: "xxx",
  storageBucket: "xxx.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

## Étape 3 : Configurer l'authentification Google

1. Dans le menu de gauche, cliquer sur "Authentication"
2. Cliquer sur "Commencer"
3. Cliquer sur "Google" dans la liste des fournisseurs
4. Activer le fournisseur Google
5. Choisir un email d'assistance
6. Enregistrer

### Ajouter les domaines autorisés

1. Aller dans Authentication > Settings > Authorized domains
2. Ajouter `localhost` (normalement déjà présent)
3. Plus tard, ajouter votre domaine de production

## Étape 4 : Créer la base Firestore

1. Dans le menu de gauche, cliquer sur "Firestore Database"
2. Cliquer sur "Créer une base de données"
3. Choisir "Démarrer en mode production"
4. Choisir une région (ex: europe-west1 pour l'Europe)
5. Cliquer sur "Activer"

## Étape 5 : Configurer les règles de sécurité Firestore

1. Dans Firestore Database, aller dans l'onglet "Rules"
2. Supprimer le contenu par défaut
3. Copier-coller le contenu du fichier `firestore.rules` de ce projet
4. Cliquer sur "Publier"

## Étape 6 : Configurer le fichier .env

1. Copier le fichier `.env.example` vers `.env`
2. Remplir avec les valeurs de l'étape 2 :

```env
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=xxx.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=xxx
VITE_FIREBASE_STORAGE_BUCKET=xxx.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
```

## Étape 7 : Tester l'application

```bash
npm run dev
```

Ouvrir http://localhost:5173 et tester la connexion avec Google.

## Résolution des problèmes courants

### Erreur "Missing or insufficient permissions"

- Vérifier que les règles Firestore sont bien déployées (Étape 5)
- Vérifier que vous êtes bien connecté

### Erreur "auth/unauthorized-domain"

- Ajouter votre domaine dans Authentication > Settings > Authorized domains

### La popup Google ne s'ouvre pas

- C'est normal, l'application utilise une redirection (signInWithRedirect) au lieu d'une popup
- Vous serez redirigé vers Google puis revenu sur l'application

### Les collections n'apparaissent pas dans Firestore

- C'est normal, elles seront créées automatiquement lors de la première connexion
- Connectez-vous une fois, puis vérifiez dans Firestore Database > Data
