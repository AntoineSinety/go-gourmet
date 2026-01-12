import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { db } from '../services/firebase';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot
} from 'firebase/firestore';
import { useHousehold } from './HouseholdContext';

const PermanentItemsContext = createContext();

export const usePermanentItems = () => {
  const context = useContext(PermanentItemsContext);
  if (!context) {
    throw new Error('usePermanentItems must be used within a PermanentItemsProvider');
  }
  return context;
};

export const PermanentItemsProvider = ({ children }) => {
  const { household } = useHousehold();
  const [permanentItems, setPermanentItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Écouter les changements en temps réel
  useEffect(() => {
    if (!household) {
      setLoading(false);
      setPermanentItems([]);
      return;
    }

    const docRef = doc(db, 'permanentShoppingItems', household.id);

    // Utiliser onSnapshot pour les mises à jour en temps réel
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setPermanentItems(data.items || []);
      } else {
        setPermanentItems([]);
      }
      setLoading(false);
    }, (error) => {
      console.error('Error listening to permanent items:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [household]);

  /**
   * Ajoute un article permanent
   * @param {Object} itemData - { name, category, quantity?, unit? }
   */
  const addPermanentItem = useCallback(async (itemData) => {
    if (!household) return;

    const docRef = doc(db, 'permanentShoppingItems', household.id);

    const newItem = {
      id: `permanent_${Date.now()}`,
      name: itemData.name,
      category: itemData.category || 'Autres',
      quantity: itemData.quantity || null,
      unit: itemData.unit || '',
      createdAt: new Date().toISOString()
    };

    const updatedItems = [...permanentItems, newItem];

    try {
      // Vérifier si le document existe
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        await updateDoc(docRef, {
          items: updatedItems,
          updatedAt: new Date().toISOString()
        });
      } else {
        await setDoc(docRef, {
          householdId: household.id,
          items: updatedItems,
          updatedAt: new Date().toISOString()
        });
      }

      // L'état sera mis à jour par onSnapshot
    } catch (error) {
      console.error('Error adding permanent item:', error);
      throw error;
    }
  }, [household, permanentItems]);

  /**
   * Supprime un article permanent
   * @param {string} itemId - ID de l'article à supprimer
   */
  const deletePermanentItem = useCallback(async (itemId) => {
    if (!household) return;

    const docRef = doc(db, 'permanentShoppingItems', household.id);
    const updatedItems = permanentItems.filter(item => item.id !== itemId);

    try {
      await updateDoc(docRef, {
        items: updatedItems,
        updatedAt: new Date().toISOString()
      });
      // L'état sera mis à jour par onSnapshot
    } catch (error) {
      console.error('Error deleting permanent item:', error);
      throw error;
    }
  }, [household, permanentItems]);

  /**
   * Met à jour un article permanent
   * @param {string} itemId - ID de l'article
   * @param {Object} updates - Données à mettre à jour
   */
  const updatePermanentItem = useCallback(async (itemId, updates) => {
    if (!household) return;

    const docRef = doc(db, 'permanentShoppingItems', household.id);
    const updatedItems = permanentItems.map(item =>
      item.id === itemId ? { ...item, ...updates } : item
    );

    try {
      await updateDoc(docRef, {
        items: updatedItems,
        updatedAt: new Date().toISOString()
      });
      // L'état sera mis à jour par onSnapshot
    } catch (error) {
      console.error('Error updating permanent item:', error);
      throw error;
    }
  }, [household, permanentItems]);

  const value = {
    permanentItems,
    loading,
    addPermanentItem,
    deletePermanentItem,
    updatePermanentItem
  };

  return (
    <PermanentItemsContext.Provider value={value}>
      {children}
    </PermanentItemsContext.Provider>
  );
};
