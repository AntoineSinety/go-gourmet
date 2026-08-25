import { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../services/firebase';
import {
  collection,
  query,
  where,
  getDocs,
  onSnapshot,
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
  { id: 'fruits-legumes', label: 'Fruits & Légumes', icon: '🥬', tone: 'green' },
  { id: 'viandes-poissons', label: 'Viandes & Poissons', icon: '🥩', tone: 'red' },
  { id: 'produits-laitiers', label: 'Produits laitiers', icon: '🧀', tone: 'yellow' },
  { id: 'epicerie-salee', label: 'Épicerie salée', icon: '🍝', tone: 'amber' },
  { id: 'epicerie-sucree', label: 'Épicerie sucrée', icon: '🍪', tone: 'pink' },
  { id: 'surgeles', label: 'Surgelés', icon: '❄️', tone: 'teal' },
  { id: 'boissons', label: 'Boissons', icon: '🥤', tone: 'sky' },
  { id: 'pain-viennoiserie', label: 'Pain & Viennoiserie', icon: '🥖', tone: 'purple' },
  { id: 'condiments', label: 'Condiments & Sauces', icon: '🧂', tone: 'accent' },
  { id: 'conserves', label: 'Conserves', icon: '🥫', tone: 'emerald' },
  { id: 'autres', label: 'Autres', icon: '📦', tone: 'neutral' }
];

export const IngredientProvider = ({ children }) => {
  const { household } = useHousehold();
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(true);

  // Deux écoutes en parallèle — le catalogue du foyer et le catalogue global —
  // recombinées à chaque notification de l'une ou l'autre.
  useEffect(() => {
    if (!household) {
      setIngredients([]);
      setLoading(false);
      return undefined;
    }

    setLoading(true);

    const sources = { household: null, global: null };

    const publish = () => {
      // Tant que les deux écoutes n'ont pas répondu, on garde l'état de
      // chargement : afficher un demi-catalogue serait pire que d'attendre.
      if (sources.household === null || sources.global === null) return;

      setIngredients(
        [...sources.household, ...sources.global].sort((a, b) =>
          a.name.localeCompare(b.name, 'fr')
        )
      );
      setLoading(false);
    };

    const listen = (householdId, bucket) =>
      onSnapshot(
        query(collection(db, 'ingredients'), where('householdId', '==', householdId)),
        (snapshot) => {
          sources[bucket] = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
          publish();
        },
        (error) => {
          console.error(`Error listening to ${bucket} ingredients:`, error);
          sources[bucket] = [];
          publish();
        }
      );

    const unsubscribes = [
      listen(household.id, 'household'),
      listen('global', 'global')
    ];

    return () => unsubscribes.forEach((u) => u());
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
