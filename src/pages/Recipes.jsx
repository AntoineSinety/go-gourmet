import { useState, useEffect } from 'react';
import { useRecipes } from '../contexts/RecipeContext';
import { getRecipeTypeById, RECIPE_TYPES } from '../utils/recipeTypes';
import { getTagsByIds, RECIPE_TAGS } from '../utils/recipeTags';
import { useScrollRestoration, useUrlPersistedState } from '../hooks/useScrollRestoration';
import { Filter, Search, X, RotateCcw, LayoutGrid, List, FileText, Carrot, Users, Package, Plus } from 'lucide-react';
import OptimizedImage from '../components/OptimizedImage';
import styles from './Recipes.module.css';

// Fonction pour obtenir la couleur du badge selon le type de recette
const getTypeBadgeColor = (typeId) => {
  const colors = {
    'entree': '#14b8a6',    // Teal
    'plat': '#f97316',      // Orange
    'dessert': '#ec4899',   // Pink
    'appetizer': '#8b5cf6', // Purple
    'breakfast': '#eab308', // Yellow
    'snack': '#22c55e'      // Green
  };
  return colors[typeId] || '#f97316';
};

const Recipes = ({ onSelectRecipe, onCreateRecipe }) => {
  const { recipes, loading } = useRecipes();

  // Fonctions pour synchroniser avec l'URL
  const serializeToUrl = (filters) => {
    const params = new URLSearchParams();
    if (filters.searchTerm) params.set('search', filters.searchTerm);
    if (filters.searchMode !== 'name') params.set('mode', filters.searchMode);
    if (filters.selectedType !== 'all') params.set('type', filters.selectedType);
    if (filters.viewMode !== 'grid') params.set('view', filters.viewMode);

    const newUrl = params.toString()
      ? `${window.location.pathname}?${params}`
      : window.location.pathname;
    window.history.replaceState({}, '', newUrl);
  };

  const deserializeFromUrl = () => {
    const params = new URLSearchParams(window.location.search);
    const viewParam = params.get('view');
    const viewMode = (viewParam === 'list' || viewParam === 'grid') ? viewParam : 'grid';

    return {
      searchTerm: params.get('search') || '',
      searchMode: params.get('mode') || 'name',
      selectedType: params.get('type') || 'all',
      viewMode: viewMode
    };
  };

  // Persister les filtres avec synchronisation URL
  const [persistedFilters, setPersistedFilters] = useUrlPersistedState('recipesFilters', {
    searchTerm: '',
    searchMode: 'name',
    selectedType: 'all',
    selectedTags: [],
    viewMode: 'grid'
  }, {
    serializeToUrl,
    deserializeFromUrl
  });

  const [searchTerm, setSearchTerm] = useState(persistedFilters.searchTerm);
  const [searchMode, setSearchMode] = useState(persistedFilters.searchMode);
  const [selectedType, setSelectedType] = useState(persistedFilters.selectedType);
  const [selectedTags, setSelectedTags] = useState(persistedFilters.selectedTags || []);
  // Ensure viewMode is always 'grid' or 'list'
  const [viewMode, setViewMode] = useState(
    (persistedFilters.viewMode === 'grid' || persistedFilters.viewMode === 'list')
      ? persistedFilters.viewMode
      : 'grid'
  );

  // Restaurer le scroll pour cette vue
  useScrollRestoration('recipes', [loading, recipes.length]);

  // Sauvegarder les filtres quand ils changent
  useEffect(() => {
    setPersistedFilters({
      searchTerm,
      searchMode,
      selectedType,
      selectedTags,
      viewMode
    });
  }, [searchTerm, searchMode, selectedType, selectedTags, viewMode, setPersistedFilters]);

  const filteredRecipes = recipes.filter(recipe => {
    // Filter by type
    const matchesType = selectedType === 'all' || recipe.type === selectedType;

    // Filter by tags
    const matchesTags = selectedTags.length === 0 ||
      selectedTags.every(tag => recipe.tags?.includes(tag));

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

    return matchesSearch && matchesType && matchesTags;
  });

  const clearAllFilters = () => {
    setSearchTerm('');
    setSelectedType('all');
    setSelectedTags([]);
  };

  const hasActiveFilters = searchTerm !== '' || selectedType !== 'all' || selectedTags.length > 0;

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Chargement des recettes...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Mes Recettes</h1>
        <button onClick={onCreateRecipe} className={styles.addButton}>
          <Plus size={18} strokeWidth={2.5} />
          <span>Nouvelle recette</span>
        </button>
      </div>

      <div className={styles.filterSection}>
        {/* Search Bar with Mode Toggle */}
        <div className={styles.searchContainer}>
          <div className={styles.searchModeToggle}>
            <button
              onClick={() => setSearchMode('name')}
              className={`${styles.searchModeButton} ${searchMode === 'name' ? styles.activeModeButton : ''}`}
              title="Rechercher par nom"
            >
              <FileText size={14} strokeWidth={2} />
              <span>Nom</span>
            </button>
            <button
              onClick={() => setSearchMode('ingredient')}
              className={`${styles.searchModeButton} ${searchMode === 'ingredient' ? styles.activeModeButton : ''}`}
              title="Rechercher par ingrédient"
            >
              <Carrot size={14} strokeWidth={2} />
              <span>Ingrédient</span>
            </button>
          </div>

          <div className={styles.searchInputWrapper}>
            <Search size={18} strokeWidth={2} className={styles.searchIcon} />
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
                <X size={14} strokeWidth={2.5} />
              </button>
            )}
          </div>
        </div>

        {/* Filter Controls Row */}
        <div className={styles.filterControls}>
          <div className={styles.typeFilters}>
            <button
              onClick={() => setSelectedType('all')}
              className={`${styles.typeFilterButton} ${selectedType === 'all' ? styles.active : ''}`}
            >
              Tous ({recipes.length})
            </button>
            {RECIPE_TYPES.filter(type => {
              const count = recipes.filter(r => r.type === type.id).length;
              return count > 0;
            }).map(type => {
              const count = recipes.filter(r => r.type === type.id).length;
              return (
                <button
                  key={type.id}
                  onClick={() => setSelectedType(type.id)}
                  className={`${styles.typeFilterButton} ${selectedType === type.id ? styles.active : ''}`}
                >
                  {type.icon} {type.label} ({count})
                </button>
              );
            })}
          </div>

          {/* Tags Filter */}
          {selectedTags.length > 0 && (
            <div className={styles.selectedTagsContainer}>
              <span className={styles.selectedTagsLabel}>
                <Filter size={14} strokeWidth={2} />
                Tags:
              </span>
              <div className={styles.selectedTagsList}>
                {getTagsByIds(selectedTags).map(tag => {
                  const TagIcon = tag.IconComponent;
                  return (
                    <button
                      key={tag.id}
                      onClick={() => setSelectedTags(selectedTags.filter(t => t !== tag.id))}
                      className={styles.selectedTagChip}
                      style={{
                        backgroundColor: tag.bgColor,
                        borderColor: tag.color,
                        color: tag.color
                      }}
                    >
                      <TagIcon size={12} strokeWidth={2.5} />
                      {tag.label}
                      <span className={styles.removeTagIcon}>×</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className={styles.tagsFilterRow}>
            <div className={styles.tagsFilterButtons}>
              {RECIPE_TAGS.map(tag => {
                const isSelected = selectedTags.includes(tag.id);
                const TagIcon = tag.IconComponent;
                const recipesWithTag = recipes.filter(r => r.tags?.includes(tag.id)).length;

                if (recipesWithTag === 0) return null;

                return (
                  <button
                    key={tag.id}
                    onClick={() => {
                      if (isSelected) {
                        setSelectedTags(selectedTags.filter(t => t !== tag.id));
                      } else {
                        setSelectedTags([...selectedTags, tag.id]);
                      }
                    }}
                    className={`${styles.tagFilterButton} ${isSelected ? styles.tagFilterActive : ''}`}
                    style={{
                      borderColor: isSelected ? tag.color : 'var(--border-color)',
                      backgroundColor: isSelected ? tag.bgColor : 'transparent',
                      color: isSelected ? tag.color : 'var(--text-secondary)'
                    }}
                  >
                    <TagIcon size={14} strokeWidth={2} />
                    {tag.label} ({recipesWithTag})
                  </button>
                );
              })}
            </div>
          </div>

          <div className={styles.rightControls}>
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className={styles.clearFiltersButton}
                title="Réinitialiser les filtres"
              >
                <RotateCcw size={14} strokeWidth={2} />
                <span>Réinitialiser</span>
              </button>
            )}

            <div className={styles.viewToggle}>
              <button
                onClick={() => setViewMode('grid')}
                className={`${styles.viewButton} ${viewMode === 'grid' ? styles.activeView : ''}`}
                title="Vue grille"
              >
                <LayoutGrid size={18} strokeWidth={2} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`${styles.viewButton} ${viewMode === 'list' ? styles.activeView : ''}`}
                title="Vue liste"
              >
                <List size={18} strokeWidth={2} />
              </button>
            </div>
          </div>
        </div>

        {/* Results Info */}
        <div className={styles.resultsInfo}>
          {filteredRecipes.length} recette{filteredRecipes.length > 1 ? 's' : ''} trouvée{filteredRecipes.length > 1 ? 's' : ''}
          {hasActiveFilters && ` (sur ${recipes.length})`}
        </div>
      </div>

      {filteredRecipes.length === 0 ? (
        <div className={styles.empty}>
          {searchTerm || selectedType !== 'all' ? (
            <p>Aucune recette ne correspond à votre recherche</p>
          ) : (
            <>
              <p>Vous n'avez pas encore de recettes</p>
              <button onClick={onCreateRecipe} className={styles.emptyButton}>
                Créer ma première recette
              </button>
            </>
          )}
        </div>
      ) : (
        <div className={viewMode === 'grid' ? styles.recipeGrid : styles.recipeList}>
          {filteredRecipes.map(recipe => {
            const recipeType = getRecipeTypeById(recipe.type || 'plat');

            if (viewMode === 'list') {
              return (
                <div
                  key={recipe.id}
                  className={styles.recipeListItem}
                  onClick={() => onSelectRecipe(recipe.id)}
                >
                  <OptimizedImage
                    src={recipe.imageUrl}
                    className={styles.recipeListImage}
                    asBackground
                    fallbackIcon="🍳"
                  />

                  <div className={styles.recipeListContent}>
                    <div className={styles.recipeListHeader}>
                      <h3 className={styles.recipeListName}>{recipe.name}</h3>
                      {recipeType && (
                        <span className={styles.recipeListType}>
                          {recipeType.icon} {recipeType.label}
                        </span>
                      )}
                    </div>

                    <div className={styles.recipeListMeta}>
                      <span className={styles.recipeListServings}>
                        <Users size={14} strokeWidth={2} />
                        {recipe.servings} pers.
                      </span>
                      <span className={styles.recipeListIngredientCount}>
                        <Package size={14} strokeWidth={2} />
                        {recipe.ingredients?.length || 0} ingrédient{(recipe.ingredients?.length || 0) > 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                </div>
              );
            }

            // Grid view
            return (
              <div
                key={recipe.id}
                className={styles.recipeCard}
                onClick={() => onSelectRecipe(recipe.id)}
              >
                <OptimizedImage
                  src={recipe.imageUrl}
                  className={styles.recipeCardInner}
                  asBackground
                  fallbackIcon="🍳"
                >
                  {recipeType && (
                    <div
                      className={styles.recipeTypeBadge}
                      style={{ backgroundColor: getTypeBadgeColor(recipeType.id) }}
                    >
                      <span className={styles.recipeTypeLabel}>{recipeType.label}</span>
                    </div>
                  )}

                  <div className={styles.recipeOverlay}>
                    <div className={styles.recipeContent}>
                      {recipe.tags && recipe.tags.length > 0 && (
                        <div className={styles.recipeTags}>
                          {getTagsByIds(recipe.tags).slice(0, 2).map(tag => {
                            const TagIcon = tag.IconComponent;
                            return (
                              <span
                                key={tag.id}
                                className={styles.recipeTag}
                                style={{
                                  backgroundColor: tag.color,
                                  boxShadow: `0 2px 8px ${tag.color}40`
                                }}
                              >
                                <TagIcon size={12} strokeWidth={2.5} />
                                {tag.label}
                              </span>
                            );
                          })}
                          {recipe.tags.length > 2 && (
                            <span className={styles.moreTagsIndicator}>+{recipe.tags.length - 2}</span>
                          )}
                        </div>
                      )}
                      <h3 className={styles.recipeName}>{recipe.name}</h3>
                      <div className={styles.recipeMetaInfo}>
                        <span className={styles.servings}>
                          <Users size={14} strokeWidth={2} />
                          {recipe.servings} pers.
                        </span>
                      </div>
                    </div>
                  </div>
                </OptimizedImage>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Recipes;
