import styles from './NutritionBadge.module.css';

/**
 * Repères nutritionnels d'une recette, par portion.
 *
 * Les valeurs sont saisies à la main sur la recette : ce sont des estimations
 * de cuisine, pas une analyse de laboratoire. On les affiche en DM Mono, comme
 * les autres chiffres de l'app.
 *
 * variant : inline (ligne de méta d'une carte) | block (détail de recette)
 */
const NutritionBadge = ({ calories, protein, servings = 1, ratio = 1, variant = 'inline' }) => {
  if (!calories && !protein) return null;

  // Les quantités affichées suivent le sélecteur de portions du détail ; les
  // repères sont par portion, donc ils ne bougent pas avec lui.
  const perPortion = variant === 'block' && ratio !== 1;

  return (
    <span className={[styles.badge, styles[variant]].join(' ')}>
      {calories > 0 && (
        <span className={styles.item}>
          <span className={styles.value}>{Math.round(calories)}</span>
          <span className={styles.unit}>kcal</span>
        </span>
      )}
      {protein > 0 && (
        <span className={styles.item}>
          <span className={styles.value}>{Math.round(protein)}</span>
          <span className={styles.unit}>
            {variant === 'block' ? 'g de protéines' : 'g prot.'}
          </span>
        </span>
      )}
      {variant === 'block' && (
        <span className={styles.note}>
          par portion{perPortion ? ` · recette pour ${servings}` : ''}
        </span>
      )}
    </span>
  );
};

export default NutritionBadge;
