import { useState, useEffect } from 'react';
import { useMealPlan } from '../contexts/MealPlanContext';
import { useUrlPersistedState } from '../hooks/useScrollRestoration';
import {
  getCurrentWeek,
  getWeekLabel,
  navigateWeek,
  getWeekDays,
  getMealSlotId
} from '../utils/weekHelpers';
import MealSlot from '../components/MealSlot';
import RecipePicker from '../components/RecipePicker';
import RecipeDetail from './RecipeDetail';
import TemplatesModal from '../components/TemplatesModal';
import styles from './Planning.module.css';

const Planning = () => {
  const { mealPlan, loading, loadMealPlan, updateMealSlot, updateMultipleMealSlots, addExtra, deleteExtra } = useMealPlan();

  // État de la semaine courante avec synchronisation URL
  const serializeToUrl = (state) => {
    const params = new URLSearchParams(window.location.search);
    params.set('week', state.weekNumber);
    params.set('year', state.year);
    if (state.viewMode !== 'grid') params.set('planView', state.viewMode);
    else params.delete('planView');

    const newUrl = `${window.location.pathname}?${params}`;
    window.history.replaceState({}, '', newUrl);
  };

  const deserializeFromUrl = () => {
    const params = new URLSearchParams(window.location.search);
    const current = getCurrentWeek();
    return {
      weekNumber: parseInt(params.get('week')) || current.weekNumber,
      year: parseInt(params.get('year')) || current.year,
      viewMode: params.get('planView') || 'grid',
    };
  };

  const [weekState, setWeekState] = useUrlPersistedState('planningWeek', {
    weekNumber: getCurrentWeek().weekNumber,
    year: getCurrentWeek().year,
    viewMode: 'grid',
  }, {
    serializeToUrl,
    deserializeFromUrl
  });

  const [viewMode, setViewMode] = useState(weekState.viewMode);

  // État du RecipePicker
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerSlotId, setPickerSlotId] = useState(null);
  const [pickerSlotType, setPickerSlotType] = useState(null);

  // État du RecipePicker pour extras
  const [extraPickerOpen, setExtraPickerOpen] = useState(false);

  // État du RecipeDetail sidepanel
  const [selectedRecipeId, setSelectedRecipeId] = useState(null);

  // État du modal Templates
  const [templatesModalOpen, setTemplatesModalOpen] = useState(false);

  // État pour le drag and drop
  const [draggingSlotId, setDraggingSlotId] = useState(null);

  // Charger le meal plan quand la semaine change
  useEffect(() => {
    if (weekState.weekNumber && weekState.year) {
      loadMealPlan(weekState.weekNumber, weekState.year);
    }
  }, [weekState.weekNumber, weekState.year, loadMealPlan]);

  // Navigation entre semaines
  const handleNavigateWeek = (direction) => {
    const newWeek = navigateWeek(weekState.weekNumber, weekState.year, direction);
    setWeekState({
      weekNumber: newWeek.weekNumber,
      year: newWeek.year,
      viewMode: viewMode,
    });
    // Charger explicitement le nouveau meal plan
    loadMealPlan(newWeek.weekNumber, newWeek.year);
  };

  // Changer le mode d'affichage
  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    setWeekState(prev => ({ ...prev, viewMode: mode }));
  };

  // Gestion des meal slots
  const handleAddMeal = (slotId, slotType) => {
    setPickerSlotId(slotId);
    setPickerSlotType(slotType);
    setPickerOpen(true);
  };

  const handleRecipeSelect = async (mealData, selectedSlots) => {
    // Si multi-day, ajouter à tous les slots sélectionnés en une seule opération
    if (selectedSlots.length > 1) {
      const updates = selectedSlots.map((slotId, i) => ({
        slotId,
        mealData: {
          ...mealData,
          multiDayIndex: i + 1,
          multiDayMealIds: selectedSlots
        }
      }));
      await updateMultipleMealSlots(updates);
    } else {
      // Single slot
      await updateMealSlot(selectedSlots[0], mealData);
    }

    setPickerOpen(false);
    setPickerSlotId(null);
    setPickerSlotType(null);
  };

  const handlePickerCancel = () => {
    setPickerOpen(false);
    setPickerSlotId(null);
    setPickerSlotType(null);
  };

  const handleEditMeal = (slotId, mealData) => {
    updateMealSlot(slotId, mealData);
  };

  const handleRemoveMeal = (slotId) => {
    updateMealSlot(slotId, null);
  };

  // Gestion des extras
  const handleAddExtra = () => {
    setExtraPickerOpen(true);
  };

  const handleExtraSelect = async (mealData) => {
    // Pour les extras, on ne se soucie pas des slots multi-day
    const extraData = {
      recipeId: mealData.recipeId,
      recipeName: mealData.recipeName,
      recipeType: mealData.recipeType,
      recipeImageUrl: mealData.recipeImageUrl,
      servings: mealData.servings,
    };

    await addExtra(extraData);
    setExtraPickerOpen(false);
  };

  const handleExtraCancel = () => {
    setExtraPickerOpen(false);
  };

  const handleRemoveExtra = async (extraId) => {
    await deleteExtra(extraId);
  };

  // Gestion du drag and drop
  const handleDragStart = (slotId, meal) => {
    setDraggingSlotId(slotId);
  };

  const handleDragEnd = () => {
    setDraggingSlotId(null);
  };

  const handleDrop = async (sourceSlotId, targetSlotId) => {
    if (!mealPlan) return;

    const sourceMeal = mealPlan.meals[sourceSlotId];
    const targetMeal = mealPlan.meals[targetSlotId];

    // Échanger les repas
    const updates = [];

    if (sourceMeal) {
      updates.push({ slotId: targetSlotId, mealData: sourceMeal });
    } else {
      updates.push({ slotId: targetSlotId, mealData: null });
    }

    if (targetMeal) {
      updates.push({ slotId: sourceSlotId, mealData: targetMeal });
    } else {
      updates.push({ slotId: sourceSlotId, mealData: null });
    }

    await updateMultipleMealSlots(updates);
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Chargement du planning...</div>
      </div>
    );
  }

  if (!mealPlan) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>Erreur lors du chargement du planning</div>
      </div>
    );
  }

  const weekDays = getWeekDays(mealPlan.startDate);
  const weekLabel = getWeekLabel(mealPlan.startDate, mealPlan.endDate);

  // Déterminer si un jour est aujourd'hui
  const isToday = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  // Préparer les jours disponibles pour le multi-day si le picker est ouvert
  const availableDaysForPicker = pickerOpen ? weekDays
    .filter(day => !day.isPast) // Only future days
    .flatMap(day => [
      {
        slotId: getMealSlotId(day.dayKey, 'lunch'),
        dayKey: day.dayKey,
        dayName: day.dayName,
        slotType: 'lunch'
      },
      {
        slotId: getMealSlotId(day.dayKey, 'dinner'),
        dayKey: day.dayKey,
        dayName: day.dayName,
        slotType: 'dinner'
      }
    ])
    .filter(slot => !mealPlan.meals[slot.slotId]) // Only empty slots
    : [];

  return (
    <div className={styles.container}>
      {/* Header avec navigation */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1>Planning des repas</h1>
          <div className={styles.weekNavigation}>
            <button
              onClick={() => handleNavigateWeek(-1)}
              className={styles.navButton}
              title="Semaine précédente"
            >
              ‹
            </button>
            <div className={styles.weekInfo}>
              <div className={styles.weekNumber}>Semaine {mealPlan.weekNumber}</div>
              <div className={styles.weekDates}>📅 {weekLabel}</div>
            </div>
            <button
              onClick={() => handleNavigateWeek(1)}
              className={styles.navButton}
              title="Semaine suivante"
            >
              ›
            </button>
          </div>
        </div>

        <div className={styles.headerRight}>
          {/* Toggle vue grille/liste */}
          <div className={styles.viewToggle}>
            <button
              onClick={() => handleViewModeChange('grid')}
              className={`${styles.viewButton} ${viewMode === 'grid' ? styles.activeView : ''}`}
              title="Vue grille"
            >
              ⊞
            </button>
            <button
              onClick={() => handleViewModeChange('list')}
              className={`${styles.viewButton} ${viewMode === 'list' ? styles.activeView : ''}`}
              title="Vue liste"
            >
              ☰
            </button>
          </div>
        </div>
      </div>

      {/* Vue Grille */}
      {viewMode === 'grid' && (
        <div className={styles.weekGrid}>
          {/* Header des jours */}
          <div className={styles.gridHeader}>
            {/* Cellule vide pour l'alignement avec les labels Midi/Soir */}
            <div></div>
            {weekDays.map(day => (
              <div
                key={day.dayKey}
                className={`${styles.dayHeader} ${isToday(day.date) ? styles.today : ''}`}
              >
                <div className={styles.dayName}>{day.dayName.substring(0, 3)}</div>
                <div className={styles.dayNumber}>{day.dayNumber}</div>
              </div>
            ))}
          </div>

          {/* Ligne des midis */}
          <div className={styles.gridRow}>
            <div className={styles.rowLabel}>🌅 Midi</div>
            {weekDays.map(day => {
              const slotId = getMealSlotId(day.dayKey, 'lunch');
              const meal = mealPlan.meals[slotId];
              return (
                <MealSlot
                  key={slotId}
                  meal={meal}
                  dayName={day.dayName}
                  slotType="lunch"
                  slotId={slotId}
                  isPast={day.isPast}
                  onAdd={() => handleAddMeal(slotId, 'lunch')}
                  onEdit={(updatedMeal) => handleEditMeal(slotId, updatedMeal)}
                  onRemove={() => handleRemoveMeal(slotId)}
                  onViewRecipe={(recipeId) => setSelectedRecipeId(recipeId)}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                  onDrop={handleDrop}
                />
              );
            })}
          </div>

          {/* Ligne des soirs */}
          <div className={styles.gridRow}>
            <div className={styles.rowLabel}>🌙 Soir</div>
            {weekDays.map(day => {
              const slotId = getMealSlotId(day.dayKey, 'dinner');
              const meal = mealPlan.meals[slotId];
              return (
                <MealSlot
                  key={slotId}
                  meal={meal}
                  dayName={day.dayName}
                  slotType="dinner"
                  slotId={slotId}
                  isPast={day.isPast}
                  onAdd={() => handleAddMeal(slotId, 'dinner')}
                  onEdit={(updatedMeal) => handleEditMeal(slotId, updatedMeal)}
                  onRemove={() => handleRemoveMeal(slotId)}
                  onViewRecipe={(recipeId) => setSelectedRecipeId(recipeId)}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                  onDrop={handleDrop}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Vue Liste */}
      {viewMode === 'list' && (
        <div className={styles.weekList}>
          {weekDays.map(day => {
            const lunchSlotId = getMealSlotId(day.dayKey, 'lunch');
            const dinnerSlotId = getMealSlotId(day.dayKey, 'dinner');
            const lunchMeal = mealPlan.meals[lunchSlotId];
            const dinnerMeal = mealPlan.meals[dinnerSlotId];

            return (
              <div
                key={day.dayKey}
                className={`${styles.dayCard} ${isToday(day.date) ? styles.todayCard : ''}`}
              >
                {/* En-tête du jour */}
                <div className={styles.dayCardHeader}>
                  <div className={styles.dayCardDate}>
                    <div className={styles.dayCardName}>{day.dayName}</div>
                    <div className={styles.dayCardNumber}>{day.dayNumber}</div>
                  </div>
                  {isToday(day.date) && (
                    <span className={styles.todayBadge}>Aujourd'hui</span>
                  )}
                </div>

                {/* Repas du jour */}
                <div className={styles.dayCardMeals}>
                  {/* Midi */}
                  <div className={styles.mealRow}>
                    <div className={styles.mealRowLabel}>
                      <span className={styles.mealRowIcon}>🌅</span>
                      <span>Midi</span>
                    </div>
                    <div className={styles.mealRowContent}>
                      <MealSlot
                        meal={lunchMeal}
                        dayName={day.dayName}
                        slotType="lunch"
                        slotId={lunchSlotId}
                        isPast={day.isPast}
                        onAdd={() => handleAddMeal(lunchSlotId, 'lunch')}
                        onEdit={(updatedMeal) => handleEditMeal(lunchSlotId, updatedMeal)}
                        onRemove={() => handleRemoveMeal(lunchSlotId)}
                        onViewRecipe={(recipeId) => setSelectedRecipeId(recipeId)}
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                        onDrop={handleDrop}
                      />
                    </div>
                  </div>

                  {/* Soir */}
                  <div className={styles.mealRow}>
                    <div className={styles.mealRowLabel}>
                      <span className={styles.mealRowIcon}>🌙</span>
                      <span>Soir</span>
                    </div>
                    <div className={styles.mealRowContent}>
                      <MealSlot
                        meal={dinnerMeal}
                        dayName={day.dayName}
                        slotType="dinner"
                        slotId={dinnerSlotId}
                        isPast={day.isPast}
                        onAdd={() => handleAddMeal(dinnerSlotId, 'dinner')}
                        onEdit={(updatedMeal) => handleEditMeal(dinnerSlotId, updatedMeal)}
                        onRemove={() => handleRemoveMeal(dinnerSlotId)}
                        onViewRecipe={(recipeId) => setSelectedRecipeId(recipeId)}
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                        onDrop={handleDrop}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Extras de la semaine */}
      <div className={styles.extrasSection}>
        <div className={styles.extrasHeader}>
          <h3>💡 Extras de la semaine</h3>
          <button className={styles.addExtraButton} onClick={handleAddExtra}>
            + Ajouter un extra
          </button>
        </div>
        {mealPlan.extras.length === 0 ? (
          <p className={styles.noExtras}>Aucun extra pour cette semaine</p>
        ) : (
          <div className={styles.extrasList}>
            {mealPlan.extras.map(extra => (
              <div
                key={extra.id}
                className={styles.extraItem}
                onClick={() => setSelectedRecipeId(extra.recipeId)}
              >
                <span className={styles.extraIcon}>
                  {getRecipeTypeById(extra.recipeType)?.icon || '🍽️'}
                </span>
                <span className={styles.extraName}>{extra.recipeName}</span>
                <span className={styles.extraServings}>👥 {extra.servings}</span>
                <button
                  className={styles.removeExtraButton}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveExtra(extra.id);
                  }}
                  title="Retirer"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Boutons d'action en bas */}
      <div className={styles.footer}>
        <button
          className={styles.actionButton}
          onClick={() => setTemplatesModalOpen(true)}
        >
          📚 Modèles de planning
        </button>
      </div>

      {/* RecipePicker Modal pour meal slots */}
      {pickerOpen && (
        <RecipePicker
          onSelect={handleRecipeSelect}
          onCancel={handlePickerCancel}
          currentSlotId={pickerSlotId}
          availableDays={availableDaysForPicker}
        />
      )}

      {/* RecipePicker Modal pour extras */}
      {extraPickerOpen && (
        <RecipePicker
          onSelect={(mealData) => handleExtraSelect(mealData)}
          onCancel={handleExtraCancel}
          currentSlotId={null}
          availableDays={[]} // Pas de multi-day pour les extras
        />
      )}

      {/* RecipeDetail Sidepanel */}
      {selectedRecipeId && (
        <>
          <div
            className={styles.modalOverlay}
            onClick={() => setSelectedRecipeId(null)}
          />
          <div className={styles.sideModal}>
            <RecipeDetail
              recipeId={selectedRecipeId}
              onClose={() => setSelectedRecipeId(null)}
            />
          </div>
        </>
      )}

      {/* Templates Modal */}
      <TemplatesModal
        isOpen={templatesModalOpen}
        onClose={() => setTemplatesModalOpen(false)}
      />
    </div>
  );
};

// Helper pour obtenir le type de recette (copié depuis recipeTypes)
const getRecipeTypeById = (typeId) => {
  const types = {
    entree: { id: 'entree', label: 'Entrée', icon: '🥗' },
    plat: { id: 'plat', label: 'Plat', icon: '🍝' },
    dessert: { id: 'dessert', label: 'Dessert', icon: '🍰' },
    appetizer: { id: 'appetizer', label: 'Apéritif', icon: '🥂' },
    breakfast: { id: 'breakfast', label: 'Petit-déjeuner', icon: '🥐' },
    snack: { id: 'snack', label: 'Goûter', icon: '🍪' },
  };
  return types[typeId] || types.plat;
};

export default Planning;
