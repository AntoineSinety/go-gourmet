import { INGREDIENT_CATEGORIES } from '../contexts/IngredientContext';
import { formatQuantity, getUnitLabel } from '../utils/units';
import { toneVars } from '../utils/palette';
import OptimizedImage from './OptimizedImage';
import styles from './IngredientRow.module.css';

const getCategory = (id) =>
  INGREDIENT_CATEGORIES.find((c) => c.id === id) ||
  INGREDIENT_CATEGORIES[INGREDIENT_CATEGORIES.length - 1];

/**
 * Ligne d'ingrédient : vignette (photo du catalogue, sinon pastille de catégorie),
 * nom, quantité en DM Mono.
 *
 * size : sm (grille desktop) | md (liste mobile) | lg (Mode Cuisson)
 */
const IngredientRow = ({ ingredient, imageUrl, ratio = 1, size = 'md', className = '' }) => {
  const category = getCategory(ingredient.category);
  const quantity = formatQuantity((ingredient.quantity || 0) * ratio);

  return (
    <div className={[styles.row, styles[size], className].filter(Boolean).join(' ')}>
      {imageUrl ? (
        <OptimizedImage src={imageUrl} alt="" className={styles.thumb} asBackground caption="" />
      ) : (
        <span className={styles.thumb} style={toneVars(category.tone)} aria-hidden="true">
          <span className={styles.emoji}>{category.icon}</span>
        </span>
      )}
      <span className={styles.name}>{ingredient.name}</span>
      {quantity && (
        <span className={styles.quantity}>
          {quantity} {getUnitLabel(ingredient.unit)}
        </span>
      )}
    </div>
  );
};

export default IngredientRow;
