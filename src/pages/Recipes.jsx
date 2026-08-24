import { useState, useEffect, useMemo } from 'react';
import { useRecipes } from '../contexts/RecipeContext';
import { useHousehold } from '../contexts/HouseholdContext';
import { RECIPE_TYPES, getRecipeTypeById } from '../utils/recipeTypes';
import { RECIPE_TAGS, getTagsByIds } from '../utils/recipeTags';
import { useScrollRestoration, useUrlPersistedState } from '../hooks/useScrollRestoration';
import { BookOpen, SearchX, Plus, LayoutGrid, List, RotateCcw, Users, Package } from 'lucide-react';
import OptimizedImage from '../components/OptimizedImage';
import RecipeCard from '../components/RecipeCard';
import {
  Page,
  PageHeader,
  Button,
  SearchField,
  Chip,
  TagBadge,
  EmptyState,
  RecipeCardSkeleton
} from '../components/ui';
import styles from './Recipes.module.css';

const SEARCH_MODES = [
  { value: 'name', label: 'Nom' },
  { value: 'ingredient', label: 'Ingrédient' }
];

const Recipes = ({ onSelectRecipe, onCreateRecipe }) => {
  const { recipes, loading } = useRecipes();
  const { household } = useHousehold();

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

    return {
      searchTerm: params.get('search') || '',
      searchMode: params.get('mode') || 'name',
      selectedType: params.get('type') || 'all',
      viewMode: viewParam === 'list' ? 'list' : 'grid'
    };
  };

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
  const [viewMode, setViewMode] = useState(
    persistedFilters.viewMode === 'list' ? 'list' : 'grid'
  );

  useScrollRestoration('recipes', [loading, recipes.length]);

  useEffect(() => {
    setPersistedFilters({ searchTerm, searchMode, selectedType, selectedTags, viewMode });
  }, [searchTerm, searchMode, selectedType, selectedTags, viewMode, setPersistedFilters]);

  const countByType = useMemo(() => {
    const counts = {};
    recipes.forEach((recipe) => {
      const type = recipe.type || 'plat';
      counts[type] = (counts[type] || 0) + 1;
    });
    return counts;
  }, [recipes]);

  const countByTag = useMemo(() => {
    const counts = {};
    recipes.forEach((recipe) => {
      recipe.tags?.forEach((tag) => {
        counts[tag] = (counts[tag] || 0) + 1;
      });
    });
    return counts;
  }, [recipes]);

  const filteredRecipes = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    return recipes.filter((recipe) => {
      const matchesType = selectedType === 'all' || (recipe.type || 'plat') === selectedType;
      const matchesTags =
        selectedTags.length === 0 || selectedTags.every((tag) => recipe.tags?.includes(tag));

      if (!search) return matchesType && matchesTags;

      const matchesSearch =
        searchMode === 'name'
          ? recipe.name.toLowerCase().includes(search)
          : recipe.ingredients?.some((ing) => ing.name?.toLowerCase().includes(search)) || false;

      return matchesSearch && matchesType && matchesTags;
    });
  }, [recipes, searchTerm, searchMode, selectedType, selectedTags]);

  const hasActiveFilters = searchTerm !== '' || selectedType !== 'all' || selectedTags.length > 0;

  const clearAllFilters = () => {
    setSearchTerm('');
    setSelectedType('all');
    setSelectedTags([]);
  };

  const toggleTag = (tagId) =>
    setSelectedTags((current) =>
      current.includes(tagId) ? current.filter((t) => t !== tagId) : [...current, tagId]
    );

  const subtitle = loading
    ? 'Chargement…'
    : `${recipes.length} recette${recipes.length > 1 ? 's' : ''}${household?.name ? ` · ${household.name}` : ''}`;

  return (
    <Page>
      <PageHeader
        title="Mes Recettes"
        subtitle={subtitle}
        actions={
          <>
            <Button
              variant="primary"
              icon={Plus}
              onClick={onCreateRecipe}
              className={styles.newRecipeDesktop}
            >
              Nouvelle recette
            </Button>
            <Button
              variant="primary"
              icon={Plus}
              onClick={onCreateRecipe}
              aria-label="Nouvelle recette"
              className={styles.newRecipeMobile}
            />
          </>
        }
      />

      <div className={styles.filters}>
        <div className={styles.searchRow}>
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
            className={styles.search}
          />

          <div className={styles.viewToggle}>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`${styles.viewButton} ${viewMode === 'grid' ? styles.viewActive : ''}`}
              aria-label="Vue grille"
              aria-pressed={viewMode === 'grid'}
            >
              <LayoutGrid size={18} strokeWidth={2} />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`${styles.viewButton} ${viewMode === 'list' ? styles.viewActive : ''}`}
              aria-label="Vue liste"
              aria-pressed={viewMode === 'list'}
            >
              <List size={18} strokeWidth={2} />
            </button>
          </div>
        </div>

        <div className={`${styles.chipRow} scrollRow`}>
          <Chip
            label="Tous"
            count={recipes.length}
            active={selectedType === 'all'}
            onClick={() => setSelectedType('all')}
          />
          {RECIPE_TYPES.map((type) => {
            const count = countByType[type.id] || 0;
            return (
              <Chip
                key={type.id}
                label={type.label}
                emoji={type.icon}
                tone={type.tone}
                count={count}
                active={selectedType === type.id}
                disabled={count === 0}
                onClick={() => setSelectedType(type.id)}
              />
            );
          })}
        </div>

        <div className={`${styles.chipRow} scrollRow`}>
          {RECIPE_TAGS.filter((tag) => countByTag[tag.id] > 0).map((tag) => (
            <TagBadge
              key={tag.id}
              tag={tag}
              selected={selectedTags.includes(tag.id)}
              onClick={() => toggleTag(tag.id)}
            />
          ))}
        </div>

        {hasActiveFilters && (
          <div className={styles.activeFilters}>
            <span className={styles.resultsCount}>
              {filteredRecipes.length} sur {recipes.length}
            </span>
            {selectedType !== 'all' && (
              <Chip
                label={getRecipeTypeById(selectedType)?.label || selectedType}
                emoji={getRecipeTypeById(selectedType)?.icon}
                tone={getRecipeTypeById(selectedType)?.tone}
                active
                onRemove={() => setSelectedType('all')}
                onClick={() => setSelectedType('all')}
                className={styles.activeChip}
              />
            )}
            {getTagsByIds(selectedTags).map((tag) => (
              <TagBadge key={tag.id} tag={tag} selected onRemove={() => toggleTag(tag.id)} />
            ))}
            <Button variant="ghost" size="sm" icon={RotateCcw} onClick={clearAllFilters}>
              Réinitialiser
            </Button>
          </div>
        )}
      </div>

      {loading ? (
        <div className={styles.grid}>
          {Array.from({ length: 8 }, (_, i) => (
            <RecipeCardSkeleton key={i} />
          ))}
        </div>
      ) : recipes.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="Aucune recette pour l'instant"
          description="Ajoutez votre première recette : elle alimentera ensuite votre planning et votre liste de courses."
          action={
            <Button variant="primary" size="lg" icon={Plus} fullWidth onClick={onCreateRecipe}>
              Nouvelle recette
            </Button>
          }
        />
      ) : filteredRecipes.length === 0 ? (
        <EmptyState
          size="sm"
          dashed={false}
          icon={SearchX}
          title="Aucun résultat"
          description={
            searchTerm
              ? `Aucune recette ne contient « ${searchTerm} » avec ces filtres.`
              : 'Aucune recette ne correspond à ces filtres.'
          }
          action={
            <Button variant="secondary" onClick={clearAllFilters}>
              Réinitialiser les filtres
            </Button>
          }
        />
      ) : viewMode === 'grid' ? (
        <div className={styles.grid}>
          {filteredRecipes.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} onClick={onSelectRecipe} />
          ))}
        </div>
      ) : (
        <div className={styles.list}>
          {filteredRecipes.map((recipe) => {
            const type = getRecipeTypeById(recipe.type || 'plat');
            return (
              <button
                key={recipe.id}
                type="button"
                className={styles.listItem}
                onClick={() => onSelectRecipe(recipe.id)}
              >
                <OptimizedImage
                  src={recipe.imageUrl}
                  alt=""
                  asBackground
                  caption=""
                  className={styles.listMedia}
                />
                <span className={styles.listBody}>
                  <span className={styles.listName}>{recipe.name}</span>
                  <span className={styles.listMeta}>
                    {type && (
                      <span className={styles.listMetaItem}>
                        {type.icon} {type.label}
                      </span>
                    )}
                    <span className={styles.listMetaItem}>
                      <Users size={13} strokeWidth={2} />
                      {recipe.servings} pers.
                    </span>
                    <span className={styles.listMetaItem}>
                      <Package size={13} strokeWidth={2} />
                      {recipe.ingredients?.length || 0} ingr.
                    </span>
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      )}
    </Page>
  );
};

export default Recipes;
