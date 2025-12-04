import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useHousehold } from '../contexts/HouseholdContext';
import { useRecipes } from '../contexts/RecipeContext';
import { useUrlPersistedState } from '../hooks/useScrollRestoration';
import Recipes from './Recipes';
import RecipeForm from './RecipeForm';
import RecipeDetail from './RecipeDetail';
import CookingMode from './CookingMode';
import Ingredients from './Ingredients';
import Planning from './Planning';
import ShoppingList from './ShoppingList';
import Settings from './Settings';
import styles from './Home.module.css';

const Home = () => {
  const { user, signOut } = useAuth();
  const { household } = useHousehold();
  const { deleteRecipe } = useRecipes();

  // Fonctions pour synchroniser la navigation avec l'URL
  const serializeToUrl = (nav) => {
    const params = new URLSearchParams();

    // Ajouter la vue courante si ce n'est pas 'recipes' (par défaut)
    if (nav.currentView && nav.currentView !== 'recipes') {
      params.set('view', nav.currentView);
    }

    // Ajouter les autres états si nécessaire
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

  // Récupérer l'état persisté de navigation avec synchronisation URL
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

  // Sauvegarder l'état de navigation quand il change
  useEffect(() => {
    setPersistedNav({
      currentView,
      selectedRecipe,
      cookingRecipe,
      recipeToEdit
    });
  }, [currentView, selectedRecipe, cookingRecipe, recipeToEdit, setPersistedNav]);

  const handleSelectRecipe = (recipeId) => {
    setSelectedRecipe(recipeId);
  };

  const handleCloseRecipeDetail = () => {
    setSelectedRecipe(null);
  };

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

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.logo} onClick={() => setCurrentView('recipes')}>
          <span className={styles.logoIcon}>🍽️</span>
          <span className={styles.logoText}>Go Gourmet</span>
        </div>

        {/* Navigation desktop */}
        <nav className={styles.desktopNav}>
          <button
            onClick={() => setCurrentView('recipes')}
            className={`${styles.navButton} ${currentView === 'recipes' ? styles.active : ''}`}
          >
            <span className={styles.navIcon}>📖</span>
            <span className={styles.navLabel}>Recettes</span>
          </button>
          <button
            onClick={() => setCurrentView('planning')}
            className={`${styles.navButton} ${currentView === 'planning' ? styles.active : ''}`}
          >
            <span className={styles.navIcon}>📅</span>
            <span className={styles.navLabel}>Planning</span>
          </button>
          <button
            onClick={() => setCurrentView('shopping')}
            className={`${styles.navButton} ${currentView === 'shopping' ? styles.active : ''}`}
          >
            <span className={styles.navIcon}>🛒</span>
            <span className={styles.navLabel}>Courses</span>
          </button>
          <button
            onClick={() => setCurrentView('settings')}
            className={`${styles.navButton} ${currentView === 'settings' ? styles.active : ''}`}
          >
            <span className={styles.navIcon}>⚙️</span>
            <span className={styles.navLabel}>Plus</span>
          </button>
        </nav>
      </header>

      {/* Bottom navbar mobile */}
      <nav className={styles.mobileNav}>
        <button
          onClick={() => setCurrentView('recipes')}
          className={`${styles.mobileNavButton} ${currentView === 'recipes' ? styles.mobileActive : ''}`}
        >
          <span className={styles.mobileNavIcon}>📖</span>
          <span className={styles.mobileNavLabel}>Recettes</span>
        </button>
        <button
          onClick={() => setCurrentView('planning')}
          className={`${styles.mobileNavButton} ${currentView === 'planning' ? styles.mobileActive : ''}`}
        >
          <span className={styles.mobileNavIcon}>📅</span>
          <span className={styles.mobileNavLabel}>Planning</span>
        </button>
        <button
          onClick={() => setCurrentView('shopping')}
          className={`${styles.mobileNavButton} ${currentView === 'shopping' ? styles.mobileActive : ''}`}
        >
          <span className={styles.mobileNavIcon}>🛒</span>
          <span className={styles.mobileNavLabel}>Courses</span>
        </button>
        <button
          onClick={() => setCurrentView('settings')}
          className={`${styles.mobileNavButton} ${currentView === 'settings' ? styles.mobileActive : ''}`}
        >
          <span className={styles.mobileNavIcon}>⚙️</span>
          <span className={styles.mobileNavLabel}>Plus</span>
        </button>
      </nav>

      <main className={styles.main}>
        {currentView === 'recipes' && (
          <Recipes
            onSelectRecipe={handleSelectRecipe}
            onCreateRecipe={handleCreateRecipe}
          />
        )}

        {currentView === 'ingredients' && <Ingredients />}

        {currentView === 'planning' && <Planning />}

        {currentView === 'shopping' && <ShoppingList />}

        {currentView === 'settings' && <Settings onNavigate={setCurrentView} />}

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

        {currentView === 'cookingMode' && cookingRecipe && (
          <CookingMode
            recipe={cookingRecipe}
            onExit={handleExitCooking}
          />
        )}
      </main>

      {/* Side Modal for Recipe Detail */}
      {selectedRecipe && (
        <>
          <div
            className={styles.modalOverlay}
            onClick={handleCloseRecipeDetail}
          />
          <div className={styles.sideModal}>
            <RecipeDetail
              recipeId={selectedRecipe}
              onClose={handleCloseRecipeDetail}
              onStartCooking={handleStartCooking}
              onEdit={(recipe) => {
                handleEditRecipe(recipe);
                handleCloseRecipeDetail();
              }}
              onDelete={deleteRecipe}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default Home;
