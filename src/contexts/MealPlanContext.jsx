import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { db } from '../services/firebase';
import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  getDocs
} from 'firebase/firestore';
import { useHousehold } from './HouseholdContext';
import { getCurrentWeek, getWeekDates } from '../utils/weekHelpers';

const MealPlanContext = createContext();

export const useMealPlan = () => {
  const context = useContext(MealPlanContext);
  if (!context) {
    throw new Error('useMealPlan must be used within a MealPlanProvider');
  }
  return context;
};

export const MealPlanProvider = ({ children }) => {
  const { household } = useHousehold();
  const [mealPlan, setMealPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [weekCache, setWeekCache] = useState({}); // Cache des 3 dernières semaines

  // Charger le plan de la semaine courante au montage
  useEffect(() => {
    if (!household) {
      setLoading(false);
      return;
    }

    const { weekNumber, year } = getCurrentWeek();
    loadMealPlan(weekNumber, year);
  }, [household]);

  /**
   * Génère un ID unique pour un meal plan
   * @param {number} weekNumber
   * @param {number} year
   * @param {string} householdId
   * @returns {string}
   */
  const getMealPlanId = (weekNumber, year, householdId) => {
    return `${householdId}_${year}_W${String(weekNumber).padStart(2, '0')}`;
  };

  /**
   * Charge un meal plan depuis Firestore (ou depuis le cache)
   * @param {number} weekNumber
   * @param {number} year
   */
  const loadMealPlan = useCallback(async (weekNumber, year) => {
    if (!household) return;

    setLoading(true);

    try {
      const planId = getMealPlanId(weekNumber, year, household.id);
      const planRef = doc(db, 'mealPlans', planId);
      const planSnap = await getDoc(planRef);

      const cacheKey = `${year}_W${weekNumber}`;

      if (planSnap.exists()) {
        const data = { id: planSnap.id, ...planSnap.data() };
        setMealPlan(data);

        // Ajouter au cache
        setWeekCache(prev => ({
          ...prev,
          [cacheKey]: data
        }));
      } else {
        // Créer un plan vide
        const { startDate, endDate } = getWeekDates(weekNumber, year);
        const emptyPlan = {
          householdId: household.id,
          weekNumber,
          year,
          startDate,
          endDate,
          meals: {},
          extras: [],
          permanentItems: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        await setDoc(planRef, emptyPlan);
        const newPlan = { id: planId, ...emptyPlan };
        setMealPlan(newPlan);

        // Ajouter au cache
        setWeekCache(prev => ({
          ...prev,
          [cacheKey]: newPlan
        }));
      }
    } catch (error) {
      console.error('Error loading meal plan:', error);
    } finally {
      setLoading(false);
    }
  }, [household]);

  /**
   * Met à jour un créneau de repas
   * @param {string} slotId - Ex: "monday_lunch"
   * @param {Object} mealData - Données du repas
   */
  const updateMealSlot = async (slotId, mealData) => {
    if (!mealPlan) return;

    try {
      const planRef = doc(db, 'mealPlans', mealPlan.id);

      const updatedMeals = { ...mealPlan.meals };

      if (mealData) {
        // Ajouter ou mettre à jour le meal
        updatedMeals[slotId] = mealData;
      } else {
        // Supprimer le meal
        delete updatedMeals[slotId];
      }

      await updateDoc(planRef, {
        meals: updatedMeals,
        updatedAt: new Date().toISOString(),
      });

      const updatedPlan = {
        ...mealPlan,
        meals: updatedMeals,
        updatedAt: new Date().toISOString(),
      };

      setMealPlan(updatedPlan);

      // Mettre à jour le cache
      const cacheKey = `${mealPlan.year}_W${mealPlan.weekNumber}`;
      setWeekCache(prev => ({
        ...prev,
        [cacheKey]: updatedPlan
      }));
    } catch (error) {
      console.error('Error updating meal slot:', error);
      throw error;
    }
  };

  /**
   * Met à jour plusieurs créneaux de repas en une seule opération atomique
   * @param {Array} updates - Tableau d'objets { slotId, mealData }
   */
  const updateMultipleMealSlots = async (updates) => {
    if (!mealPlan) return;

    try {
      const planRef = doc(db, 'mealPlans', mealPlan.id);

      const updatedMeals = { ...mealPlan.meals };

      // Appliquer tous les changements à la fois
      updates.forEach(({ slotId, mealData }) => {
        if (mealData) {
          updatedMeals[slotId] = mealData;
        } else {
          delete updatedMeals[slotId];
        }
      });

      // Une seule mise à jour Firestore
      await updateDoc(planRef, {
        meals: updatedMeals,
        updatedAt: new Date().toISOString(),
      });

      const updatedPlan = {
        ...mealPlan,
        meals: updatedMeals,
        updatedAt: new Date().toISOString(),
      };

      setMealPlan(updatedPlan);

      // Mettre à jour le cache
      const cacheKey = `${mealPlan.year}_W${mealPlan.weekNumber}`;
      setWeekCache(prev => ({
        ...prev,
        [cacheKey]: updatedPlan
      }));
    } catch (error) {
      console.error('Error updating multiple meal slots:', error);
      throw error;
    }
  };

  /**
   * Ajoute un extra à la semaine
   * @param {Object} extraData - Données de l'extra
   */
  const addExtra = async (extraData) => {
    if (!mealPlan) return;

    try {
      const planRef = doc(db, 'mealPlans', mealPlan.id);

      const newExtra = {
        id: `extra_${Date.now()}`,
        ...extraData,
        createdAt: new Date().toISOString(),
      };

      const updatedExtras = [...mealPlan.extras, newExtra];

      await updateDoc(planRef, {
        extras: updatedExtras,
        updatedAt: new Date().toISOString(),
      });

      const updatedPlan = {
        ...mealPlan,
        extras: updatedExtras,
        updatedAt: new Date().toISOString(),
      };

      setMealPlan(updatedPlan);

      // Mettre à jour le cache
      const cacheKey = `${mealPlan.year}_W${mealPlan.weekNumber}`;
      setWeekCache(prev => ({
        ...prev,
        [cacheKey]: updatedPlan
      }));
    } catch (error) {
      console.error('Error adding extra:', error);
      throw error;
    }
  };

  /**
   * Supprime un extra de la semaine
   * @param {string} extraId - ID de l'extra à supprimer
   */
  const deleteExtra = async (extraId) => {
    if (!mealPlan) return;

    try {
      const planRef = doc(db, 'mealPlans', mealPlan.id);

      const updatedExtras = mealPlan.extras.filter(extra => extra.id !== extraId);

      await updateDoc(planRef, {
        extras: updatedExtras,
        updatedAt: new Date().toISOString(),
      });

      const updatedPlan = {
        ...mealPlan,
        extras: updatedExtras,
        updatedAt: new Date().toISOString(),
      };

      setMealPlan(updatedPlan);

      // Mettre à jour le cache
      const cacheKey = `${mealPlan.year}_W${mealPlan.weekNumber}`;
      setWeekCache(prev => ({
        ...prev,
        [cacheKey]: updatedPlan
      }));
    } catch (error) {
      console.error('Error deleting extra:', error);
      throw error;
    }
  };

  /**
   * Ajoute un item permanent à la liste de courses
   * @param {Object} itemData - Données de l'item { name, category, quantity, unit }
   */
  const addPermanentItem = async (itemData) => {
    if (!mealPlan) return;

    try {
      const planRef = doc(db, 'mealPlans', mealPlan.id);

      const newItem = {
        id: `permanent_${Date.now()}`,
        ...itemData,
        createdAt: new Date().toISOString(),
      };

      const updatedPermanentItems = [...(mealPlan.permanentItems || []), newItem];

      await updateDoc(planRef, {
        permanentItems: updatedPermanentItems,
        updatedAt: new Date().toISOString(),
      });

      const updatedPlan = {
        ...mealPlan,
        permanentItems: updatedPermanentItems,
        updatedAt: new Date().toISOString(),
      };

      setMealPlan(updatedPlan);

      // Mettre à jour le cache
      const cacheKey = `${mealPlan.year}_W${mealPlan.weekNumber}`;
      setWeekCache(prev => ({
        ...prev,
        [cacheKey]: updatedPlan
      }));
    } catch (error) {
      console.error('Error adding permanent item:', error);
      throw error;
    }
  };

  /**
   * Supprime un item permanent de la liste de courses
   * @param {string} itemId - ID de l'item à supprimer
   */
  const deletePermanentItem = async (itemId) => {
    if (!mealPlan) return;

    try {
      const planRef = doc(db, 'mealPlans', mealPlan.id);

      const updatedPermanentItems = (mealPlan.permanentItems || []).filter(item => item.id !== itemId);

      await updateDoc(planRef, {
        permanentItems: updatedPermanentItems,
        updatedAt: new Date().toISOString(),
      });

      const updatedPlan = {
        ...mealPlan,
        permanentItems: updatedPermanentItems,
        updatedAt: new Date().toISOString(),
      };

      setMealPlan(updatedPlan);

      // Mettre à jour le cache
      const cacheKey = `${mealPlan.year}_W${mealPlan.weekNumber}`;
      setWeekCache(prev => ({
        ...prev,
        [cacheKey]: updatedPlan
      }));
    } catch (error) {
      console.error('Error deleting permanent item:', error);
      throw error;
    }
  };

  /**
   * Sauvegarde le plan actuel comme modèle
   * @param {string} name - Nom du modèle
   * @param {string} description - Description du modèle
   */
  const createTemplate = async (name, description) => {
    if (!mealPlan || !household) return;

    try {
      const templateRef = doc(collection(db, 'mealPlanTemplates'));

      const templateData = {
        householdId: household.id,
        name,
        description,
        meals: mealPlan.meals,
        extras: mealPlan.extras,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await setDoc(templateRef, templateData);

      return { id: templateRef.id, ...templateData };
    } catch (error) {
      console.error('Error creating template:', error);
      throw error;
    }
  };

  /**
   * Récupère tous les modèles du household
   * @returns {Array} Liste des modèles
   */
  const getTemplates = async () => {
    if (!household) return [];

    try {
      const q = query(
        collection(db, 'mealPlanTemplates'),
        where('householdId', '==', household.id),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const templates = [];

      querySnapshot.forEach((doc) => {
        templates.push({ id: doc.id, ...doc.data() });
      });

      return templates;
    } catch (error) {
      console.error('Error getting templates:', error);
      return [];
    }
  };

  /**
   * Applique un modèle au plan actuel
   * @param {string} templateId - ID du modèle à appliquer
   */
  const applyTemplate = async (templateId) => {
    if (!mealPlan) return;

    try {
      const templateRef = doc(db, 'mealPlanTemplates', templateId);
      const templateSnap = await getDoc(templateRef);

      if (!templateSnap.exists()) {
        throw new Error('Template not found');
      }

      const template = templateSnap.data();

      const planRef = doc(db, 'mealPlans', mealPlan.id);

      await updateDoc(planRef, {
        meals: template.meals,
        extras: template.extras,
        updatedAt: new Date().toISOString(),
      });

      const updatedPlan = {
        ...mealPlan,
        meals: template.meals,
        extras: template.extras,
        updatedAt: new Date().toISOString(),
      };

      setMealPlan(updatedPlan);

      // Mettre à jour le cache
      const cacheKey = `${mealPlan.year}_W${mealPlan.weekNumber}`;
      setWeekCache(prev => ({
        ...prev,
        [cacheKey]: updatedPlan
      }));
    } catch (error) {
      console.error('Error applying template:', error);
      throw error;
    }
  };

  /**
   * Supprime un modèle
   * @param {string} templateId - ID du modèle à supprimer
   */
  const deleteTemplate = async (templateId) => {
    try {
      await deleteDoc(doc(db, 'mealPlanTemplates', templateId));
    } catch (error) {
      console.error('Error deleting template:', error);
      throw error;
    }
  };

  /**
   * Nettoie le cache (garde seulement les 3 dernières entrées)
   */
  const cleanCache = () => {
    const cacheEntries = Object.entries(weekCache);
    if (cacheEntries.length > 3) {
      // Garder seulement les 3 plus récentes
      const sorted = cacheEntries.sort((a, b) => {
        const dateA = new Date(a[1].updatedAt);
        const dateB = new Date(b[1].updatedAt);
        return dateB - dateA;
      });

      const newCache = Object.fromEntries(sorted.slice(0, 3));
      setWeekCache(newCache);
    }
  };

  // Nettoyer le cache périodiquement
  useEffect(() => {
    const interval = setInterval(cleanCache, 5 * 60 * 1000); // Toutes les 5 minutes
    return () => clearInterval(interval);
  }, [weekCache]);

  const value = {
    mealPlan,
    loading,
    loadMealPlan,
    updateMealSlot,
    updateMultipleMealSlots,
    addExtra,
    deleteExtra,
    addPermanentItem,
    deletePermanentItem,
    createTemplate,
    getTemplates,
    applyTemplate,
    deleteTemplate,
  };

  return (
    <MealPlanContext.Provider value={value}>
      {children}
    </MealPlanContext.Provider>
  );
};
