import { useState, useEffect, useMemo } from 'react';
import { useIngredients } from '../contexts/IngredientContext';
import { loadImageWithCache } from '../services/imageService';
import { X, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import IngredientRow from '../components/IngredientRow';
import { Button, Progress } from '../components/ui';
import styles from './CookingMode.module.css';

/**
 * Mode Cuisson : vue plein écran, sans navigation.
 * Une seule instruction à l'écran, en très grand, et les ingrédients de l'étape.
 */
const CookingMode = ({ recipe, onExit, onGoToPlanning }) => {
  const { ingredients: allIngredients } = useIngredients();
  const [currentStep, setCurrentStep] = useState(0);
  const [finished, setFinished] = useState(false);
  const [ingredientImages, setIngredientImages] = useState({});

  const steps = useMemo(() => recipe.steps || [], [recipe.steps]);
  const totalSteps = steps.length;
  const progress = finished ? totalSteps : currentStep + 1;
  const percent = totalSteps > 0 ? Math.round((progress / totalSteps) * 100) : 0;

  useEffect(() => {
    let cancelled = false;

    const loadIngredientImages = async () => {
      if (!recipe?.ingredients) return;

      const images = {};
      for (const recipeIngredient of recipe.ingredients) {
        const fullIngredient = allIngredients.find(
          (ing) => ing.id === recipeIngredient.ingredientId
        );
        if (fullIngredient?.imageUrl) {
          images[recipeIngredient.ingredientId] = await loadImageWithCache(fullIngredient.imageUrl);
        }
      }

      if (!cancelled) setIngredientImages(images);
    };

    loadIngredientImages();
    return () => {
      cancelled = true;
    };
  }, [recipe, allIngredients]);

  const goNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setFinished(true);
    }
  };

  const goPrevious = () => {
    if (finished) {
      setFinished(false);
      return;
    }
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  const step = steps[currentStep];
  const stepIngredients =
    recipe.ingredients?.filter((ing) => step?.ingredientIds?.includes(ing.ingredientId)) || [];

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <Button variant="secondary" icon={X} onClick={onExit}>
            Quitter
          </Button>
          <div className={styles.recipeInfo}>
            <div className={styles.recipeName}>{recipe.name}</div>
            <div className={styles.recipeMeta}>
              {recipe.servings} pers. · {totalSteps} étape{totalSteps > 1 ? 's' : ''}
            </div>
          </div>
        </div>

        <div className={styles.progressRow}>
          {!finished && (
            <div className={styles.progressLabels}>
              <span className={styles.progressStep}>
                Étape {currentStep + 1} / {totalSteps}
              </span>
              <span className={styles.progressPercent}>{percent} %</span>
            </div>
          )}
          <Progress value={progress} max={totalSteps} tone={finished ? 'success' : 'accent'} />
        </div>
      </header>

      {finished ? (
        <>
          <div className={styles.done}>
            <span className={styles.doneBadge}>
              <Check size={52} strokeWidth={1.9} />
            </span>
            <h1 className={styles.doneTitle}>Recette terminée</h1>
            <p className={styles.doneText}>
              Bon appétit ! {recipe.name} est prêt pour {recipe.servings} personne
              {recipe.servings > 1 ? 's' : ''}.
            </p>
            <div className={styles.doneStats}>
              <span>
                {totalSteps} étape{totalSteps > 1 ? 's' : ''}
              </span>
              <span>·</span>
              <span>
                {recipe.ingredients?.length || 0} ingrédient
                {(recipe.ingredients?.length || 0) > 1 ? 's' : ''}
              </span>
            </div>
          </div>

          <footer className={styles.doneFooter}>
            <Button variant="primary" size="lg" fullWidth onClick={onExit}>
              Revenir à la recette
            </Button>
            {onGoToPlanning && (
              <Button variant="secondary" size="lg" fullWidth onClick={onGoToPlanning}>
                Voir le planning de la semaine
              </Button>
            )}
          </footer>
        </>
      ) : (
        <>
          <div className={styles.body}>
            <div className={styles.stepNumber}>{String(currentStep + 1).padStart(2, '0')}</div>
            <p className={styles.instruction}>{step?.instruction}</p>

            {stepIngredients.length > 0 && (
              <section className={styles.stepIngredients}>
                <h2 className={styles.stepIngredientsTitle}>Pour cette étape</h2>
                <div className={styles.stepIngredientsList}>
                  {stepIngredients.map((ingredient, index) => (
                    <IngredientRow
                      key={`${ingredient.ingredientId || ingredient.name}-${index}`}
                      ingredient={ingredient}
                      imageUrl={ingredientImages[ingredient.ingredientId]}
                      size="lg"
                    />
                  ))}
                </div>
              </section>
            )}
          </div>

          <footer className={styles.footer}>
            <Button
              variant="secondary"
              icon={ChevronLeft}
              className={styles.prevButton}
              onClick={goPrevious}
              disabled={currentStep === 0}
            >
              Précédent
            </Button>
            <Button
              variant="primary"
              iconRight={currentStep === totalSteps - 1 ? Check : ChevronRight}
              className={styles.nextButton}
              onClick={goNext}
            >
              {currentStep === totalSteps - 1 ? 'Terminer' : 'Suivant'}
            </Button>
          </footer>
        </>
      )}
    </div>
  );
};

export default CookingMode;
