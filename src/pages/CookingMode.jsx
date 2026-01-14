import { useState, useEffect } from 'react';
import { useIngredients, INGREDIENT_CATEGORIES } from '../contexts/IngredientContext';
import { loadImageWithCache } from '../services/imageService';
import { X, Users, FileText, Check, ChevronLeft, ChevronRight, Package } from 'lucide-react';
import styles from './CookingMode.module.css';

const CookingMode = ({ recipe, onExit }) => {
  const { ingredients: allIngredients } = useIngredients();
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState([]);
  const [ingredientImages, setIngredientImages] = useState({});

  const totalSteps = recipe.steps?.length || 0;
  const progress = totalSteps > 0 ? ((currentStep + 1) / totalSteps) * 100 : 0;

  useEffect(() => {
    const loadIngredientImages = async () => {
      if (recipe?.ingredients) {
        const images = {};
        for (const recipeIngredient of recipe.ingredients) {
          const fullIngredient = allIngredients.find(
            ing => ing.id === recipeIngredient.ingredientId
          );
          if (fullIngredient?.imageUrl) {
            const cachedUrl = await loadImageWithCache(fullIngredient.imageUrl);
            images[recipeIngredient.ingredientId] = cachedUrl;
          }
        }
        setIngredientImages(images);
      }
    };
    loadIngredientImages();
  }, [recipe, allIngredients]);

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCompletedSteps([...completedSteps, currentStep]);
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      setCompletedSteps(completedSteps.filter(s => s !== currentStep - 1));
    }
  };

  const handleStepClick = (index) => {
    setCurrentStep(index);
  };

  const currentStepData = recipe.steps?.[currentStep];
  const stepIngredients = recipe.ingredients?.filter(ing =>
    currentStepData?.ingredientIds?.includes(ing.ingredientId)
  );

  return (
    <div className={styles.container}>
      {/* Sticky Exit Button */}
      <button onClick={onExit} className={styles.exitButton}>
        <X size={18} />
        Quitter
      </button>

      {/* Header */}
      <div className={styles.header}>
        <h1 className={styles.title}>{recipe.name}</h1>
        <div className={styles.meta}>
          <span><Users size={16} style={{ verticalAlign: 'middle', marginRight: '4px' }} />{recipe.servings} pers.</span>
          <span><FileText size={16} style={{ verticalAlign: 'middle', marginRight: '4px' }} />{totalSteps} étapes</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className={styles.progressSection}>
        <div className={styles.progressBar}>
          <div className={styles.progressFill} style={{ width: `${progress}%` }} />
        </div>
        <div className={styles.progressText}>
          Étape {currentStep + 1} / {totalSteps}
        </div>
      </div>

      {/* Current Step */}
      <div className={styles.content}>
        <div className={styles.stepSection}>
          <div className={styles.stepHeader}>
            <div className={styles.stepBadge}>{currentStep + 1}</div>
            <h2 className={styles.stepTitle}>Étape {currentStep + 1}</h2>
          </div>

          <p className={styles.instruction}>
            {currentStepData?.instruction}
          </p>

          {stepIngredients && stepIngredients.length > 0 && (
            <div className={styles.ingredientsSection}>
              <h3 className={styles.ingredientsTitle}>Ingrédients nécessaires</h3>
              <div className={styles.ingredientsList}>
                {stepIngredients.map((ing, idx) => {
                  const category = INGREDIENT_CATEGORIES.find(
                    c => c.id === ing.category
                  );
                  return (
                    <div key={idx} className={styles.ingredientItem}>
                      {ingredientImages[ing.ingredientId] ? (
                        <img
                          src={ingredientImages[ing.ingredientId]}
                          alt={ing.name}
                          className={styles.ingredientImage}
                        />
                      ) : (
                        <div className={styles.ingredientIconPlaceholder}>
                          <Package size={24} />
                        </div>
                      )}
                      <span className={styles.ingredientName}>{ing.name}</span>
                      <span className={styles.ingredientQuantity}>
                        {ing.quantity} {ing.unit}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className={styles.navigation}>
          <button
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className={`${styles.navButton} ${styles.prevButton}`}
          >
            <ChevronLeft size={18} style={{ verticalAlign: 'middle' }} /> Précédent
          </button>
          <button
            onClick={handleNext}
            disabled={currentStep === totalSteps - 1}
            className={`${styles.navButton} ${styles.nextButton}`}
          >
            {currentStep === totalSteps - 1 ? (
              <>Terminer <Check size={18} style={{ verticalAlign: 'middle' }} /></>
            ) : (
              <>Suivant <ChevronRight size={18} style={{ verticalAlign: 'middle' }} /></>
            )}
          </button>
        </div>

        {/* Steps Overview */}
        <div className={styles.stepsOverview}>
          <h3 className={styles.overviewTitle}>Toutes les étapes</h3>
          <div className={styles.stepsList}>
            {recipe.steps?.map((step, index) => (
              <button
                key={index}
                onClick={() => handleStepClick(index)}
                className={`${styles.stepItem} ${
                  index === currentStep ? styles.active : ''
                } ${completedSteps.includes(index) ? styles.completed : ''}`}
              >
                <span className={styles.stepItemNumber}>{index + 1}</span>
                <span className={styles.stepItemText}>
                  {step.instruction.substring(0, 60)}
                  {step.instruction.length > 60 ? '...' : ''}
                </span>
                {completedSteps.includes(index) && (
                  <span className={styles.checkmark}><Check size={18} /></span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CookingMode;
