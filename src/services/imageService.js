import { storage } from './firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

// Cache IndexedDB pour les images
const DB_NAME = 'go-gourmet-images';
const DB_VERSION = 1;
const STORE_NAME = 'images';

const openDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'url' });
      }
    };
  });
};

const getCachedImage = async (url) => {
  try {
    const db = await openDB();
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
      const request = store.get(url);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Error getting cached image:', error);
    return null;
  }
};

const cacheImage = async (url, blob) => {
  try {
    const db = await openDB();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
      const request = store.put({ url, blob, timestamp: Date.now() });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Error caching image:', error);
  }
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
    // Créer un nom de fichier unique
    const timestamp = Date.now();
    const extension = file.name.split('.').pop();
    const fileName = `${id}_${timestamp}.${extension}`;

    // Chemin dans Storage: households/{householdId}/{type}/{fileName}
    const storagePath = `households/${householdId}/${type}/${fileName}`;
    const storageRef = ref(storage, storagePath);

    // Upload le fichier
    await uploadBytes(storageRef, file);

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
 * Charge une image avec cache
 * @param {string} url - URL de l'image
 * @returns {Promise<string>} URL de l'image
 */
export const loadImageWithCache = async (url) => {
  if (!url) return null;

  // Pour Firebase Storage, on retourne directement l'URL
  // Firebase gère déjà le caching et les URLs contiennent des tokens d'auth
  // Le cache IndexedDB cause des problèmes CORS avec Firebase Storage
  return url;
};

/**
 * Nettoie le cache des images (supprime les entrées de plus de 7 jours)
 */
export const cleanImageCache = async () => {
  try {
    const db = await openDB();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    const request = store.openCursor();
    const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 jours

    request.onsuccess = (event) => {
      const cursor = event.target.result;
      if (cursor) {
        const data = cursor.value;
        if (Date.now() - data.timestamp > maxAge) {
          cursor.delete();
        }
        cursor.continue();
      }
    };
  } catch (error) {
    console.error('Error cleaning cache:', error);
  }
};
