import { useState, useEffect, useMemo } from 'react';
import { useRecipes } from '../contexts/RecipeContext';
import { useIngredients, INGREDIENT_CATEGORIES } from '../contexts/IngredientContext';
import { useToast } from '../contexts/ToastContext';
import { X } from 'lucide-react';
import IngredientSelector from '../components/IngredientSelector';
import ImageUpload from '../components/ImageUpload';
import StepEditor from '../components/StepEditor';
import { UNITS } from '../utils/units';
import { RECIPE_TYPES } from '../utils/recipeTypes';
import { RECIPE_TAGS } from '../utils/recipeTags';
import { toneVars } from '../utils/palette';
import { loadImageWithCache } from '../services/imageService';
import { Button, Chip, TagBadge, Field, Input, Stepper, EmojiPill } from '../components/ui';
import styles from './RecipeForm.module.css';

const UNIT_GROUPS = [
  { label: 'Poids', category: 'weight' },
  { label: 'Volume', category: 'volume' },
  { label: 'Pièces', category: 'piece' },
  { label: 'Autres', category: 'other' }
];

/** Les étapes ont besoin d'un identifiant stable pour le glisser-déposer. */
const withStepIds = (steps) =>
  (steps || []).map((step, index) => ({
    ...step,
    id: step.id || `step-${index}-${Math.random().toString(36).slice(2, 8)}`
  }));

const emptyRecipe = () => ({
  name: '',
  type: 'plat',
  servings: 4,
  calories: '',
  protein: '',
  ingredients: [],
  steps: withStepIds([{ order: 0, instruction: '', ingredientIds: [] }]),
  tags: []
});

const getCategory = (id) =>
  INGREDIENT_CATEGORIES.find((c) => c.id === id) ||
  INGREDIENT_CATEGORIES[INGREDIENT_CATEGORIES.length - 1];

const RecipeForm = ({ onCancel, onSuccess, recipeToEdit = null }) => {
  const { addRecipe, updateRecipe } = useRecipes();
  const { ingredients: allIngredients } = useIngredients();
  const toast = useToast();

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [imageFile, setImageFile] = useState(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [ingredientImages, setIngredientImages] = useState({});
  const [expandedStep, setExpandedStep] = useState(0);

  const [recipe, setRecipe] = useState(() =>
    recipeToEdit
      ? { ...recipeToEdit, steps: withStepIds(recipeToEdit.steps) }
      : emptyRecipe()
  );

  const isEditing = !!recipeToEdit;

  useEffect(() => {
    let cancelled = false;

    const loadImages = async () => {
      const images = {};
      for (const recipeIng of recipe.ingredients) {
        const full = allIngredients.find((ing) => ing.id === recipeIng.ingredientId);
        if (full?.imageUrl) {
          try {
            images[recipeIng.ingredientId] = await loadImageWithCache(full.imageUrl);
          } catch (error) {
            console.error(`Error loading image for ${full.name}:`, error);
          }
        }
      }
      if (!cancelled) setIngredientImages(images);
    };

    if (recipe.ingredients.length > 0 && allIngredients.length > 0) loadImages();
    return () => {
      cancelled = true;
    };
  }, [recipe.ingredients, allIngredients]);

  const unitsByGroup = useMemo(
    () =>
      UNIT_GROUPS.map((group) => ({
        ...group,
        units: UNITS.filter((u) => u.category === group.category)
      })),
    []
  );

  const addIngredientToRecipe = (ingredient) =>
    setRecipe((prev) => ({
      ...prev,
      ingredients: [
        ...prev.ingredients,
        {
          ingredientId: ingredient.id,
          name: ingredient.name,
          category: ingredient.category,
          imageUrl: ingredient.imageUrl,
          quantity: '',
          unit: ingredient.defaultUnit || 'g'
        }
      ]
    }));

  const removeIngredient = (index) =>
    setRecipe((prev) => {
      const target = prev.ingredients[index];
      return {
        ...prev,
        ingredients: prev.ingredients.filter((_, idx) => idx !== index),
        steps: prev.steps.map((step) => ({
          ...step,
          ingredientIds: (step.ingredientIds || []).filter((id) => id !== target.ingredientId)
        }))
      };
    });

  const deselectIngredient = (selected) => {
    const index = recipe.ingredients.findIndex(
      (ing) => ing.ingredientId === selected?.ingredientId
    );
    if (index !== -1) removeIngredient(index);
  };

  const updateIngredient = (index, field, value) =>
    setRecipe((prev) => ({
      ...prev,
      ingredients: prev.ingredients.map((ing, idx) =>
        idx === index ? { ...ing, [field]: value } : ing
      )
    }));

  const toggleTag = (tagId) =>
    setRecipe((prev) => {
      const current = prev.tags || [];
      return {
        ...prev,
        tags: current.includes(tagId) ? current.filter((t) => t !== tagId) : [...current, tagId]
      };
    });

  const validate = () => {
    const next = {};

    if (!recipe.name.trim()) {
      next.name = 'Le nom de la recette est obligatoire';
    } else if (recipe.name.trim().length < 3) {
      next.name = '3 caractères minimum';
    }

    recipe.ingredients.forEach((ing, index) => {
      if (ing.quantity === '' || ing.quantity === null || Number.isNaN(parseFloat(ing.quantity))) {
        next[`ingredient-${index}`] = 'Quantité requise';
      }
    });

    if (!recipe.steps.some((step) => step.instruction.trim())) {
      next.steps = 'Décrivez au moins une étape';
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) {
      toast.error('Le formulaire contient des erreurs');
      return;
    }

    setLoading(true);

    // L'identifiant de glisser-déposer est local : il ne part pas en base.
    const payload = {
      ...recipe,
      name: recipe.name.trim(),
      steps: recipe.steps
        .filter((step) => step.instruction.trim())
        .map(({ id: _id, ...step }, index) => ({ ...step, order: index })),
      ingredients: recipe.ingredients.map((ing) => ({
        ...ing,
        quantity: parseFloat(ing.quantity) || 0
      })),
      calories: recipe.calories === '' || recipe.calories == null ? null : Number(recipe.calories),
      protein: recipe.protein === '' || recipe.protein == null ? null : Number(recipe.protein)
    };

    try {
      if (isEditing) {
        await updateRecipe(recipeToEdit.id, payload, imageFile, removeImage);
        toast.success('Recette enregistrée');
      } else {
        await addRecipe(payload, imageFile);
        toast.success('Recette créée');
      }
      onSuccess();
    } catch (err) {
      console.error(err);
      toast.error(
        isEditing
          ? 'Erreur lors de la modification de la recette'
          : 'Erreur lors de la création de la recette'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <header className={styles.header}>
        <button type="button" className={styles.close} onClick={onCancel} aria-label="Annuler">
          <X size={19} strokeWidth={2.2} />
        </button>
        <h1 className={styles.title}>{isEditing ? 'Modifier la recette' : 'Nouvelle recette'}</h1>
        <div className={styles.headerActions}>
          <Button variant="secondary" onClick={onCancel} disabled={loading}>
            Annuler
          </Button>
          <Button type="submit" variant="primary" loading={loading}>
            Enregistrer
          </Button>
        </div>
      </header>

      <div className={styles.columns}>
        <div className={styles.column}>
          <Field label="Nom de la recette" required error={errors.name} htmlFor="recipe-name">
            <Input
              id="recipe-name"
              value={recipe.name}
              error={errors.name}
              onChange={(e) => setRecipe({ ...recipe, name: e.target.value })}
              placeholder="Ex. Velouté de butternut"
              autoFocus
            />
          </Field>

          <div className={styles.typeRow}>
            <Field label="Type" className={styles.typeField}>
              <div className={`${styles.typeChips} scrollRow`}>
                {RECIPE_TYPES.map((type) => (
                  <Chip
                    key={type.id}
                    label={type.label}
                    emoji={type.icon}
                    tone={type.tone}
                    active={recipe.type === type.id}
                    onClick={() => setRecipe({ ...recipe, type: type.id })}
                  />
                ))}
              </div>
            </Field>

            <Field label="Portions" className={styles.servingsField}>
              <Stepper
                value={recipe.servings}
                onChange={(value) => setRecipe({ ...recipe, servings: value })}
                min={1}
                max={50}
                label="Nombre de portions"
              />
            </Field>
          </div>

          <Field
            label="Repères par portion"
            hint="Estimations de cuisine, facultatives. Affichées sur la carte et le détail."
          >
            <div className={styles.nutritionRow}>
              <Input
                type="number"
                min="0"
                inputMode="numeric"
                value={recipe.calories ?? ''}
                onChange={(e) => setRecipe({ ...recipe, calories: e.target.value })}
                placeholder="kcal"
                aria-label="Calories par portion"
              />
              <Input
                type="number"
                min="0"
                inputMode="numeric"
                value={recipe.protein ?? ''}
                onChange={(e) => setRecipe({ ...recipe, protein: e.target.value })}
                placeholder="g de protéines"
                aria-label="Protéines par portion, en grammes"
              />
            </div>
          </Field>

          <ImageUpload
            currentImage={recipeToEdit?.imageUrl}
            onImageSelect={(file) => {
              setImageFile(file);
              setRemoveImage(false);
            }}
            onImageRemove={() => {
              setImageFile(null);
              setRemoveImage(true);
            }}
            label="Photo"
          />

          <div className={styles.block}>
            <div className={styles.blockHead}>
              <span className={styles.blockLabel}>Ingrédients · catalogue du foyer</span>
              <span className={styles.blockCount}>{recipe.ingredients.length}</span>
            </div>

            <IngredientSelector
              onSelect={addIngredientToRecipe}
              onDeselect={deselectIngredient}
              selectedIngredients={recipe.ingredients}
            />

            {recipe.ingredients.length > 0 && (
              <div className={styles.ingredients}>
                {recipe.ingredients.map((ingredient, index) => {
                  const category = getCategory(ingredient.category);
                  const error = errors[`ingredient-${index}`];

                  return (
                    <div
                      key={`${ingredient.ingredientId}-${index}`}
                      className={`${styles.ingredient} ${error ? styles.ingredientError : ''}`}
                    >
                      {ingredientImages[ingredient.ingredientId] ? (
                        <img
                          src={ingredientImages[ingredient.ingredientId]}
                          alt=""
                          className={styles.ingredientThumb}
                        />
                      ) : (
                        <EmojiPill emoji={category.icon} tone={category.tone} size="md" />
                      )}

                      <span className={styles.ingredientName}>{ingredient.name}</span>

                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        inputMode="decimal"
                        placeholder="Qté"
                        aria-label={`Quantité de ${ingredient.name}`}
                        value={ingredient.quantity}
                        onChange={(e) => updateIngredient(index, 'quantity', e.target.value)}
                        className={`${styles.quantity} ${error ? styles.quantityError : ''}`}
                      />

                      <select
                        value={ingredient.unit}
                        aria-label={`Unité de ${ingredient.name}`}
                        onChange={(e) => updateIngredient(index, 'unit', e.target.value)}
                        className={styles.unit}
                      >
                        {unitsByGroup.map((group) => (
                          <optgroup key={group.category} label={group.label}>
                            {group.units.map((unit) => (
                              <option key={unit.id} value={unit.id}>
                                {unit.label}
                              </option>
                            ))}
                          </optgroup>
                        ))}
                      </select>

                      <button
                        type="button"
                        onClick={() => removeIngredient(index)}
                        className={styles.removeIngredient}
                        aria-label={`Retirer ${ingredient.name}`}
                      >
                        <X size={16} strokeWidth={2.2} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {Object.keys(errors).some((key) => key.startsWith('ingredient-')) && (
              <p className={styles.errorText}>
                Renseignez une quantité pour chaque ingrédient.
              </p>
            )}
          </div>
        </div>

        <div className={styles.column}>
          <div className={styles.block}>
            <div className={styles.blockHead}>
              <span className={styles.blockLabel}>Étapes · glisser pour réordonner</span>
              <span className={styles.blockCount}>{recipe.steps.length}</span>
            </div>

            <StepEditor
              steps={recipe.steps}
              ingredients={recipe.ingredients}
              expandedStep={expandedStep}
              onExpandStep={setExpandedStep}
              onChange={(steps) => setRecipe((prev) => ({ ...prev, steps }))}
            />

            {errors.steps && <p className={styles.errorText}>{errors.steps}</p>}
          </div>

          <div className={styles.block}>
            <span className={styles.blockLabel}>Tags</span>
            <div className={styles.tags}>
              {RECIPE_TAGS.map((tag) => (
                <TagBadge
                  key={tag.id}
                  tag={tag}
                  selected={recipe.tags?.includes(tag.id)}
                  onClick={() => toggleTag(tag.id)}
                  className={
                    recipe.tags?.includes(tag.id) ? styles.tagOn : styles.tagOff
                  }
                  style={toneVars(tag.tone)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <footer className={styles.footer}>
        <Button
          variant="secondary"
          size="lg"
          onClick={onCancel}
          disabled={loading}
          className={styles.footerCancel}
        >
          Annuler
        </Button>
        <Button type="submit" variant="primary" size="lg" loading={loading} className={styles.footerSubmit}>
          {isEditing ? 'Enregistrer les modifications' : 'Créer la recette'}
        </Button>
      </footer>
    </form>
  );
};

export default RecipeForm;
