import styles from './Skeleton.module.css';

/**
 * Bloc squelette. `variant` : block | text | title | media | circle
 */
const Skeleton = ({ variant = 'block', width, height, className = '', style, ...props }) => (
  <div
    className={[styles.skeleton, styles[variant], className].filter(Boolean).join(' ')}
    style={{ width, height, ...style }}
    aria-hidden="true"
    {...props}
  />
);

/** Squelette de carte recette, calé sur les proportions de la vraie carte. */
export const RecipeCardSkeleton = () => (
  <div className={styles.card}>
    <Skeleton variant="media" />
    <div className={styles.cardBody}>
      <Skeleton variant="title" width="70%" />
      <Skeleton variant="text" width="40%" />
    </div>
  </div>
);

/** Squelette de ligne de liste (ingrédient, article de courses). */
export const RowSkeleton = () => (
  <div className={styles.row}>
    <Skeleton variant="circle" width={40} height={40} />
    <div className={styles.rowBody}>
      <Skeleton variant="text" width="55%" />
      <Skeleton variant="text" width="30%" height={10} />
    </div>
  </div>
);

export default Skeleton;
