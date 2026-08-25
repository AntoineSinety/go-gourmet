# Script d'Import des Ingrédients

Ce script permet d'importer automatiquement tous les ingrédients depuis le fichier JSON exporté vers Firebase (Firestore + Storage).

## Prérequis

### 1. Télécharger la clé de compte de service Firebase

Pour que le script puisse accéder à Firebase, vous devez télécharger une clé de compte de service :

1. Allez sur la [Console Firebase](https://console.firebase.google.com/)
2. Sélectionnez votre projet **Go Gourmet**
3. Cliquez sur l'icône ⚙️ (Paramètres) > **Paramètres du projet**
4. Allez dans l'onglet **Comptes de service**
5. Cliquez sur **Générer une nouvelle clé privée**
6. Confirmez en cliquant sur **Générer la clé**
7. Un fichier JSON sera téléchargé
8. **Renommez ce fichier en `serviceAccountKey.json`**
9. **Déplacez-le dans `~/.go-gourmet/`** — hors du dépôt, pour qu’aucune archive ni synchronisation ne l’emporte

   Autre possibilité : pointer `GOOGLE_APPLICATION_CREDENTIALS` dessus.

   > Cette clé donne un accès **administrateur complet** au projet et contourne
   > toutes les règles de sécurité. Elle ne doit jamais être versionnée.

⚠️ **IMPORTANT** : Ne partagez JAMAIS ce fichier ! Il contient des credentials sensibles. Le fichier est déjà dans `.gitignore`.

### 2. Installer les dépendances

```bash
npm install
```

## Utilisation

### 1. Préparer le fichier JSON

Assurez-vous que votre fichier `ingredients-go-gourmet.json` est bien dans le dossier Downloads :
```
C:\Users\antoi\Downloads\ingredients-go-gourmet.json
```

Si le fichier est ailleurs, modifiez le chemin dans `import-ingredients.js` ligne 124.

### 2. Lancer l'import

```bash
npm run import-ingredients
```

## Ce que fait le script

Pour chaque ingrédient dans le JSON :

1. 📥 **Télécharge l'image** depuis l'URL fournie
2. ☁️ **Upload l'image** dans Firebase Storage (`ingredients/`)
3. 💾 **Crée un document Firestore** avec :
   - `name` : Nom de l'ingrédient
   - `categoryId` : Catégorie mappée
   - `imageUrl` : URL de l'image dans Storage
   - `householdId` : "global" (disponible pour tous)
   - `createdAt` : Timestamp

## Mapping des catégories

Le script mappe automatiquement les catégories du JSON vers les catégories de l'application :

| Catégorie JSON | Catégorie App |
|----------------|---------------|
| fruits-legumes | fruits-legumes |
| viandes | viandes-poissons |
| poissons | viandes-poissons |
| produits-laitiers | produits-laitiers |
| epicerie-salee | epicerie-salee |
| epicerie-sucree | epicerie-sucree |
| condiments | condiments |
| herbes-epices | condiments |

## Résultat

Le script affichera :
- ✅ Nombre d'ingrédients importés avec succès
- ❌ Nombre d'échecs (avec détails des erreurs)
- 📊 Résumé complet de l'import

## En cas d'erreur

### Erreur : Service account key not found

```
❌ Service account key not found!
```

**Solution** : Téléchargez la clé de service (voir section Prérequis ci-dessus)

### Erreur : JSON file not found

```
❌ JSON file not found
```

**Solution** : Vérifiez que le fichier JSON est au bon endroit ou modifiez le chemin dans le script

### Erreur : Permission denied

**Solution** : Assurez-vous que votre compte Firebase a les permissions nécessaires (Admin ou Owner du projet)

## Notes

- Le script attend 500ms entre chaque ingrédient pour éviter le rate limiting Firebase
- Les images sont rendues publiques automatiquement
- Les ingrédients sont créés avec `householdId: 'global'` pour être disponibles à tous les foyers
