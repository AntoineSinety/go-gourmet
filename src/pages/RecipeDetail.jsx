import { useState, useEffect, useMemo } from 'react';
import { useRecipes } from '../contexts/RecipeContext';
import { useIngredients } from '../contexts/IngredientContext';
import { useToast } from '../contexts/ToastContext';
import { getRecipeTypeById } from '../utils/recipeTypes';
import { getTagsByIds } from '../utils/recipeTags';
import { X, Pencil, ChefHat, Trash2, AlertTriangle } from 'lucide-react';
import OptimizedImage from '../components/OptimizedImage';
import IngredientRow from '../components/IngredientRow';
import NutritionBadge from '../components/NutritionBadge';
import { Button, TagBadge, Stepper, Modal, Skeleton, EmptyState } from '../components/ui';
import styles from './RecipeDetail.module.css';

const RecipeDetail = ({ recipeId, onClose, onStartCooking, onEdit, onDelete }) => {
  const { getRecipe } = useRecipes();
  const { ingredients: allIngredients } = useIngredients();
  const toast = useToast();

  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [servings, setServings] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadRecipe = async () => {
      try {
        const data = await getRecipe(recipeId);
        if (cancelled) return;
        setRecipe(data);
        setServings(data?.servings || 1);
      } catch (error) {
        console.error('Error loading recipe:', error);
        if (!cancelled) toast.error('Impossible de charger la recette');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadRecipe();
    return () => {
      cancelled = true;
    };
  }, [recipeId, getRecipe, toast]);

  const imagesByIngredientId = useMemo(() => {
    const map = {};
    allIngredients.forEach((ing) => {
      if (ing.imageUrl) map[ing.id] = ing.imageUrl;
    });
    return map;
  }, [allIngredients]);

  const handleDelete = async () => {
    if (!onDelete) return;
    setDeleting(true);

    try {
      await onDelete(recipeId);
      toast.success('Recette supprimée');
      onClose();
    } catch (error) {
      console.error('Error deleting recipe:', error);
      toast.error('Erreur lors de la suppression de la recette');
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.panel}>
        <Skeleton variant="media" className={styles.heroSkeleton} />
        <div className={styles.skeletonBody}>
          <Skeleton variant="title" width="70%" height={26} />
          <Skeleton variant="text" width="40%" />
          <Skeleton variant="block" height={64} />
          <Skeleton variant="block" height={52} />
          <Skeleton variant="block" height={52} />
        </div>
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className={styles.panel}>
        <EmptyState
          size="sm"
          icon={AlertTriangle}
          title="Recette introuvable"
          description="Elle a peut-être été supprimée par un autre membre du foyer."
          action={<Button variant="secondary" onClick={onClose}>Fermer</Button>}
        />
      </div>
    );
  }

  const type = getRecipeTypeById(recipe.type || 'plat');
  const tags = getTagsByIds(recipe.tags || []);
  const baseServings = recipe.servings || 1;
  const ratio = (servings || baseServings) / baseServings;
  const ingredients = recipe.ingredients || [];
  const steps = recipe.steps || [];

  return (
    <div className={styles.panel}>
      <header className={styles.hero}>
        <OptimizedImage
          src={recipe.imageUrl}
          alt=""
          asBackground
          className={styles.heroMedia}
          caption=""
        />
        <div className={styles.heroScrim} />

        <div className={styles.heroActions}>
          <button type="button" className={styles.heroButton} onClick={onClose} aria-label="Fermer">
            <X size={20} strokeWidth={2.2} />
          </button>
          <div className={styles.heroActionsRight}>
            {onEdit && (
              <button
                type="button"
                className={styles.heroButton}
                onClick={() => onEdit(recipe)}
                aria-label="Modifier la recette"
              >
                <Pencil size={19} strokeWidth={2} />
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                className={`${styles.heroButton} ${styles.heroDanger}`}
                onClick={() => setShowDeleteConfirm(true)}
                aria-label="Supprimer la recette"
              >
                <Trash2 size={19} strokeWidth={2} />
              </button>
            )}
          </div>
        </div>

        <div className={styles.heroCaption}>
          <div className={styles.heroBadges}>
            {type && (
              <span className={styles.typeBadge}>
                <span className={styles.typeEmoji}>{type.icon}</span>
                {type.label}
              </span>
            )}
            {tags.map((tag) => (
              <TagBadge key={tag.id} tag={tag} size="sm" className={styles.heroTag} />
            ))}
          </div>
          <h1 className={styles.title}>{recipe.name}</h1>
        </div>
      </header>

      <div className={styles.servingsRow}>
        <div>
          <div className={styles.servingsLabel}>Portions</div>
          <div className={styles.servingsValue}>
            {servings} personne{servings > 1 ? 's' : ''}
          </div>
        </div>
        <Stepper value={servings} onChange={setServings} min={1} max={50} label="Portions" />
      </div>

      <div className={styles.content}>
        <NutritionBadge
          calories={recipe.calories}
          protein={recipe.protein}
          servings={baseServings}
          ratio={ratio}
          variant="block"
        />

        {ingredients.length > 0 && (
          <section className={styles.section}>
            <div className={styles.sectionHead}>
              <h2 className={styles.sectionTitle}>Ingrédients</h2>
              <span className={styles.sectionCount}>
                {ingredients.length} item{ingredients.length > 1 ? 's' : ''}
              </span>
            </div>
            <div className={styles.ingredients}>
              {ingredients.map((ingredient, index) => (
                <IngredientRow
                  key={`${ingredient.ingredientId || ingredient.name}-${index}`}
                  ingredient={ingredient}
                  imageUrl={imagesByIngredientId[ingredient.ingredientId]}
                  ratio={ratio}
                />
              ))}
            </div>
            {ratio !== 1 && (
              <p className={styles.ratioNote}>
                Quantités ajustées pour {servings} personne{servings > 1 ? 's' : ''} (recette
                enregistrée pour {baseServings}).
              </p>
            )}
          </section>
        )}

        {steps.length > 0 && (
          <section className={styles.section}>
            <div className={styles.sectionHead}>
              <h2 className={styles.sectionTitle}>Étapes</h2>
              <span className={styles.sectionCount}>
                {steps.length} étape{steps.length > 1 ? 's' : ''}
              </span>
            </div>
            <ol className={styles.steps}>
              {steps.map((step, index) => (
                <li key={index} className={styles.step}>
                  <span className={styles.stepNumber}>{index + 1}</span>
                  <p className={styles.stepText}>{step.instruction}</p>
                </li>
              ))}
            </ol>
          </section>
        )}
      </div>

      <footer className={styles.actions}>
        {onStartCooking && steps.length > 0 && (
          <Button
            variant="primary"
            size="lg"
            icon={ChefHat}
            className={styles.cookButton}
            onClick={() => onStartCooking(recipe)}
          >
            Lancer le mode cuisson
          </Button>
        )}
        {onEdit && (
          <Button
            variant="secondary"
            size="lg"
            icon={Pencil}
            className={styles.editButton}
            onClick={() => onEdit(recipe)}
          >
            Modifier
          </Button>
        )}
        {onDelete && (
          <Button
            variant="danger"
            size="lg"
            icon={Trash2}
            className={styles.deleteButton}
            aria-label="Supprimer la recette"
            onClick={() => setShowDeleteConfirm(true)}
          />
        )}
      </footer>

      <Modal
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="Supprimer cette recette ?"
        size="sm"
        footer={
          <>
            <Button
              variant="secondary"
              fullWidth
              onClick={() => setShowDeleteConfirm(false)}
              disabled={deleting}
            >
              Annuler
            </Button>
            <Button variant="danger" fullWidth icon={Trash2} loading={deleting} onClick={handleDelete}>
              Supprimer
            </Button>
          </>
        }
      >
        <p className={styles.confirmText}>
          Cette action est irréversible. La recette « {recipe.name} » sera définitivement supprimée
          pour tous les membres du foyer.
        </p>
      </Modal>
    </div>
  );
};

export default RecipeDetail;
