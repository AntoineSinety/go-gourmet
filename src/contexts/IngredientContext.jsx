import { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../services/firebase';
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  doc,
  updateDoc,
  deleteDoc
} from 'firebase/firestore';
import { useHousehold } from './HouseholdContext';
import { uploadImage, deleteImage } from '../services/imageService';

const IngredientContext = createContext();

export const useIngredients = () => {
  const context = useContext(IngredientContext);
  if (!context) {
    throw new Error('useIngredients must be used within IngredientProvider');
  }
  return context;
};

export const INGREDIENT_CATEGORIES = [
  { id: 'fruits-legumes', label: 'Fruits & Légumes', icon: '🥬' },
  { id: 'viandes-poissons', label: 'Viandes & Poissons', icon: '🥩' },
  { id: 'produits-laitiers', label: 'Produits laitiers', icon: '🧀' },
  { id: 'epicerie-salee', label: 'Épicerie salée', icon: '🍝' },
  { id: 'epicerie-sucree', label: 'Épicerie sucrée', icon: '🍪' },
  { id: 'surgeles', label: 'Surgelés', icon: '❄️' },
  { id: 'boissons', label: 'Boissons', icon: '🥤' },
  { id: 'pain-viennoiserie', label: 'Pain & Viennoiserie', icon: '🥖' },
  { id: 'condiments', label: 'Condiments & Sauces', icon: '🧂' },
  { id: 'conserves', label: 'Conserves', icon: '🥫' },
  { id: 'autres', label: 'Autres', icon: '📦' }
];

export const IngredientProvider = ({ children }) => {
  const { household } = useHousehold();
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadIngredients = async () => {
      if (!household) {
        setIngredients([]);
        setLoading(false);
        return;
      }

      try {
        // Charger les ingrédients du household
        const householdQuery = query(
          collection(db, 'ingredients'),
          where('householdId', '==', household.id)
        );

        // Charger les ingrédients globaux
        const globalQuery = query(
          collection(db, 'ingredients'),
          where('householdId', '==', 'global')
        );

        const [householdSnapshot, globalSnapshot] = await Promise.all([
          getDocs(householdQuery),
          getDocs(globalQuery)
        ]);

        const householdIngredients = householdSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        const globalIngredients = globalSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // Combiner et trier par nom
        const allIngredients = [...householdIngredients, ...globalIngredients]
          .sort((a, b) => a.name.localeCompare(b.name));

        setIngredients(allIngredients);
      } catch (error) {
        console.error('Error loading ingredients:', error);
      } finally {
        setLoading(false);
      }
    };

    loadIngredients();
  }, [household]);

  const addIngredient = async (ingredientData, imageFile = null) => {
    if (!household) return;

    try {
      // Créer d'abord l'ingrédient pour avoir son ID
      const docRef = await addDoc(collection(db, 'ingredients'), {
        name: ingredientData.name,
        category: ingredientData.category,
        householdId: household.id,
        createdAt: new Date().toISOString(),
        imageUrl: null
      });

      let imageUrl = null;

      // Upload l'image si présente
      if (imageFile) {
        imageUrl = await uploadImage(imageFile, 'ingredients', docRef.id, household.id);
        // Mettre à jour avec l'URL de l'image
        await updateDoc(docRef, { imageUrl });
      }

      const newIngredient = {
        id: docRef.id,
        name: ingredientData.name,
        category: ingredientData.category,
        householdId: household.id,
        createdAt: new Date().toISOString(),
        imageUrl
      };

      setIngredients(prev => [...prev, newIngredient].sort((a, b) =>
        a.name.localeCompare(b.name)
      ));

      return newIngredient;
    } catch (error) {
      console.error('Error adding ingredient:', error);
      throw error;
    }
  };

  const updateIngredient = async (id, updates, imageFile = null, removeImage = false) => {
    if (!household) return;

    try {
      const ingredientRef = doc(db, 'ingredients', id);
      let finalUpdates = { ...updates };

      // Supprimer l'ancienne image si on la remplace ou la supprime
      if ((imageFile || removeImage) && updates.imageUrl) {
        await deleteImage(updates.imageUrl);
      }

      // Upload la nouvelle image
      if (imageFile) {
        const newImageUrl = await uploadImage(imageFile, 'ingredients', id, household.id);
        finalUpdates.imageUrl = newImageUrl;
      } else if (removeImage) {
        finalUpdates.imageUrl = null;
      }

      await updateDoc(ingredientRef, finalUpdates);

      setIngredients(prev =>
        prev.map(ing => (ing.id === id ? { ...ing, ...finalUpdates } : ing))
      );
    } catch (error) {
      console.error('Error updating ingredient:', error);
      throw error;
    }
  };

  const deleteIngredient = async (id) => {
    try {
      // Récupérer l'ingrédient pour obtenir l'URL de l'image
      const ingredient = ingredients.find(ing => ing.id === id);

      // Supprimer l'image si elle existe
      if (ingredient?.imageUrl) {
        await deleteImage(ingredient.imageUrl);
      }

      await deleteDoc(doc(db, 'ingredients', id));
      setIngredients(prev => prev.filter(ing => ing.id !== id));
    } catch (error) {
      console.error('Error deleting ingredient:', error);
      throw error;
    }
  };

  const searchIngredients = (searchTerm) => {
    if (!searchTerm) return ingredients;
    const term = searchTerm.toLowerCase();
    return ingredients.filter(ing =>
      ing.name.toLowerCase().includes(term)
    );
  };

  const getIngredientRecipes = async (ingredientId) => {
    if (!household) return [];

    try {
      const q = query(
        collection(db, 'recipes'),
        where('householdId', '==', household.id)
      );

      const snapshot = await getDocs(q);
      const recipes = snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        .filter(recipe =>
          recipe.ingredients?.some(ing => ing.ingredientId === ingredientId)
        );

      return recipes;
    } catch (error) {
      console.error('Error getting ingredient recipes:', error);
      return [];
    }
  };

  const value = {
    ingredients,
    loading,
    addIngredient,
    updateIngredient,
    deleteIngredient,
    searchIngredients,
    getIngredientRecipes
  };

  return (
    <IngredientContext.Provider value={value}>
      {children}
    </IngredientContext.Provider>
  );
};
