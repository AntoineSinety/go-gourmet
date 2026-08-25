import { AuthProvider, useAuth } from './contexts/AuthContext';
import { HouseholdProvider, useHousehold } from './contexts/HouseholdContext';
import { IngredientProvider } from './contexts/IngredientContext';
import { RecipeProvider } from './contexts/RecipeContext';
import { MealPlanProvider } from './contexts/MealPlanContext';
import { PermanentItemsProvider } from './contexts/PermanentItemsContext';
import { ToastProvider } from './contexts/ToastContext';
import AppSplash from './components/AppSplash';
import ErrorBoundary from './components/ErrorBoundary';
import Login from './pages/Login';
import HouseholdSetup from './pages/HouseholdSetup';
import Home from './pages/Home';

const AppContent = () => {
  const { user, loading: authLoading } = useAuth();
  const { household, loading: householdLoading } = useHousehold();

  if (authLoading || householdLoading) {
    return <AppSplash message={authLoading ? 'Connexion…' : 'Chargement de votre foyer…'} />;
  }

  if (!user) {
    return <Login />;
  }

  if (!household) {
    return <HouseholdSetup />;
  }

  return <Home />;
};

function App() {
  return (
    // La barrière englobe les providers : une erreur dans l'un d'eux (données
    // Firestore malformées, champ absent) doit rester rattrapable.
    <ErrorBoundary>
      <ToastProvider>
        <AuthProvider>
          <HouseholdProvider>
            <IngredientProvider>
              <RecipeProvider>
                <MealPlanProvider>
                  <PermanentItemsProvider>
                    <AppContent />
                  </PermanentItemsProvider>
                </MealPlanProvider>
              </RecipeProvider>
            </IngredientProvider>
          </HouseholdProvider>
        </AuthProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}

export default App;
