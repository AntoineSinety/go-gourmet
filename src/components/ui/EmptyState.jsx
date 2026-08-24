import styles from './EmptyState.module.css';

/**
 * État vide illustré.
 * size : lg (écran entièrement vide) | sm (résultat de filtre vide, section vide)
 */
const EmptyState = ({
  icon: Icon,
  title,
  description,
  action,
  size = 'lg',
  dashed = true,
  className = ''
}) => (
  <div className={[styles.wrap, styles[size], className].filter(Boolean).join(' ')}>
    {Icon && (
      <div className={[styles.badge, dashed ? styles.dashed : ''].filter(Boolean).join(' ')}>
        <Icon size={size === 'lg' ? 58 : 38} strokeWidth={1.5} />
      </div>
    )}
    <h3 className={styles.title}>{title}</h3>
    {description && <p className={styles.description}>{description}</p>}
    {action && <div className={styles.action}>{action}</div>}
  </div>
);

export default EmptyState;
