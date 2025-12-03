import { AuthProvider, useAuth } from './contexts/AuthContext';
import { HouseholdProvider, useHousehold } from './contexts/HouseholdContext';
import { IngredientProvider } from './contexts/IngredientContext';
import { RecipeProvider } from './contexts/RecipeContext';
import { MealPlanProvider } from './contexts/MealPlanContext';
import Login from './pages/Login';
import HouseholdSetup from './pages/HouseholdSetup';
import Home from './pages/Home';

const AppContent = () => {
  const { user, loading: authLoading } = useAuth();
  const { household, loading: householdLoading } = useHousehold();

  if (authLoading || householdLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        color: 'var(--text-primary)'
      }}>
        Chargement...
      </div>
    );
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
    <AuthProvider>
      <HouseholdProvider>
        <IngredientProvider>
          <RecipeProvider>
            <MealPlanProvider>
              <AppContent />
            </MealPlanProvider>
          </RecipeProvider>
        </IngredientProvider>
      </HouseholdProvider>
    </AuthProvider>
  );
}

export default App;
