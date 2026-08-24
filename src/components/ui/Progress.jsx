import styles from './Progress.module.css';

/**
 * Barre de progression. `caption` s'affiche sous la piste en DM Mono.
 */
const Progress = ({ value = 0, max = 100, caption, tone = 'accent', size = 'md', className = '' }) => {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;

  return (
    <div className={[styles.wrap, className].filter(Boolean).join(' ')}>
      <div
        className={[styles.track, styles[size]].filter(Boolean).join(' ')}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
      >
        <div
          className={[styles.bar, tone === 'success' ? styles.success : ''].filter(Boolean).join(' ')}
          style={{ width: `${pct}%` }}
        />
      </div>
      {caption && <div className={styles.caption}>{caption}</div>}
    </div>
  );
};

export default Progress;
