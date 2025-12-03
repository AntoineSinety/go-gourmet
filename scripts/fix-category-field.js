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
const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json');

if (!fs.existsSync(serviceAccountPath)) {
  console.error('❌ Service account key not found!');
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf-8'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET
});

const db = admin.firestore();

async function fixCategoryField() {
  try {
    console.log('🔧 Fixing category field in ingredients...\n');

    // Get all ingredients with categoryId field
    const snapshot = await db.collection('ingredients')
      .where('householdId', '==', 'global')
      .get();

    console.log(`Found ${snapshot.size} global ingredients to fix\n`);

    let fixedCount = 0;
    let skippedCount = 0;

    // Process each ingredient
    for (const doc of snapshot.docs) {
      const data = doc.data();

      // Check if it has categoryId instead of category
      if (data.categoryId && !data.category) {
        console.log(`Fixing ${data.name}: categoryId → category`);

        // Update the document: rename categoryId to category
        await doc.ref.update({
          category: data.categoryId,
          categoryId: admin.firestore.FieldValue.delete() // Remove the old field
        });

        fixedCount++;
      } else if (data.category) {
        console.log(`Skipping ${data.name}: already has 'category' field`);
        skippedCount++;
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log('✅ Fix complete!');
    console.log('='.repeat(50));
    console.log(`Fixed: ${fixedCount}`);
    console.log(`Skipped: ${skippedCount}`);
    console.log('='.repeat(50));

  } catch (error) {
    console.error('💥 Error:', error);
    process.exit(1);
  }
}

// Run the fix
fixCategoryField()
  .then(() => {
    console.log('\n✨ All done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Failed:', error);
    process.exit(1);
  });
