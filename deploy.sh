#!/usr/bin/env sh

# Arrêter en cas d'erreur
set -e

# Build
npm run build

# Aller dans le dossier dist
cd dist

# Initialiser git
git init
git add -A
git commit -m 'Deploy to GitHub Pages'

# Pousser vers gh-pages
git push -f https://github.com/AntoineSinety/go-gourmet.git master:gh-pages

cd ..

# Nettoyer
rm -rf dist/.git

echo "Déploiement terminé !"
