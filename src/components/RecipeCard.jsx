import { Users, ListOrdered } from 'lucide-react';
import { getRecipeTypeById } from '../utils/recipeTypes';
import { getTagsByIds } from '../utils/recipeTags';
import OptimizedImage from './OptimizedImage';
import TagBadge from './ui/TagBadge';
import styles from './RecipeCard.module.css';

const MAX_TAGS = 2;

/**
 * Carte de recette : la photo est le premier signal.
 * Le type est posé sur la photo, les tags et les métadonnées sous le titre.
 */
const RecipeCard = ({ recipe, onClick }) => {
  const type = getRecipeTypeById(recipe.type || 'plat');
  const tags = getTagsByIds(recipe.tags || []);
  const steps = recipe.steps?.length || 0;

  return (
    <article className={styles.card}>
      <button type="button" className={styles.hit} onClick={() => onClick(recipe.id)}>
        <span className={styles.srOnly}>Voir la recette {recipe.name}</span>
      </button>

      <OptimizedImage src={recipe.imageUrl} alt="" className={styles.media} asBackground>
        {type && (
          <span className={styles.typeBadge}>
            <span className={styles.typeEmoji}>{type.icon}</span>
            {type.label}
          </span>
        )}
        <span className={styles.hoverLayer}>
          <span className={styles.hoverCta}>Voir la recette</span>
        </span>
      </OptimizedImage>

      <div className={styles.body}>
        <h3 className={styles.name}>{recipe.name}</h3>

        {tags.length > 0 && (
          <div className={styles.tags}>
            {tags.slice(0, MAX_TAGS).map((tag) => (
              <TagBadge key={tag.id} tag={tag} size="sm" />
            ))}
            {tags.length > MAX_TAGS && (
              <span className={styles.moreTags}>+{tags.length - MAX_TAGS}</span>
            )}
          </div>
        )}

        <div className={styles.meta}>
          <span className={styles.metaItem}>
            <Users size={14} strokeWidth={2} />
            {recipe.servings} pers.
          </span>
          <span className={styles.metaItem}>
            <ListOrdered size={14} strokeWidth={2} />
            {steps} étape{steps > 1 ? 's' : ''}
          </span>
        </div>
      </div>
    </article>
  );
};

export default RecipeCard;
