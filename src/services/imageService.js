import { storage } from './firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

// Configuration de la compression
const COMPRESSION_CONFIG = {
  maxWidth: 1200,
  maxHeight: 1200,
  quality: 0.8,
  mimeType: 'image/jpeg'
};

/**
 * Compresse une image avant upload
 * @param {File} file - Le fichier image original
 * @returns {Promise<Blob>} L'image compressée
 */
const compressImage = (file) => {
  return new Promise((resolve, reject) => {
    // Si ce n'est pas une image, retourner tel quel
    if (!file.type.startsWith('image/')) {
      resolve(file);
      return;
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      let { width, height } = img;

      // Calculer les nouvelles dimensions en gardant le ratio
      if (width > COMPRESSION_CONFIG.maxWidth) {
        height = (height * COMPRESSION_CONFIG.maxWidth) / width;
        width = COMPRESSION_CONFIG.maxWidth;
      }
      if (height > COMPRESSION_CONFIG.maxHeight) {
        width = (width * COMPRESSION_CONFIG.maxHeight) / height;
        height = COMPRESSION_CONFIG.maxHeight;
      }

      canvas.width = width;
      canvas.height = height;

      // Dessiner l'image redimensionnée
      ctx.drawImage(img, 0, 0, width, height);

      // Convertir en blob compressé
      canvas.toBlob(
        (blob) => {
          if (blob) {
            // Log de la compression pour debug
            const reduction = ((file.size - blob.size) / file.size * 100).toFixed(1);
            console.log(`Image compressed: ${(file.size / 1024).toFixed(1)}KB -> ${(blob.size / 1024).toFixed(1)}KB (-${reduction}%)`);
            resolve(blob);
          } else {
            reject(new Error('Failed to compress image'));
          }
        },
        COMPRESSION_CONFIG.mimeType,
        COMPRESSION_CONFIG.quality
      );
    };

    img.onerror = () => reject(new Error('Failed to load image'));

    // Charger l'image depuis le fichier
    const reader = new FileReader();
    reader.onload = (e) => {
      img.src = e.target.result;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
};

/**
 * Upload une image vers Firebase Storage
 * @param {File} file - Le fichier image à uploader
 * @param {string} type - Type de ressource ('recipes' ou 'ingredients')
 * @param {string} id - ID de la ressource
 * @param {string} householdId - ID du household
 * @returns {Promise<string>} URL de téléchargement de l'image
 */
export const uploadImage = async (file, type, id, householdId) => {
  if (!file) return null;

  try {
    // Compresser l'image avant upload
    const compressedImage = await compressImage(file);

    // Créer un nom de fichier unique (toujours .jpg après compression)
    const timestamp = Date.now();
    const fileName = `${id}_${timestamp}.jpg`;

    // Chemin dans Storage: households/{householdId}/{type}/{fileName}
    const storagePath = `households/${householdId}/${type}/${fileName}`;
    const storageRef = ref(storage, storagePath);

    // Upload l'image compressée
    await uploadBytes(storageRef, compressedImage);

    // Récupérer l'URL
    const downloadURL = await getDownloadURL(storageRef);

    return downloadURL;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
};

/**
 * Supprime une image de Firebase Storage
 * @param {string} imageUrl - URL de l'image à supprimer
 */
export const deleteImage = async (imageUrl) => {
  if (!imageUrl) return;

  try {
    // Extraire le chemin depuis l'URL
    const url = new URL(imageUrl);
    const pathMatch = url.pathname.match(/\/o\/(.+?)\?/);

    if (pathMatch) {
      const path = decodeURIComponent(pathMatch[1]);
      const imageRef = ref(storage, path);
      await deleteObject(imageRef);
    }
  } catch (error) {
    console.error('Error deleting image:', error);
    throw error;
  }
};

/**
 * Renvoie l'URL d'affichage d'une image.
 *
 * Le nom a gardé « WithCache » pour ne pas casser les appels, mais le cache
 * ne se fait plus ici : les URL de téléchargement Firebase portent un jeton et
 * un cache IndexedDB local butait sur CORS. La mise en cache réelle est faite
 * par le service worker (CacheFirst sur firebasestorage.googleapis.com,
 * 30 jours), configuré dans vite.config.js.
 *
 * @param {string} url
 * @returns {Promise<string|null>}
 */
export const loadImageWithCache = async (url) => url || null;
