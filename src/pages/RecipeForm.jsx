import { useState, useEffect } from 'react';
import { useRecipes } from '../contexts/RecipeContext';
import { useIngredients, INGREDIENT_CATEGORIES } from '../contexts/IngredientContext';
import IngredientSelector from '../components/IngredientSelector';
import ImageUpload from '../components/ImageUpload';
import { UNITS } from '../utils/units';
import { RECIPE_TYPES } from '../utils/recipeTypes';
import { loadImageWithCache } from '../services/imageService';
import styles from './RecipeForm.module.css';

const RecipeForm = ({ onCancel, onSuccess, recipeToEdit = null }) => {
  const { addRecipe, updateRecipe } = useRecipes();
  const { ingredients: allIngredients } = useIngredients();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [ingredientImages, setIngredientImages] = useState({});
  const [expandedStep, setExpandedStep] = useState(0); // Track which step is expanded

  const [recipe, setRecipe] = useState(
    recipeToEdit || {
      name: '',
      type: 'plat',
      servings: 4,
      ingredients: [],
      steps: [{ order: 0, instruction: '', ingredientIds: [] }]
    }
  );

  const isEditing = !!recipeToEdit;

  // Load images for selected ingredients
  useEffect(() => {
    const loadImages = async () => {
      const images = {};
      for (const recipeIng of recipe.ingredients) {
        const fullIngredient = allIngredients.find(ing => ing.id === recipeIng.ingredientId);
        if (fullIngredient?.imageUrl) {
          try {
            const cachedUrl = await loadImageWithCache(fullIngredient.imageUrl);
            images[recipeIng.ingredientId] = cachedUrl;
          } catch (error) {
            console.error(`Error loading image for ${fullIngredient.name}:`, error);
          }
        }
      }
      setIngredientImages(images);
    };

    if (recipe.ingredients.length > 0 && allIngredients.length > 0) {
      loadImages();
    }
  }, [recipe.ingredients, allIngredients]);

  const handleAddIngredientToRecipe = (ingredient) => {
    const newIngredient = {
      ingredientId: ingredient.id,
      name: ingredient.name,
      category: ingredient.category,
      imageUrl: ingredient.imageUrl,
      quantity: '',
      unit: 'g' // Default to grams
    };

    setRecipe(prev => ({
      ...prev,
      ingredients: [...prev.ingredients, newIngredient]
    }));
  };

  const handleDeselectIngredient = (selectedIngredient) => {
    const index = recipe.ingredients.findIndex(
      ing => ing.ingredientId === selectedIngredient.ingredientId
    );
    if (index !== -1) {
      handleRemoveIngredient(index);
    }
  };

  const handleUpdateIngredient = (index, field, value) => {
    setRecipe(prev => ({
      ...prev,
      ingredients: prev.ingredients.map((ing, idx) =>
        idx === index ? { ...ing, [field]: value } : ing
      )
    }));
  };

  const handleRemoveIngredient = (index) => {
    const ingredient = recipe.ingredients[index];
    setRecipe(prev => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, idx) => idx !== index),
      steps: prev.steps.map(step => ({
        ...step,
        ingredientIds: step.ingredientIds.filter(id => id !== ingredient.ingredientId)
      }))
    }));
  };

  const handleAddStep = () => {
    setRecipe(prev => ({
      ...prev,
      steps: [...prev.steps, {
        order: prev.steps.length,
        instruction: '',
        ingredientIds: []
      }]
    }));
    // Expand the new step
    setExpandedStep(recipe.steps.length);
  };

  const handleUpdateStep = (index, field, value) => {
    setRecipe(prev => ({
      ...prev,
      steps: prev.steps.map((step, idx) =>
        idx === index ? { ...step, [field]: value } : step
      )
    }));
  };

  const handleRemoveStep = (index) => {
    if (recipe.steps.length === 1) return;
    setRecipe(prev => ({
      ...prev,
      steps: prev.steps.filter((_, idx) => idx !== index).map((step, idx) => ({
        ...step,
        order: idx
      }))
    }));
  };

  const handleImageSelect = (file) => {
    setImageFile(file);
    setRemoveImage(false);
  };

  const handleImageRemove = () => {
    setImageFile(null);
    setRemoveImage(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isEditing) {
        await updateRecipe(recipeToEdit.id, recipe, imageFile, removeImage);
      } else {
        await addRecipe(recipe, imageFile);
      }
      onSuccess();
    } catch (err) {
      setError(isEditing ? 'Erreur lors de la modification de la recette' : 'Erreur lors de la création de la recette');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button onClick={onCancel} className={styles.backButton}>
          ← Retour
        </button>
        <h1>{isEditing ? 'Modifier la recette' : 'Nouvelle recette'}</h1>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.section}>
          <h2>Informations générales</h2>

          <div className={styles.formGroup}>
            <label>Nom de la recette *</label>
            <input
              type="text"
              value={recipe.name}
              onChange={(e) => setRecipe({ ...recipe, name: e.target.value })}
              required
              placeholder="Ex: Lasagnes bolognaise"
            />
          </div>

          <ImageUpload
            currentImage={recipeToEdit?.imageUrl}
            onImageSelect={handleImageSelect}
            onImageRemove={handleImageRemove}
            label="Image du plat"
          />

          <div className={styles.formGroup}>
            <label>Type de plat *</label>
            <select
              value={recipe.type}
              onChange={(e) => setRecipe({ ...recipe, type: e.target.value })}
              required
            >
              {RECIPE_TYPES.map(type => (
                <option key={type.id} value={type.id}>
                  {type.icon} {type.label}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label>Nombre de personnes</label>
            <input
              type="number"
              min="1"
              max="20"
              value={recipe.servings}
              onChange={(e) => setRecipe({ ...recipe, servings: parseInt(e.target.value) })}
              required
            />
          </div>
        </div>

        <div className={styles.section}>
          <h2>Ingrédients ({recipe.ingredients.length})</h2>

          <IngredientSelector
            onSelect={handleAddIngredientToRecipe}
            onDeselect={handleDeselectIngredient}
            selectedIngredients={recipe.ingredients}
          />

          {recipe.ingredients.length > 0 && (
            <div className={styles.ingredientsList}>
              {recipe.ingredients.map((ingredient, index) => {
                const category = INGREDIENT_CATEGORIES.find(c => c.id === ingredient.category);

                return (
                  <div key={index} className={styles.ingredientItem}>
                    <div className={styles.ingredientVisual}>
                      {ingredientImages[ingredient.ingredientId] ? (
                        <img
                          src={ingredientImages[ingredient.ingredientId]}
                          alt={ingredient.name}
                          className={styles.ingredientThumb}
                        />
                      ) : (
                        <div className={styles.ingredientIcon}>{category?.icon || '📦'}</div>
                      )}
                    </div>
                    <div className={styles.ingredientDetails}>
                      <span className={styles.ingredientName}>{ingredient.name}</span>
                      <span className={styles.ingredientCategory}>{category?.label}</span>
                    </div>
                    <div className={styles.ingredientInputs}>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Qté"
                        value={ingredient.quantity}
                        onChange={(e) => handleUpdateIngredient(index, 'quantity', e.target.value)}
                        className={styles.quantityInput}
                      />
                      <select
                        value={ingredient.unit}
                        onChange={(e) => handleUpdateIngredient(index, 'unit', e.target.value)}
                        className={styles.unitInput}
                      >
                        <optgroup label="Poids">
                          {UNITS.filter(u => u.category === 'weight').map(unit => (
                            <option key={unit.id} value={unit.id}>{unit.label}</option>
                          ))}
                        </optgroup>
                        <optgroup label="Volume">
                          {UNITS.filter(u => u.category === 'volume').map(unit => (
                            <option key={unit.id} value={unit.id}>{unit.label}</option>
                          ))}
                        </optgroup>
                        <optgroup label="Pièces">
                          {UNITS.filter(u => u.category === 'piece').map(unit => (
                            <option key={unit.id} value={unit.id}>{unit.label}</option>
                          ))}
                        </optgroup>
                        <optgroup label="Autres">
                          {UNITS.filter(u => u.category === 'other').map(unit => (
                            <option key={unit.id} value={unit.id}>{unit.label}</option>
                          ))}
                        </optgroup>
                      </select>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveIngredient(index)}
                      className={styles.removeButton}
                    >
                      ×
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Étapes de préparation</h2>

          {recipe.steps.map((step, index) => {
            const isExpanded = expandedStep === index;
            const usedIngredients = recipe.ingredients.filter(ing =>
              step.ingredientIds.includes(ing.ingredientId)
            );

            return (
              <div
                key={index}
                className={`${styles.stepAccordion} ${isExpanded ? styles.expanded : styles.collapsed}`}
              >
                <div
                  className={styles.stepAccordionHeader}
                  onClick={() => setExpandedStep(index)}
                >
                  <div className={styles.stepNumber}>{index + 1}</div>
                  <div className={styles.stepHeaderContent}>
                    <h3 className={styles.stepTitle}>Étape {index + 1}</h3>
                    {!isExpanded && step.instruction && (
                      <p className={styles.stepPreview}>
                        {step.instruction.substring(0, 80)}{step.instruction.length > 80 ? '...' : ''}
                      </p>
                    )}
                    {!isExpanded && usedIngredients.length > 0 && (
                      <div className={styles.stepIngredientsBadges}>
                        <span className={styles.ingredientsLabel}>INGRÉDIENTS :</span>
                        {usedIngredients.map((ing, idx) => (
                          <span key={idx} className={styles.ingredientBadge}>
                            {ing.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  {recipe.steps.length > 1 && !isExpanded && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveStep(index);
                      }}
                      className={styles.removeStepButton}
                      title="Supprimer cette étape"
                    >
                      🗑️
                    </button>
                  )}
                </div>

                {isExpanded && (
                  <div className={styles.stepAccordionBody}>
                    <div className={styles.formGroup}>
                      <label>Instructions</label>
                      <textarea
                        value={step.instruction}
                        onChange={(e) => handleUpdateStep(index, 'instruction', e.target.value)}
                        rows={4}
                        placeholder="Décrivez cette étape..."
                        required
                        autoFocus
                      />
                    </div>

                    <div className={styles.stepIngredients}>
                      <label>Ingrédients utilisés dans cette étape</label>
                      <p className={styles.hint}>
                        Sélectionnez les ingrédients nécessaires pour cette étape
                      </p>
                      <div className={styles.ingredientCheckboxes}>
                        {recipe.ingredients.map((ingredient, ingIndex) => {
                          const isUsed = step.ingredientIds.includes(ingredient.ingredientId);

                          return (
                            <label key={ingIndex} className={`${styles.checkbox} ${isUsed ? styles.checked : ''}`}>
                              <input
                                type="checkbox"
                                checked={isUsed}
                                onChange={(e) => {
                                  const newIds = e.target.checked
                                    ? [...step.ingredientIds, ingredient.ingredientId]
                                    : step.ingredientIds.filter(id => id !== ingredient.ingredientId);
                                  handleUpdateStep(index, 'ingredientIds', newIds);
                                }}
                              />
                              {ingredientImages[ingredient.ingredientId] && (
                                <img
                                  src={ingredientImages[ingredient.ingredientId]}
                                  alt={ingredient.name}
                                  className={styles.checkboxThumb}
                                />
                              )}
                              <span>{ingredient.name} {ingredient.quantity} {ingredient.unit}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>

                    {recipe.steps.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveStep(index)}
                        className={styles.deleteStepButton}
                      >
                        🗑️ Supprimer cette étape
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          <button
            type="button"
            onClick={handleAddStep}
            className={styles.addStepButtonBottom}
          >
            + Ajouter une étape
          </button>
        </div>

        <div className={styles.formActions}>
          <button
            type="button"
            onClick={onCancel}
            className={styles.cancelButton}
            disabled={loading}
          >
            Annuler
          </button>
          <button type="submit" disabled={loading}>
            {loading
              ? (isEditing ? 'Modification...' : 'Création...')
              : (isEditing ? 'Enregistrer les modifications' : 'Créer la recette')
            }
          </button>
        </div>
      </form>
    </div>
  );
};

export default RecipeForm;
