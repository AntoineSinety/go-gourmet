import { useState, useEffect } from 'react';
import { useRecipes } from '../contexts/RecipeContext';
import { useIngredients, INGREDIENT_CATEGORIES } from '../contexts/IngredientContext';
import { getRecipeTypeById } from '../utils/recipeTypes';
import { loadImageWithCache } from '../services/imageService';
import styles from './RecipeDetail.module.css';

const RecipeDetail = ({ recipeId, onClose, onStartCooking, onEdit }) => {
  const [imageUrl, setImageUrl] = useState(null);
  const { getRecipe } = useRecipes();
  const { ingredients: allIngredients } = useIngredients();
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [ingredientImages, setIngredientImages] = useState({});

  useEffect(() => {
    const loadRecipe = async () => {
      try {
        const data = await getRecipe(recipeId);
        setRecipe(data);

        if (data?.imageUrl) {
          const cachedUrl = await loadImageWithCache(data.imageUrl);
          setImageUrl(cachedUrl);
        }

        // Charger les images des ingrédients
        if (data?.ingredients) {
          const images = {};
          for (const recipeIngredient of data.ingredients) {
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
      } catch (error) {
        console.error('Error loading recipe:', error);
      } finally {
        setLoading(false);
      }
    };

    loadRecipe();
  }, [recipeId, getRecipe, allIngredients]);

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Chargement...</div>
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>Recette introuvable</div>
      </div>
    );
  }

  const recipeType = getRecipeTypeById(recipe.type || 'plat');

  // Grouper les ingrédients par catégorie
  const ingredientsByCategory = INGREDIENT_CATEGORIES.map(category => ({
    ...category,
    ingredients: recipe.ingredients?.filter(ing => ing.category === category.id) || []
  })).filter(cat => cat.ingredients.length > 0);

  return (
    <div className={styles.container}>
      {/* Sticky Close Button */}
      <button onClick={onClose} className={styles.closeButton}>
        Fermer
      </button>

      {/* Header avec image */}
      <div className={styles.heroSection}>
        {imageUrl ? (
          <img src={imageUrl} alt={recipe.name} className={styles.heroImage} />
        ) : (
          <div className={styles.heroPlaceholder}>
            <span className={styles.heroIcon}>🍳</span>
          </div>
        )}
        {recipeType && (
          <div className={styles.typeBadge}>
            <span>{recipeType.icon}</span>
            <span>{recipeType.label}</span>
          </div>
        )}
      </div>

      {/* Title & Meta */}
      <div className={styles.titleSection}>
        <h1 className={styles.title}>{recipe.name}</h1>
        <div className={styles.metaBar}>
          <span>👥 {recipe.servings}</span>
        </div>
      </div>

      {/* Actions */}
      <div className={styles.actionButtons}>
        <button onClick={() => onEdit(recipe)} className={styles.editButton}>
          <span>✏️</span>
          <span>Modifier</span>
        </button>
        <button onClick={() => onStartCooking(recipe)} className={styles.cookButton}>
          👨‍🍳 Cuisiner
        </button>
      </div>

      {/* Ingredients by Category */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Ingrédients</h2>
        {ingredientsByCategory.map(category => (
          <div key={category.id} className={styles.categoryGroup}>
            <h3 className={styles.categoryTitle}>
              <span>{category.icon}</span>
              <span>{category.label}</span>
            </h3>
            <div className={styles.ingredientsList}>
              {category.ingredients.map((ingredient, index) => (
                <div key={index} className={styles.ingredientItem}>
                  {ingredientImages[ingredient.ingredientId] ? (
                    <img
                      src={ingredientImages[ingredient.ingredientId]}
                      alt={ingredient.name}
                      className={styles.ingredientImage}
                    />
                  ) : (
                    <div className={styles.ingredientIconPlaceholder}>
                      {category.icon}
                    </div>
                  )}
                  <span className={styles.ingredientName}>{ingredient.name}</span>
                  <span className={styles.ingredientQuantity}>
                    {ingredient.quantity} {ingredient.unit}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Steps */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Préparation</h2>
        <div className={styles.stepsList}>
          {recipe.steps?.map((step, index) => (
            <div key={index} className={styles.stepItem}>
              <div className={styles.stepNumber}>{index + 1}</div>
              <p className={styles.stepText}>{step.instruction}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RecipeDetail;
