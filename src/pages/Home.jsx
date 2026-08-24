import { useState, useEffect, useMemo } from 'react';
import { useRecipes } from '../contexts/RecipeContext';
import { useMealPlan } from '../contexts/MealPlanContext';
import { usePermanentItems } from '../contexts/PermanentItemsContext';
import { useUrlPersistedState } from '../hooks/useScrollRestoration';
import { buildShoppingList, countRemaining } from '../utils/shoppingList';
import AppNav from '../components/AppNav';
import SidePanel from '../components/ui/SidePanel';
import Recipes from './Recipes';
import RecipeForm from './RecipeForm';
import RecipeDetail from './RecipeDetail';
import CookingMode from './CookingMode';
import Ingredients from './Ingredients';
import Planning from './Planning';
import ShoppingList from './ShoppingList';
import Settings from './Settings';
import MigratePermanentItems from './MigratePermanentItems';
import styles from './Home.module.css';

/** Vues qui occupent tout l'écran, sans navigation ni gouttières. */
const FULLSCREEN_VIEWS = ['cookingMode'];

const Home = () => {
  const { deleteRecipe, recipes } = useRecipes();
  const { mealPlan } = useMealPlan();
  const { permanentItems } = usePermanentItems();

  const serializeToUrl = (nav) => {
    const params = new URLSearchParams();

    if (nav.currentView && nav.currentView !== 'recipes') {
      params.set('view', nav.currentView);
    }

    if (nav.selectedRecipe) {
      params.set('recipe', nav.selectedRecipe);
    }

    const newUrl = params.toString()
      ? `${window.location.pathname}?${params}`
      : window.location.pathname;
    window.history.replaceState({}, '', newUrl);
  };

  const deserializeFromUrl = () => {
    const params = new URLSearchParams(window.location.search);
    return {
      currentView: params.get('view') || 'recipes',
      selectedRecipe: params.get('recipe') || null,
      cookingRecipe: null,
      recipeToEdit: null
    };
  };

  const [persistedNav, setPersistedNav] = useUrlPersistedState('navigation', {
    currentView: 'recipes',
    selectedRecipe: null,
    cookingRecipe: null,
    recipeToEdit: null
  }, {
    serializeToUrl,
    deserializeFromUrl
  });

  const [currentView, setCurrentView] = useState(persistedNav.currentView);
  const [selectedRecipe, setSelectedRecipe] = useState(persistedNav.selectedRecipe);
  const [cookingRecipe, setCookingRecipe] = useState(persistedNav.cookingRecipe);
  const [recipeToEdit, setRecipeToEdit] = useState(persistedNav.recipeToEdit);

  useEffect(() => {
    setPersistedNav({
      currentView,
      selectedRecipe,
      cookingRecipe,
      recipeToEdit
    });
  }, [currentView, selectedRecipe, cookingRecipe, recipeToEdit, setPersistedNav]);

  // Compteur de l'onglet Courses : articles restant à cocher.
  const shoppingCount = useMemo(() => {
    const checkedItems = mealPlan?.checkedItems || {};
    return countRemaining(
      buildShoppingList(mealPlan, recipes, permanentItems, checkedItems),
      checkedItems
    );
  }, [mealPlan, recipes, permanentItems]);

  const handleCreateRecipe = () => {
    setRecipeToEdit(null);
    setCurrentView('createRecipe');
  };

  const handleEditRecipe = (recipe) => {
    setRecipeToEdit(recipe);
    setCurrentView('editRecipe');
  };

  const handleStartCooking = (recipe) => {
    setCookingRecipe(recipe);
    setCurrentView('cookingMode');
    setSelectedRecipe(null);
  };

  const handleExitCooking = () => {
    setCurrentView('recipes');
    setCookingRecipe(null);
  };

  const isFullscreen = FULLSCREEN_VIEWS.includes(currentView);

  // Le Mode Cuisson prend tout l'écran, sans coque ni navigation.
  if (isFullscreen && cookingRecipe) {
    return (
      <CookingMode
        recipe={cookingRecipe}
        onExit={handleExitCooking}
        onGoToPlanning={() => {
          setCookingRecipe(null);
          setCurrentView('planning');
        }}
      />
    );
  }

  // L'onglet actif de la nav : les vues secondaires restent rattachées à leur onglet.
  const activeTab = ['createRecipe', 'editRecipe'].includes(currentView)
    ? 'recipes'
    : ['ingredients', 'migrate'].includes(currentView)
      ? 'settings'
      : currentView;

  return (
    <div className={styles.shell}>
      <AppNav currentView={activeTab} onNavigate={setCurrentView} shoppingCount={shoppingCount} />

      <main className={styles.main}>
        {currentView === 'recipes' && (
          <Recipes onSelectRecipe={setSelectedRecipe} onCreateRecipe={handleCreateRecipe} />
        )}

        {currentView === 'ingredients' && <Ingredients onBack={() => setCurrentView('settings')} />}

        {currentView === 'planning' && <Planning />}

        {currentView === 'shopping' && <ShoppingList />}

        {currentView === 'settings' && <Settings onNavigate={setCurrentView} />}

        {currentView === 'migrate' && <MigratePermanentItems />}

        {currentView === 'createRecipe' && (
          <RecipeForm
            onCancel={() => setCurrentView('recipes')}
            onSuccess={() => setCurrentView('recipes')}
          />
        )}

        {currentView === 'editRecipe' && recipeToEdit && (
          <RecipeForm
            recipeToEdit={recipeToEdit}
            onCancel={() => {
              setCurrentView('recipes');
              setRecipeToEdit(null);
            }}
            onSuccess={() => {
              setCurrentView('recipes');
              setRecipeToEdit(null);
            }}
          />
        )}
      </main>

      <SidePanel
        open={!!selectedRecipe}
        onClose={() => setSelectedRecipe(null)}
        label="Détail de la recette"
      >
        {selectedRecipe && (
          <RecipeDetail
            recipeId={selectedRecipe}
            onClose={() => setSelectedRecipe(null)}
            onStartCooking={handleStartCooking}
            onEdit={(recipe) => {
              handleEditRecipe(recipe);
              setSelectedRecipe(null);
            }}
            onDelete={deleteRecipe}
          />
        )}
      </SidePanel>
    </div>
  );
};

export default Home;
