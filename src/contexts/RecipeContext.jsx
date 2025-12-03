import { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../services/firebase';
import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  orderBy
} from 'firebase/firestore';
import { useHousehold } from './HouseholdContext';
import { uploadImage, deleteImage } from '../services/imageService';

const RecipeContext = createContext();

export const useRecipes = () => {
  const context = useContext(RecipeContext);
  if (!context) {
    throw new Error('useRecipes must be used within RecipeProvider');
  }
  return context;
};

export const RecipeProvider = ({ children }) => {
  const { household } = useHousehold();
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadRecipes = async () => {
      if (!household) {
        setRecipes([]);
        setLoading(false);
        return;
      }

      try {
        const q = query(
          collection(db, 'recipes'),
          where('householdId', '==', household.id),
          orderBy('createdAt', 'desc')
        );

        const snapshot = await getDocs(q);
        const recipesList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        setRecipes(recipesList);
      } catch (error) {
        console.error('Error loading recipes:', error);
      } finally {
        setLoading(false);
      }
    };

    loadRecipes();
  }, [household]);

  const addRecipe = async (recipeData, imageFile = null) => {
    if (!household) return;

    try {
      // Créer d'abord la recette pour avoir son ID
      const docRef = await addDoc(collection(db, 'recipes'), {
        ...recipeData,
        householdId: household.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        imageUrl: null
      });

      let imageUrl = null;

      // Upload l'image si présente
      if (imageFile) {
        imageUrl = await uploadImage(imageFile, 'recipes', docRef.id, household.id);
        // Mettre à jour avec l'URL de l'image
        await updateDoc(docRef, { imageUrl });
      }

      const newRecipe = {
        id: docRef.id,
        ...recipeData,
        householdId: household.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        imageUrl
      };

      setRecipes(prev => [newRecipe, ...prev]);
      return newRecipe;
    } catch (error) {
      console.error('Error adding recipe:', error);
      throw error;
    }
  };

  const updateRecipe = async (id, updates, imageFile = null, removeImage = false) => {
    if (!household) return;

    try {
      const recipeRef = doc(db, 'recipes', id);
      let finalUpdates = { ...updates, updatedAt: new Date().toISOString() };

      // Supprimer l'ancienne image si on la remplace ou la supprime
      if ((imageFile || removeImage) && updates.imageUrl) {
        await deleteImage(updates.imageUrl);
      }

      // Upload la nouvelle image
      if (imageFile) {
        const newImageUrl = await uploadImage(imageFile, 'recipes', id, household.id);
        finalUpdates.imageUrl = newImageUrl;
      } else if (removeImage) {
        finalUpdates.imageUrl = null;
      }

      await updateDoc(recipeRef, finalUpdates);

      setRecipes(prev =>
        prev.map(recipe => (recipe.id === id ? { ...recipe, ...finalUpdates } : recipe))
      );
    } catch (error) {
      console.error('Error updating recipe:', error);
      throw error;
    }
  };

  const deleteRecipe = async (id) => {
    try {
      // Récupérer la recette pour obtenir l'URL de l'image
      const recipe = recipes.find(r => r.id === id);

      // Supprimer l'image si elle existe
      if (recipe?.imageUrl) {
        await deleteImage(recipe.imageUrl);
      }

      await deleteDoc(doc(db, 'recipes', id));
      setRecipes(prev => prev.filter(recipe => recipe.id !== id));
    } catch (error) {
      console.error('Error deleting recipe:', error);
      throw error;
    }
  };

  const getRecipe = async (id) => {
    try {
      const recipeRef = doc(db, 'recipes', id);
      const recipeDoc = await getDoc(recipeRef);
      
      if (recipeDoc.exists()) {
        return {
          id: recipeDoc.id,
          ...recipeDoc.data()
        };
      }
      return null;
    } catch (error) {
      console.error('Error getting recipe:', error);
      throw error;
    }
  };

  const value = {
    recipes,
    loading,
    addRecipe,
    updateRecipe,
    deleteRecipe,
    getRecipe
  };

  return (
    <RecipeContext.Provider value={value}>
      {children}
    </RecipeContext.Provider>
  );
};
