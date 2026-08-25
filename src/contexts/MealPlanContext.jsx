import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { db } from '../services/firebase';
import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  deleteField,
  query,
  where,
  orderBy,
  getDocs,
  onSnapshot,
  FieldPath
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
  const unsubscribeRef = useRef(null);

  // Couper l'écoute au démontage du provider.
  useEffect(() => () => unsubscribeRef.current?.(), []);

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
   * Récupère les permanentItems du plan le plus récent du household
   * @returns {Array} Les permanentItems trouvés ou un tableau vide
   */
  const getLatestPermanentItems = async () => {
    if (!household) return [];

    try {
      // Chercher les plans existants pour ce household, triés par date
      const q = query(
        collection(db, 'mealPlans'),
        where('householdId', '==', household.id),
        orderBy('updatedAt', 'desc')
      );

      const querySnapshot = await getDocs(q);

      // Parcourir les plans pour trouver des permanentItems
      for (const docSnap of querySnapshot.docs) {
        const data = docSnap.data();
        if (data.permanentItems && data.permanentItems.length > 0) {
          return data.permanentItems;
        }
      }

      return [];
    } catch (error) {
      console.error('Error fetching latest permanent items:', error);
      return [];
    }
  };

  /**
   * Charge un meal plan depuis Firestore (ou depuis le cache)
   * @param {number} weekNumber
   * @param {number} year
   */
  const loadMealPlan = useCallback(async (weekNumber, year) => {
    if (!household) return;

    setLoading(true);

    const planId = getMealPlanId(weekNumber, year, household.id);
    const planRef = doc(db, 'mealPlans', planId);
    const cacheKey = `${year}_W${weekNumber}`;

    // On ne suit qu'une semaine à la fois : couper l'écoute précédente.
    unsubscribeRef.current?.();
    unsubscribeRef.current = null;

    try {
      // La semaine peut ne pas exister encore : on l'amorce, en reprenant les
      // articles permanents de la dernière semaine renseignée.
      const planSnap = await getDoc(planRef);

      if (!planSnap.exists()) {
        const { startDate, endDate } = getWeekDates(weekNumber, year);
        const existingPermanentItems = await getLatestPermanentItems();

        await setDoc(planRef, {
          householdId: household.id,
          weekNumber,
          year,
          startDate,
          endDate,
          meals: {},
          extras: [],
          permanentItems: existingPermanentItems,
          checkedItems: {},
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error('Error preparing meal plan:', error);
      setLoading(false);
      return;
    }

    // Écoute en direct : le planning et les articles cochés sont la donnée la
    // plus disputée du foyer — deux personnes cochent en même temps en magasin.
    unsubscribeRef.current = onSnapshot(
      planRef,
      (snap) => {
        if (!snap.exists()) return;
        const data = { id: snap.id, ...snap.data() };
        setMealPlan(data);
        setWeekCache(prev => ({ ...prev, [cacheKey]: data }));
        setLoading(false);
      },
      (error) => {
        console.error('Error listening to meal plan:', error);
        setLoading(false);
      }
    );
  }, [household]);

  /**
   * Met à jour un créneau de repas
   * @param {string} slotId - Ex: "monday_lunch"
   * @param {Object} mealData - Données du repas
   */
  const updateMealSlot = async (slotId, mealData) => {
    await updateMultipleMealSlots([{ slotId, mealData }]);
  };

  /**
   * Écrit les créneaux touchés, et eux seuls.
   *
   * @param {Array} updates - { slotId, mealData } ; mealData null pour vider
   *
   * Réécrire la map `meals` entière depuis l'état local faisait disparaître
   * silencieusement les modifications de l'autre membre du foyer : la dernière
   * écriture gagnait. En ciblant `meals.<slotId>`, Firestore fusionne les
   * écritures concurrentes au lieu de les écraser.
   */
  const updateMultipleMealSlots = async (updates) => {
    if (!mealPlan || !updates.length) return;

    try {
      const planRef = doc(db, 'mealPlans', mealPlan.id);
      const now = new Date().toISOString();

      const fields = [];
      updates.forEach(({ slotId, mealData }) => {
        fields.push(new FieldPath('meals', slotId), mealData ?? deleteField());
      });

      await updateDoc(planRef, ...fields, 'updatedAt', now);

      // Miroir local du même delta.
      const updatedMeals = { ...mealPlan.meals };
      updates.forEach(({ slotId, mealData }) => {
        if (mealData) updatedMeals[slotId] = mealData;
        else delete updatedMeals[slotId];
      });

      const updatedPlan = { ...mealPlan, meals: updatedMeals, updatedAt: now };
      setMealPlan(updatedPlan);

      const cacheKey = `${mealPlan.year}_W${mealPlan.weekNumber}`;
      setWeekCache(prev => ({ ...prev, [cacheKey]: updatedPlan }));
    } catch (error) {
      console.error('Error updating meal slots:', error);
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
   * Met à jour l'état des items cochés dans la liste de courses
   * @param {Object} checkedItems - Objet avec les états cochés {itemKey: true/false}
   */
  /**
   * Coche ou décoche des articles, un par un.
   *
   * @param {Object} changes - { [clé d'article]: true pour cocher, null pour décocher }
   *
   * Même raison que pour les créneaux : deux personnes qui cochent en même
   * temps dans le magasin sont le cas nominal du Mode Course. On n'envoie que
   * les articles touchés.
   *
   * Les clés d'article contiennent espaces, accents et « & » — d'où FieldPath
   * plutôt qu'une chaîne pointée, où un point dans la clé serait pris pour un
   * séparateur.
   */
  const setCheckedItems = async (changes) => {
    const entries = Object.entries(changes);
    if (!mealPlan || !entries.length) return;

    try {
      const planRef = doc(db, 'mealPlans', mealPlan.id);
      const now = new Date().toISOString();

      const fields = [];
      entries.forEach(([key, value]) => {
        fields.push(new FieldPath('checkedItems', key), value ? true : deleteField());
      });

      await updateDoc(planRef, ...fields, 'updatedAt', now);

      const updated = { ...(mealPlan.checkedItems || {}) };
      entries.forEach(([key, value]) => {
        if (value) updated[key] = true;
        else delete updated[key];
      });

      const updatedPlan = { ...mealPlan, checkedItems: updated, updatedAt: now };
      setMealPlan(updatedPlan);

      const cacheKey = `${mealPlan.year}_W${mealPlan.weekNumber}`;
      setWeekCache(prev => ({ ...prev, [cacheKey]: updatedPlan }));
    } catch (error) {
      console.error('Error updating checked items:', error);
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
    setCheckedItems,
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
