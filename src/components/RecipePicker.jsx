import { useState, useMemo } from 'react';
import { useRecipes } from '../contexts/RecipeContext';
import { RECIPE_TYPES, getRecipeTypeById } from '../utils/recipeTypes';
import { getTagsByIds } from '../utils/recipeTags';
import { Check, Pin, SearchX } from 'lucide-react';
import OptimizedImage from './OptimizedImage';
import {
  Modal,
  Button,
  Segmented,
  SearchField,
  Chip,
  Stepper,
  TagBadge,
  EmptyState,
  Field,
  Input
} from './ui';
import styles from './RecipePicker.module.css';

const MODES = [
  { value: 'recipe', label: 'Recette du foyer' },
  { value: 'custom', label: '✏️ Repas libre' }
];

const SEARCH_MODES = [
  { value: 'name', label: 'Nom' },
  { value: 'ingredient', label: 'Ingrédient' }
];

/**
 * Choix d'un repas pour un créneau : modale sur desktop, bottom sheet sur mobile.
 * Deux onglets — une recette du foyer, ou un repas libre saisi à la main —
 * plus l'option d'étaler le plat sur plusieurs créneaux consécutifs.
 */
const RecipePicker = ({ onSelect, onCancel, currentSlotId, availableDays = [] }) => {
  const { recipes, loading } = useRecipes();

  const [mode, setMode] = useState('recipe');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchMode, setSearchMode] = useState('name');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [servings, setServings] = useState(2);
  const [spread, setSpread] = useState(1);
  const [customMealName, setCustomMealName] = useState('');
  const [customMealType, setCustomMealType] = useState('plat');

  // Créneaux consécutifs disponibles à partir de celui qu'on remplit.
  const spreadSlots = useMemo(() => {
    if (!currentSlotId) return [];
    const startIndex = availableDays.findIndex((slot) => slot.slotId === currentSlotId);
    if (startIndex === -1) return [currentSlotId];
    return availableDays.slice(startIndex).map((slot) => slot.slotId);
  }, [availableDays, currentSlotId]);

  const maxSpread = Math.max(1, spreadSlots.length);
  const targetSlots = currentSlotId ? spreadSlots.slice(0, spread) : [];

  const currentSlot = availableDays.find((slot) => slot.slotId === currentSlotId);
  const subtitle = currentSlot
    ? `${currentSlot.dayName} · ${currentSlot.slotType === 'lunch' ? 'Midi' : 'Soir'}`
    : 'Extra de la semaine';

  const filteredRecipes = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    return recipes.filter((recipe) => {
      const matchesType = selectedType === 'all' || (recipe.type || 'plat') === selectedType;
      if (!search) return matchesType;

      const matchesSearch =
        searchMode === 'name'
          ? recipe.name.toLowerCase().includes(search)
          : recipe.ingredients?.some((ing) => ing.name?.toLowerCase().includes(search)) || false;

      return matchesSearch && matchesType;
    });
  }, [recipes, searchTerm, searchMode, selectedType]);

  const countByType = useMemo(() => {
    const counts = {};
    recipes.forEach((recipe) => {
      const type = recipe.type || 'plat';
      counts[type] = (counts[type] || 0) + 1;
    });
    return counts;
  }, [recipes]);

  const canConfirm =
    mode === 'recipe' ? !!selectedRecipe : customMealName.trim().length > 0;

  const handleConfirm = () => {
    if (!canConfirm) return;

    const isMultiDay = targetSlots.length > 1;

    const mealData =
      mode === 'recipe'
        ? {
            recipeId: selectedRecipe.id,
            recipeName: selectedRecipe.name,
            recipeType: selectedRecipe.type || 'plat',
            recipeImageUrl: selectedRecipe.imageUrl || null,
            servings,
            isMultiDay,
            multiDayMealIds: isMultiDay ? targetSlots : null,
            multiDayCount: isMultiDay ? targetSlots.length : null
          }
        : {
            recipeName: customMealName.trim(),
            recipeType: customMealType,
            recipeImageUrl: null,
            servings,
            isCustom: true,
            isMultiDay,
            multiDayMealIds: isMultiDay ? targetSlots : null,
            multiDayCount: isMultiDay ? targetSlots.length : null
          };

    onSelect(mealData, targetSlots);
  };

  return (
    <Modal
      open
      onClose={onCancel}
      title="Choisir un repas"
      subtitle={subtitle}
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onCancel} className={styles.footerCancel}>
            Annuler
          </Button>
          <Button
            variant="primary"
            onClick={handleConfirm}
            disabled={!canConfirm}
            className={styles.footerConfirm}
          >
            Ajouter au planning
          </Button>
        </>
      }
    >
      <div className={styles.body}>
        <Segmented
          options={MODES}
          value={mode}
          onChange={setMode}
          size="md"
          label="Type de repas"
          className={styles.modes}
        />

        {mode === 'recipe' ? (
          <>
            <SearchField
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder={
                searchMode === 'name' ? 'Rechercher une recette…' : 'Rechercher par ingrédient…'
              }
              modes={SEARCH_MODES}
              mode={searchMode}
              onModeChange={setSearchMode}
              modeLabel="Mode de recherche"
            />

            <div className={`${styles.chipRow} scrollRow`}>
              <Chip
                label="Tous"
                count={recipes.length}
                active={selectedType === 'all'}
                onClick={() => setSelectedType('all')}
              />
              {RECIPE_TYPES.filter((type) => countByType[type.id]).map((type) => (
                <Chip
                  key={type.id}
                  label={type.label}
                  emoji={type.icon}
                  tone={type.tone}
                  count={countByType[type.id]}
                  active={selectedType === type.id}
                  onClick={() => setSelectedType(type.id)}
                />
              ))}
            </div>

            {loading ? (
              <p className={styles.status}>Chargement des recettes…</p>
            ) : filteredRecipes.length === 0 ? (
              <EmptyState
                size="sm"
                dashed={false}
                icon={SearchX}
                title="Aucune recette"
                description="Aucune recette ne correspond à cette recherche."
              />
            ) : (
              <ul className={styles.results}>
                {filteredRecipes.map((recipe) => {
                  const type = getRecipeTypeById(recipe.type || 'plat');
                  const tags = getTagsByIds(recipe.tags || []);
                  const isSelected = selectedRecipe?.id === recipe.id;

                  return (
                    <li key={recipe.id}>
                      <button
                        type="button"
                        className={`${styles.result} ${isSelected ? styles.resultSelected : ''}`}
                        onClick={() => {
                          setSelectedRecipe(recipe);
                          setServings(recipe.servings || 2);
                        }}
                        aria-pressed={isSelected}
                      >
                        <OptimizedImage
                          src={recipe.imageUrl}
                          alt=""
                          asBackground
                          caption=""
                          placeholder={<span className={styles.resultEmoji}>{type.icon}</span>}
                          className={styles.resultThumb}
                        />
                        <span className={styles.resultText}>
                          <span className={styles.resultName}>{recipe.name}</span>
                          <span className={styles.resultMeta}>
                            {type.icon} {type.label} · {recipe.servings} pers. ·{' '}
                            {recipe.steps?.length || 0} étapes
                          </span>
                        </span>
                        {tags[0] && <TagBadge tag={tags[0]} size="sm" className={styles.resultTag} />}
                        {isSelected && (
                          <span className={styles.resultCheck}>
                            <Check size={16} strokeWidth={2.6} />
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </>
        ) : (
          <div className={styles.customForm}>
            <Field label="Nom du repas" required htmlFor="custom-meal-name">
              <Input
                id="custom-meal-name"
                value={customMealName}
                onChange={(e) => setCustomMealName(e.target.value)}
                placeholder="Ex. Pizza à emporter"
                autoFocus
              />
            </Field>

            <Field label="Type">
              <div className={`${styles.chipRow} scrollRow`}>
                {RECIPE_TYPES.map((type) => (
                  <Chip
                    key={type.id}
                    label={type.label}
                    emoji={type.icon}
                    tone={type.tone}
                    active={customMealType === type.id}
                    onClick={() => setCustomMealType(type.id)}
                  />
                ))}
              </div>
            </Field>
          </div>
        )}

        <div className={styles.config}>
          <div className={styles.configRow}>
            <div>
              <div className={styles.configLabel}>Portions</div>
              <p className={styles.configHint}>Sert à calculer les quantités des courses.</p>
            </div>
            <Stepper value={servings} onChange={setServings} min={1} max={50} label="Portions" />
          </div>

          {maxSpread > 1 && (
            <div className={styles.configRow}>
              <div>
                <div className={styles.configLabel}>
                  <Pin size={14} strokeWidth={2.2} />
                  Étaler sur plusieurs jours
                </div>
                <p className={styles.configHint}>
                  {spread > 1
                    ? `Le plat occupera ${spread} créneaux consécutifs.`
                    : 'Un seul créneau pour l’instant.'}
                </p>
              </div>
              <Stepper
                value={spread}
                onChange={setSpread}
                min={1}
                max={maxSpread}
                label="Nombre de créneaux"
              />
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default RecipePicker;
