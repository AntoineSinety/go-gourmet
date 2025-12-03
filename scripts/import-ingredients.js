import admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Firebase Admin
// You need to download your service account key from Firebase Console:
// Project Settings > Service Accounts > Generate new private key
const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json');

if (!fs.existsSync(serviceAccountPath)) {
  console.error('❌ Service account key not found!');
  console.error('Please download your Firebase service account key and save it as:');
  console.error(`   ${serviceAccountPath}`);
  console.error('\nTo get your service account key:');
  console.error('1. Go to Firebase Console');
  console.error('2. Project Settings > Service Accounts');
  console.error('3. Click "Generate new private key"');
  console.error('4. Save the file as "serviceAccountKey.json" in the scripts/ folder');
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf-8'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET
});

const db = admin.firestore();
const bucket = admin.storage().bucket();

// Category mapping from JSON to app categories
const CATEGORY_MAPPING = {
  'fruits-legumes': 'fruits-legumes',
  'viandes': 'viandes-poissons',
  'poissons': 'viandes-poissons',
  'produits-laitiers': 'produits-laitiers',
  'epicerie-salee': 'epicerie-salee',
  'epicerie-sucree': 'epicerie-sucree',
  'condiments': 'condiments',
  'herbes-epices': 'condiments'
};

// Download image from URL
async function downloadImage(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.statusText}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error) {
    console.error(`Error downloading image from ${url}:`, error.message);
    throw error;
  }
}

// Upload image to Firebase Storage
async function uploadImageToStorage(imageBuffer, ingredientName) {
  try {
    // Create a safe filename
    const safeFileName = ingredientName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove accents
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    const fileName = `ingredients/${safeFileName}-${Date.now()}.jpg`;
    const file = bucket.file(fileName);

    // Upload the image
    await file.save(imageBuffer, {
      metadata: {
        contentType: 'image/jpeg',
      },
    });

    // Make the file publicly accessible
    await file.makePublic();

    // Get the public URL
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
    return publicUrl;
  } catch (error) {
    console.error(`Error uploading image for ${ingredientName}:`, error.message);
    throw error;
  }
}

// Create ingredient in Firestore
async function createIngredient(name, category, imageUrl) {
  try {
    const ingredientData = {
      name,
      category,  // Use 'category' to match the app's field name
      imageUrl,
      householdId: 'global', // Global ingredients available to all households
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };

    const docRef = await db.collection('ingredients').add(ingredientData);
    return docRef.id;
  } catch (error) {
    console.error(`Error creating ingredient ${name}:`, error.message);
    throw error;
  }
}

// Main import function
async function importIngredients() {
  try {
    // Read the JSON file
    const jsonPath = path.join('C:', 'Users', 'antoi', 'Downloads', 'ingredients-go-gourmet.json');

    if (!fs.existsSync(jsonPath)) {
      console.error(`❌ JSON file not found at: ${jsonPath}`);
      console.error('Please make sure the file exists at this location.');
      process.exit(1);
    }

    const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

    console.log('🚀 Starting ingredient import...\n');
    console.log(`📁 Reading from: ${jsonPath}\n`);

    let totalCount = 0;
    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    // Process each category
    for (const [jsonCategory, ingredients] of Object.entries(jsonData)) {
      const appCategory = CATEGORY_MAPPING[jsonCategory];

      if (!appCategory) {
        console.log(`⚠️  Skipping unknown category: ${jsonCategory}`);
        continue;
      }

      console.log(`\n📂 Processing category: ${jsonCategory} -> ${appCategory}`);
      console.log(`   ${ingredients.length} ingredients to import`);

      // Process each ingredient in the category
      for (const ingredient of ingredients) {
        totalCount++;

        try {
          console.log(`\n   ⏳ [${totalCount}] ${ingredient.name}...`);

          // Download image
          console.log(`      📥 Downloading image...`);
          const imageBuffer = await downloadImage(ingredient.image);

          // Upload to Firebase Storage
          console.log(`      ☁️  Uploading to Storage...`);
          const imageUrl = await uploadImageToStorage(imageBuffer, ingredient.name);

          // Create Firestore document
          console.log(`      💾 Creating Firestore document...`);
          const docId = await createIngredient(ingredient.name, appCategory, imageUrl);

          console.log(`      ✅ Success! (ID: ${docId})`);
          successCount++;

          // Small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 500));

        } catch (error) {
          console.error(`      ❌ Failed: ${error.message}`);
          errorCount++;
          errors.push({
            name: ingredient.name,
            category: jsonCategory,
            error: error.message
          });
        }
      }
    }

    console.log('\n\n' + '='.repeat(70));
    console.log('📊 Import Summary');
    console.log('='.repeat(70));
    console.log(`Total processed: ${totalCount}`);
    console.log(`✅ Successful: ${successCount}`);
    console.log(`❌ Failed: ${errorCount}`);

    if (errors.length > 0) {
      console.log('\n❌ Errors:');
      errors.forEach(err => {
        console.log(`   - ${err.name} (${err.category}): ${err.error}`);
      });
    }

    console.log('='.repeat(70));

  } catch (error) {
    console.error('💥 Fatal error during import:', error);
    process.exit(1);
  }
}

// Run the import
importIngredients()
  .then(() => {
    console.log('\n✨ Import complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Import failed:', error);
    process.exit(1);
  });
