import { useState, useEffect } from 'react';
import { useRecipes } from '../contexts/RecipeContext';
import { getRecipeTypeById, RECIPE_TYPES } from '../utils/recipeTypes';
import { useScrollRestoration, useUrlPersistedState } from '../hooks/useScrollRestoration';
import styles from './Recipes.module.css';

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
    viewMode: 'grid'
  }, {
    serializeToUrl,
    deserializeFromUrl
  });

  const [searchTerm, setSearchTerm] = useState(persistedFilters.searchTerm);
  const [searchMode, setSearchMode] = useState(persistedFilters.searchMode);
  const [selectedType, setSelectedType] = useState(persistedFilters.selectedType);
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
      viewMode
    });
  }, [searchTerm, searchMode, selectedType, viewMode, setPersistedFilters]);

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

  const clearAllFilters = () => {
    setSearchTerm('');
    setSelectedType('all');
  };

  const hasActiveFilters = searchTerm !== '' || selectedType !== 'all';

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
          + Nouvelle recette
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
              📝 Nom
            </button>
            <button
              onClick={() => setSearchMode('ingredient')}
              className={`${styles.searchModeButton} ${searchMode === 'ingredient' ? styles.activeModeButton : ''}`}
              title="Rechercher par ingrédient"
            >
              🥬 Ingrédient
            </button>
          </div>

          <div className={styles.searchInputWrapper}>
            <span className={styles.searchIcon}>🔍</span>
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
                ✕
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

          <div className={styles.rightControls}>
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className={styles.clearFiltersButton}
                title="Réinitialiser les filtres"
              >
                🔄 Réinitialiser
              </button>
            )}

            <div className={styles.viewToggle}>
              <button
                onClick={() => setViewMode('grid')}
                className={`${styles.viewButton} ${viewMode === 'grid' ? styles.activeView : ''}`}
                title="Vue grille"
              >
                ⊞
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`${styles.viewButton} ${viewMode === 'list' ? styles.activeView : ''}`}
                title="Vue liste"
              >
                ☰
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
                  <div
                    className={styles.recipeListImage}
                    style={{
                      backgroundImage: recipe.imageUrl
                        ? `url(${recipe.imageUrl})`
                        : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                    }}
                  >
                    {!recipe.imageUrl && (
                      <div className={styles.placeholderIconSmall}>🍳</div>
                    )}
                  </div>

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
                        👥 {recipe.servings} pers.
                      </span>
                      <span className={styles.recipeListIngredientCount}>
                        📦 {recipe.ingredients?.length || 0} ingrédient{(recipe.ingredients?.length || 0) > 1 ? 's' : ''}
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
                      <span className={styles.recipeTypeLabel}>{recipeType.label}</span>
                    </div>
                  )}

                  <div className={styles.recipeOverlay}>
                    <div className={styles.recipeContent}>
                      <h3 className={styles.recipeName}>{recipe.name}</h3>
                      <div className={styles.recipeMetaInfo}>
                        <span className={styles.servings}>
                          <span className={styles.metaIcon}>👥</span>
                          {recipe.servings} pers.
                        </span>
                      </div>
                    </div>
                  </div>

                  {!recipe.imageUrl && (
                    <div className={styles.placeholderIcon}>🍳</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Recipes;
