import { useState, useEffect, useMemo } from 'react';
import { useMealPlan } from '../contexts/MealPlanContext';
import { useRecipes } from '../contexts/RecipeContext';
import { useUrlPersistedState } from '../hooks/useScrollRestoration';
import { useMediaQuery } from '../hooks/useMediaQuery';
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
import {
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  List,
  BookMarked,
  Plus,
  X,
  CalendarX
} from 'lucide-react';
import { Page, PageHeader, Button, Skeleton, EmptyState, SidePanel } from '../components/ui';
import styles from './Planning.module.css';

const SLOTS = [
  { type: 'lunch', label: 'Midi' },
  { type: 'dinner', label: 'Soir' }
];

const Planning = () => {
  const {
    mealPlan,
    loading,
    loadMealPlan,
    updateMealSlot,
    updateMultipleMealSlots,
    addExtra,
    deleteExtra
  } = useMealPlan();
  const { deleteRecipe } = useRecipes();
  const isDesktop = useMediaQuery('(min-width: 769px)');

  const serializeToUrl = (state) => {
    const params = new URLSearchParams(window.location.search);
    params.set('week', state.weekNumber);
    params.set('year', state.year);
    if (state.viewMode !== 'grid') params.set('planView', state.viewMode);
    else params.delete('planView');

    window.history.replaceState({}, '', `${window.location.pathname}?${params}`);
  };

  const deserializeFromUrl = () => {
    const params = new URLSearchParams(window.location.search);
    const current = getCurrentWeek();
    return {
      weekNumber: parseInt(params.get('week')) || current.weekNumber,
      year: parseInt(params.get('year')) || current.year,
      viewMode: params.get('planView') || 'grid'
    };
  };

  const [weekState, setWeekState] = useUrlPersistedState('planningWeek', {
    weekNumber: getCurrentWeek().weekNumber,
    year: getCurrentWeek().year,
    viewMode: 'grid'
  }, {
    serializeToUrl,
    deserializeFromUrl
  });

  const [viewMode, setViewMode] = useState(weekState.viewMode);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerSlotId, setPickerSlotId] = useState(null);
  const [extraPickerOpen, setExtraPickerOpen] = useState(false);
  const [selectedRecipeId, setSelectedRecipeId] = useState(null);
  const [templatesModalOpen, setTemplatesModalOpen] = useState(false);

  // La grille 7 × 2 n'a pas de sens sous 769px : la liste s'impose.
  const effectiveView = isDesktop ? viewMode : 'list';

  useEffect(() => {
    if (weekState.weekNumber && weekState.year) {
      loadMealPlan(weekState.weekNumber, weekState.year);
    }
  }, [weekState.weekNumber, weekState.year, loadMealPlan]);

  const handleNavigateWeek = (direction) => {
    const newWeek = navigateWeek(weekState.weekNumber, weekState.year, direction);
    setWeekState({ weekNumber: newWeek.weekNumber, year: newWeek.year, viewMode });
    loadMealPlan(newWeek.weekNumber, newWeek.year);
  };

  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    setWeekState((prev) => ({ ...prev, viewMode: mode }));
  };

  const handleRecipeSelect = async (mealData, selectedSlots) => {
    if (selectedSlots.length > 1) {
      await updateMultipleMealSlots(
        selectedSlots.map((slotId, i) => ({
          slotId,
          mealData: { ...mealData, multiDayIndex: i + 1, multiDayMealIds: selectedSlots }
        }))
      );
    } else {
      await updateMealSlot(selectedSlots[0], mealData);
    }

    setPickerOpen(false);
    setPickerSlotId(null);
  };

  const handleExtraSelect = async (mealData) => {
    await addExtra({
      recipeId: mealData.recipeId,
      recipeName: mealData.recipeName,
      recipeType: mealData.recipeType,
      recipeImageUrl: mealData.recipeImageUrl,
      servings: mealData.servings
    });
    setExtraPickerOpen(false);
  };

  const handleDrop = async (sourceSlotId, targetSlotId) => {
    if (!mealPlan) return;

    const sourceMeal = mealPlan.meals[sourceSlotId];
    const targetMeal = mealPlan.meals[targetSlotId];

    await updateMultipleMealSlots([
      { slotId: targetSlotId, mealData: sourceMeal || null },
      { slotId: sourceSlotId, mealData: targetMeal || null }
    ]);
  };

  const weekDays = useMemo(
    () => (mealPlan ? getWeekDays(mealPlan.startDate) : []),
    [mealPlan]
  );

  const isToday = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  // En vue liste, le jour courant est épinglé en tête, les jours passés en fin.
  const listDays = useMemo(() => {
    const upcoming = weekDays.filter((day) => !day.isPast);
    const past = weekDays.filter((day) => day.isPast);
    return [...upcoming, ...past];
  }, [weekDays]);

  const filledCount = useMemo(
    () => (mealPlan ? Object.values(mealPlan.meals || {}).filter(Boolean).length : 0),
    [mealPlan]
  );

  const availableDaysForPicker = useMemo(() => {
    if (!pickerOpen || !mealPlan) return [];
    return weekDays
      .filter((day) => !day.isPast)
      .flatMap((day) =>
        SLOTS.map((slot) => ({
          slotId: getMealSlotId(day.dayKey, slot.type),
          dayKey: day.dayKey,
          dayName: day.dayName,
          slotType: slot.type
        }))
      )
      .filter((slot) => !mealPlan.meals[slot.slotId]);
  }, [pickerOpen, mealPlan, weekDays]);

  const slotProps = (day, slotType) => {
    const slotId = getMealSlotId(day.dayKey, slotType);
    return {
      key: slotId,
      slotId,
      slotType,
      meal: mealPlan.meals[slotId],
      isPast: day.isPast,
      onAdd: () => {
        setPickerSlotId(slotId);
        setPickerOpen(true);
      },
      onEdit: (updatedMeal) => updateMealSlot(slotId, updatedMeal),
      onRemove: () => updateMealSlot(slotId, null),
      onViewRecipe: setSelectedRecipeId,
      onDrop: handleDrop
    };
  };

  if (loading) {
    return (
      <Page>
        <PageHeader title="Planning des repas" subtitle="Chargement…" />
        <div className={styles.skeletonGrid}>
          {Array.from({ length: 8 }, (_, i) => (
            <Skeleton key={i} variant="block" height={118} />
          ))}
        </div>
      </Page>
    );
  }

  if (!mealPlan) {
    return (
      <Page>
        <PageHeader title="Planning des repas" />
        <EmptyState
          size="sm"
          icon={CalendarX}
          title="Planning indisponible"
          description="Le planning de cette semaine n'a pas pu être chargé. Réessayez dans un instant."
        />
      </Page>
    );
  }

  const weekLabel = getWeekLabel(mealPlan.startDate, mealPlan.endDate);
  const extras = mealPlan.extras || [];

  return (
    <Page>
      <PageHeader
        title="Planning des repas"
        subtitle={`${filledCount} créneau${filledCount > 1 ? 'x' : ''} rempli${filledCount > 1 ? 's' : ''} sur 14${extras.length ? ` · ${extras.length} extra${extras.length > 1 ? 's' : ''}` : ''}`}
      />

      <div className={styles.toolbar}>
        <div className={styles.weekNav}>
          <button
            type="button"
            className={styles.weekButton}
            onClick={() => handleNavigateWeek(-1)}
            aria-label="Semaine précédente"
          >
            <ChevronLeft size={18} strokeWidth={2.2} />
          </button>
          <div className={styles.weekInfo}>
            <div className={styles.weekNumber}>Semaine {mealPlan.weekNumber}</div>
            <div className={styles.weekDates}>{weekLabel}</div>
          </div>
          <button
            type="button"
            className={styles.weekButton}
            onClick={() => handleNavigateWeek(1)}
            aria-label="Semaine suivante"
          >
            <ChevronRight size={18} strokeWidth={2.2} />
          </button>
        </div>

        <div className={styles.toolbarRight}>
          <div className={styles.viewToggle}>
            <button
              type="button"
              onClick={() => handleViewModeChange('grid')}
              className={`${styles.viewButton} ${viewMode === 'grid' ? styles.viewActive : ''}`}
              aria-pressed={viewMode === 'grid'}
            >
              <LayoutGrid size={16} strokeWidth={2.2} />
              Grille
            </button>
            <button
              type="button"
              onClick={() => handleViewModeChange('list')}
              className={`${styles.viewButton} ${viewMode === 'list' ? styles.viewActive : ''}`}
              aria-pressed={viewMode === 'list'}
            >
              <List size={16} strokeWidth={2.2} />
              Liste
            </button>
          </div>

          <Button
            variant="secondary"
            icon={BookMarked}
            onClick={() => setTemplatesModalOpen(true)}
            className={styles.templatesButton}
            aria-label="Modèles de semaine"
          >
            <span className={styles.templatesLabel}>Modèles</span>
          </Button>
        </div>
      </div>

      {effectiveView === 'grid' ? (
        <div className={styles.grid}>
          <div className={styles.gridRow}>
            <div className={styles.rowLabel} />
            {weekDays.map((day) => (
              <div
                key={day.dayKey}
                className={`${styles.dayHeader} ${isToday(day.date) ? styles.dayToday : ''} ${day.isPast ? styles.dayPast : ''}`}
              >
                <div className={styles.dayName}>
                  {day.dayName.substring(0, 3)}
                  {isToday(day.date) && ' · auj.'}
                </div>
                <div className={styles.dayNumber}>{day.dayNumber}</div>
              </div>
            ))}
          </div>

          {SLOTS.map((slot) => (
            <div key={slot.type} className={styles.gridRow}>
              <div className={styles.rowLabel}>{slot.label}</div>
              {weekDays.map((day) => (
                <MealSlot {...slotProps(day, slot.type)} variant="grid" />
              ))}
            </div>
          ))}
        </div>
      ) : (
        <div className={styles.list}>
          {listDays.map((day) => {
            const today = isToday(day.date);
            const filled = SLOTS.filter(
              (slot) => mealPlan.meals[getMealSlotId(day.dayKey, slot.type)]
            ).length;

            return (
              <section
                key={day.dayKey}
                className={`${styles.dayCard} ${today ? styles.dayCardToday : ''} ${day.isPast ? styles.dayCardPast : ''}`}
              >
                <header className={styles.dayCardHead}>
                  <span className={styles.dayCardTitle}>
                    {day.dayName} {day.dayNumber}
                    {today && ' · aujourd’hui'}
                    {day.isPast && ' · passé'}
                  </span>
                  <span className={styles.dayCardCount}>{filled}/2</span>
                </header>

                <div className={styles.dayCardBody}>
                  {SLOTS.map((slot) => (
                    <div key={slot.type} className={styles.mealRow}>
                      <span className={styles.mealRowLabel}>{slot.label}</span>
                      <MealSlot {...slotProps(day, slot.type)} variant="row" />
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}

      <section className={styles.extras}>
        <header className={styles.extrasHead}>
          <h2 className={styles.extrasTitle}>Extras de la semaine</h2>
          <Button variant="secondary" size="sm" icon={Plus} onClick={() => setExtraPickerOpen(true)}>
            Ajouter un extra
          </Button>
        </header>

        {extras.length === 0 ? (
          <p className={styles.extrasEmpty}>
            Aucun extra. Les extras partent directement dans la liste de courses.
          </p>
        ) : (
          <div className={styles.extrasList}>
            {extras.map((extra) => (
              <span key={extra.id} className={styles.extra}>
                <button
                  type="button"
                  className={styles.extraName}
                  onClick={() => setSelectedRecipeId(extra.recipeId)}
                >
                  {extra.recipeName}
                </button>
                <span className={styles.extraServings}>{extra.servings} pers.</span>
                <button
                  type="button"
                  className={styles.extraRemove}
                  onClick={() => deleteExtra(extra.id)}
                  aria-label={`Retirer ${extra.recipeName}`}
                >
                  <X size={14} strokeWidth={2.4} />
                </button>
              </span>
            ))}
          </div>
        )}
      </section>

      {pickerOpen && (
        <RecipePicker
          onSelect={handleRecipeSelect}
          onCancel={() => {
            setPickerOpen(false);
            setPickerSlotId(null);
          }}
          currentSlotId={pickerSlotId}
          availableDays={availableDaysForPicker}
        />
      )}

      {extraPickerOpen && (
        <RecipePicker
          onSelect={handleExtraSelect}
          onCancel={() => setExtraPickerOpen(false)}
          currentSlotId={null}
          availableDays={[]}
        />
      )}

      <SidePanel
        open={!!selectedRecipeId}
        onClose={() => setSelectedRecipeId(null)}
        label="Détail de la recette"
      >
        {selectedRecipeId && (
          <RecipeDetail
            recipeId={selectedRecipeId}
            onClose={() => setSelectedRecipeId(null)}
            onDelete={deleteRecipe}
          />
        )}
      </SidePanel>

      <TemplatesModal isOpen={templatesModalOpen} onClose={() => setTemplatesModalOpen(false)} />
    </Page>
  );
};

export default Planning;
