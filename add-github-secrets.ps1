# Script PowerShell pour ajouter les secrets GitHub
# Assurez-vous d'avoir GitHub CLI installé : https://cli.github.com/

gh secret set VITE_FIREBASE_API_KEY -b "AIzaSyD3iqoFT7CVEvDQMybjl4CFUyWDNBK9Mqg"
gh secret set VITE_FIREBASE_AUTH_DOMAIN -b "go-gourmet-f36f1.firebaseapp.com"
gh secret set VITE_FIREBASE_PROJECT_ID -b "go-gourmet-f36f1"
gh secret set VITE_FIREBASE_STORAGE_BUCKET -b "go-gourmet-f36f1.firebasestorage.app"
gh secret set VITE_FIREBASE_MESSAGING_SENDER_ID -b "414957229790"
gh secret set VITE_FIREBASE_APP_ID -b "1:414957229790:web:accc4a0b42440b65ccd44f"

Write-Host "Tous les secrets ont été ajoutés avec succès!" -ForegroundColor Green
