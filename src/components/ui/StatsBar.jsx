import Progress from './Progress';
import styles from './StatsBar.module.css';

/**
 * Bandeau de statistiques : une série de valeurs en DM Mono, avec progression facultative.
 * stats : [{ value, label, tone? }]
 */
const StatsBar = ({ stats = [], progress, className = '' }) => (
  <div className={[styles.bar, className].filter(Boolean).join(' ')}>
    <div className={styles.stats}>
      {stats.map((stat) => (
        <div key={stat.label} className={styles.stat}>
          <div
            className={[styles.value, stat.tone === 'accent' ? styles.accent : '', stat.tone === 'success' ? styles.success : '']
              .filter(Boolean)
              .join(' ')}
          >
            {stat.value}
          </div>
          <div className={styles.label}>{stat.label}</div>
        </div>
      ))}
    </div>
    {progress && (
      <Progress
        value={progress.value}
        max={progress.max}
        caption={progress.caption}
        tone={progress.value >= progress.max && progress.max > 0 ? 'success' : 'accent'}
        className={styles.progress}
      />
    )}
  </div>
);

export default StatsBar;
