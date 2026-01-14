import { useState, useEffect } from 'react';
import { useRecipes } from '../contexts/RecipeContext';
import { getRecipeTypeById, RECIPE_TYPES } from '../utils/recipeTypes';
import { X, BookOpen, Pencil, FileText, Carrot, Search, RotateCcw, Users, Check, Pin, Info, ChefHat, Sunrise, Moon } from 'lucide-react';
import styles from './RecipePicker.module.css';

const RecipePicker = ({
  onSelect,
  onCancel,
  currentSlotId,
  availableDays = [] // Array of { dayKey, dayName, slotType } for multi-day selection
}) => {
  const { recipes, loading } = useRecipes();

  // Mode: 'recipe' ou 'custom'
  const [mode, setMode] = useState('recipe');

  // Filter and search state
  const [searchTerm, setSearchTerm] = useState('');
  const [searchMode, setSearchMode] = useState('name');
  const [selectedType, setSelectedType] = useState('all');

  // Selection state
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [servings, setServings] = useState(2); // Default to 2 people
  const [selectedDays, setSelectedDays] = useState(currentSlotId ? [currentSlotId] : []); // Multi-day selection

  // Custom meal state
  const [customMealName, setCustomMealName] = useState('');
  const [customMealType, setCustomMealType] = useState('plat');

  // Filter recipes
  const filteredRecipes = recipes.filter(recipe => {
    // Filter by type
    const matchesType = selectedType === 'all' || recipe.type === selectedType;

    // Filter by search term
    let matchesSearch = true;
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      if (searchMode === 'name') {
        matchesSearch = recipe.name.toLowerCase().includes(searchLower);
      } else if (searchMode === 'ingredient') {
        matchesSearch = recipe.ingredients?.some(ing =>
          ing.name?.toLowerCase().includes(searchLower)
        ) || false;
      }
    }

    return matchesSearch && matchesType;
  });

  const handleConfirm = () => {
    if (mode === 'recipe' && !selectedRecipe) return;
    if (mode === 'custom' && !customMealName.trim()) return;

    const mealData = mode === 'recipe' ? {
      recipeId: selectedRecipe.id,
      recipeName: selectedRecipe.name,
      recipeType: selectedRecipe.type || 'plat',
      recipeImageUrl: selectedRecipe.imageUrl || null,
      servings: servings,
      isMultiDay: selectedDays.length > 1,
      multiDayMealIds: selectedDays.length > 1 ? selectedDays : null,
      multiDayCount: selectedDays.length > 1 ? selectedDays.length : null,
    } : {
      // Custom meal (no recipeId)
      recipeName: customMealName.trim(),
      recipeType: customMealType,
      recipeImageUrl: null,
      servings: servings,
      isCustom: true,
      isMultiDay: selectedDays.length > 1,
      multiDayMealIds: selectedDays.length > 1 ? selectedDays : null,
      multiDayCount: selectedDays.length > 1 ? selectedDays.length : null,
    };

    onSelect(mealData, selectedDays);
  };

  const toggleDay = (dayId) => {
    setSelectedDays(prev => {
      if (prev.includes(dayId)) {
        // Don't allow deselecting the original slot
        if (dayId === currentSlotId && prev.length === 1) return prev;
        return prev.filter(id => id !== dayId);
      } else {
        return [...prev, dayId];
      }
    });
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setSelectedType('all');
  };

  const hasActiveFilters = searchTerm !== '' || selectedType !== 'all';

  return (
    <div className={styles.overlay} onClick={onCancel}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <h2>{mode === 'recipe' ? 'Sélectionner une recette' : 'Repas personnalisé'}</h2>
          <button onClick={onCancel} className={styles.closeButton} title="Fermer">
            <X size={18} />
          </button>
        </div>

        {/* Mode Toggle */}
        <div className={styles.modeToggle}>
          <button
            onClick={() => setMode('recipe')}
            className={`${styles.modeButton} ${mode === 'recipe' ? styles.activeModeButton : ''}`}
          >
            <BookOpen size={16} style={{ marginRight: '6px' }} />Recettes
          </button>
          <button
            onClick={() => setMode('custom')}
            className={`${styles.modeButton} ${mode === 'custom' ? styles.activeModeButton : ''}`}
          >
            <Pencil size={16} style={{ marginRight: '6px' }} />Repas custom
          </button>
        </div>

        {/* Search and Filters (only in recipe mode) */}
        {mode === 'recipe' && (
        <div className={styles.filterSection}>
          {/* Search Bar with Mode Toggle */}
          <div className={styles.searchContainer}>
            <div className={styles.searchModeToggle}>
              <button
                onClick={() => setSearchMode('name')}
                className={`${styles.searchModeButton} ${searchMode === 'name' ? styles.activeModeButton : ''}`}
                title="Rechercher par nom"
              >
                <FileText size={14} style={{ marginRight: '4px' }} />Nom
              </button>
              <button
                onClick={() => setSearchMode('ingredient')}
                className={`${styles.searchModeButton} ${searchMode === 'ingredient' ? styles.activeModeButton : ''}`}
                title="Rechercher par ingrédient"
              >
                <Carrot size={14} style={{ marginRight: '4px' }} />Ingrédient
              </button>
            </div>

            <div className={styles.searchInputWrapper}>
              <span className={styles.searchIcon}><Search size={18} /></span>
              <input
                type="text"
                placeholder={
                  searchMode === 'name'
                    ? 'Rechercher une recette...'
                    : 'Rechercher par ingrédient...'
                }
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={styles.searchInput}
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className={styles.clearSearchButton}
                  title="Effacer"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Type Filters */}
          <div className={styles.filterControls}>
            <div className={styles.typeFilters}>
              <button
                onClick={() => setSelectedType('all')}
                className={`${styles.typeFilterButton} ${selectedType === 'all' ? styles.active : ''}`}
              >
                Tous
              </button>
              {RECIPE_TYPES.map(type => {
                const count = recipes.filter(r => r.type === type.id).length;
                if (count === 0) return null;
                return (
                  <button
                    key={type.id}
                    onClick={() => setSelectedType(type.id)}
                    className={`${styles.typeFilterButton} ${selectedType === type.id ? styles.active : ''}`}
                  >
                    {type.icon} {type.label}
                  </button>
                );
              })}
            </div>

            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className={styles.clearFiltersButton}
                title="Réinitialiser les filtres"
              >
                <RotateCcw size={16} />
              </button>
            )}
          </div>

          {/* Results count */}
          <div className={styles.resultsInfo}>
            {filteredRecipes.length} recette{filteredRecipes.length > 1 ? 's' : ''}
          </div>
        </div>
        )}

        {/* Scrollable Content */}
        <div className={styles.scrollableContent}>
          {/* Recipe Grid (mode recipe) */}
          {mode === 'recipe' && (
          <div className={styles.recipeGrid}>
          {loading ? (
            <div className={styles.loading}>Chargement...</div>
          ) : filteredRecipes.length === 0 ? (
            <div className={styles.empty}>
              Aucune recette trouvée
            </div>
          ) : (
            filteredRecipes.map(recipe => {
              const recipeType = getRecipeTypeById(recipe.type || 'plat');
              const isSelected = selectedRecipe?.id === recipe.id;

              return (
                <div
                  key={recipe.id}
                  className={`${styles.recipeCard} ${isSelected ? styles.selected : ''}`}
                  onClick={() => setSelectedRecipe(recipe)}
                >
                  <div
                    className={styles.recipeCardInner}
                    style={{
                      backgroundImage: recipe.imageUrl
                        ? `url(${recipe.imageUrl})`
                        : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                    }}
                  >
                    {recipeType && (
                      <div className={styles.recipeTypeBadge}>
                        <span className={styles.recipeTypeIcon}>{recipeType.icon}</span>
                      </div>
                    )}

                    <div className={styles.recipeOverlay}>
                      <h3 className={styles.recipeName}>{recipe.name}</h3>
                      <div className={styles.recipeInfo}>
                        <span><Users size={12} style={{ marginRight: '4px', verticalAlign: 'middle' }} />{recipe.servings} pers.</span>
                      </div>
                    </div>

                    {!recipe.imageUrl && (
                      <div className={styles.placeholderIcon}><ChefHat size={48} /></div>
                    )}

                    {isSelected && (
                      <div className={styles.selectedBadge}><Check size={18} /></div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
          )}

        {/* Custom Meal Form (mode custom) */}
        {mode === 'custom' && (
          <div className={styles.customForm}>
            <div className={styles.customFormField}>
              <label className={styles.customFormLabel}>
                Nom du repas *
              </label>
              <input
                type="text"
                placeholder="Ex: Pizza, Restaurant, Poke Bowl..."
                value={customMealName}
                onChange={(e) => setCustomMealName(e.target.value)}
                className={styles.customFormInput}
                autoFocus
              />
            </div>

            <div className={styles.customFormField}>
              <label className={styles.customFormLabel}>
                Type de repas
              </label>
              <div className={styles.customTypeButtons}>
                {RECIPE_TYPES.map(type => (
                  <button
                    key={type.id}
                    onClick={() => setCustomMealType(type.id)}
                    className={`${styles.customTypeButton} ${customMealType === type.id ? styles.active : ''}`}
                  >
                    {type.icon} {type.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Configuration Section */}
        {(selectedRecipe || (mode === 'custom' && customMealName.trim())) && (
          <div className={styles.configSection}>
            <div className={styles.configHeader}>
              <h3>Configuration</h3>
            </div>

            <div className={styles.configContent}>
              {/* Servings */}
              <div className={styles.configRow}>
                <label className={styles.configLabel}>
                  <Users size={16} style={{ marginRight: '6px', verticalAlign: 'middle' }} />Nombre de personnes :
                </label>
                <div className={styles.servingsControl}>
                  <button
                    onClick={() => setServings(Math.max(1, servings - 1))}
                    className={styles.servingsButton}
                  >
                    −
                  </button>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={servings}
                    onChange={(e) => setServings(Math.max(1, Number(e.target.value)))}
                    className={styles.servingsInput}
                  />
                  <button
                    onClick={() => setServings(Math.min(20, servings + 1))}
                    className={styles.servingsButton}
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Multi-day selection (if available) */}
              {availableDays.length > 1 && (() => {
                // Regrouper les slots par jour
                const dayGroups = availableDays.reduce((acc, slot) => {
                  if (!acc[slot.dayKey]) {
                    acc[slot.dayKey] = { dayName: slot.dayName, lunch: null, dinner: null };
                  }
                  if (slot.slotType === 'lunch') {
                    acc[slot.dayKey].lunch = slot.slotId;
                  } else {
                    acc[slot.dayKey].dinner = slot.slotId;
                  }
                  return acc;
                }, {});

                const days = Object.entries(dayGroups);

                return (
                  <div className={styles.configRow}>
                    <label className={styles.configLabel}>
                      <Pin size={16} style={{ marginRight: '6px', verticalAlign: 'middle' }} />Étaler sur plusieurs jours :
                    </label>
                    <div className={styles.multiDayGrid}>
                      {/* Header avec les noms des jours */}
                      <div className={styles.multiDayHeader}>
                        <div className={styles.multiDayHeaderEmpty}></div>
                        {days.map(([dayKey, dayData]) => (
                          <div key={dayKey} className={styles.multiDayDay}>
                            {dayData.dayName.substring(0, 3)}
                          </div>
                        ))}
                      </div>

                      {/* Ligne Midi */}
                      <div className={styles.multiDayRow}>
                        <div className={styles.multiDayLabel}><Sunrise size={12} style={{ marginRight: '4px' }} />Midi</div>
                        {days.map(([dayKey, dayData]) => (
                          <div key={`${dayKey}-lunch`} className={styles.multiDaySlot}>
                            {dayData.lunch && (
                              <label
                                className={`${styles.multiDayCheckbox} ${selectedDays.includes(dayData.lunch) ? styles.checked : ''}`}
                              >
                                <input
                                  type="checkbox"
                                  checked={selectedDays.includes(dayData.lunch)}
                                  onChange={() => toggleDay(dayData.lunch)}
                                />
                                <span className={styles.checkmark}></span>
                              </label>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Ligne Soir */}
                      <div className={styles.multiDayRow}>
                        <div className={styles.multiDayLabel}><Moon size={12} style={{ marginRight: '4px' }} />Soir</div>
                        {days.map(([dayKey, dayData]) => (
                          <div key={`${dayKey}-dinner`} className={styles.multiDaySlot}>
                            {dayData.dinner && (
                              <label
                                className={`${styles.multiDayCheckbox} ${selectedDays.includes(dayData.dinner) ? styles.checked : ''}`}
                              >
                                <input
                                  type="checkbox"
                                  checked={selectedDays.includes(dayData.dinner)}
                                  onChange={() => toggleDay(dayData.dinner)}
                                />
                                <span className={styles.checkmark}></span>
                              </label>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                    {selectedDays.length > 1 && (
                      <p className={styles.multiDayHint}>
                        <Info size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} />Les quantités ne seront comptées qu'une seule fois dans la liste de courses
                      </p>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        )}
        </div> {/* End scrollableContent */}

        {/* Footer with action buttons */}
        <div className={styles.footer}>
          <button onClick={onCancel} className={styles.cancelButton}>
            Annuler
          </button>
          <button
            onClick={handleConfirm}
            className={styles.confirmButton}
            disabled={mode === 'recipe' ? !selectedRecipe : !customMealName.trim()}
          >
            {selectedDays.length > 1
              ? `Ajouter à ${selectedDays.length} repas`
              : selectedDays.length === 0
              ? 'Ajouter comme extra'
              : 'Ajouter au planning'
            }
          </button>
        </div>
      </div>
    </div>
  );
};

export default RecipePicker;
