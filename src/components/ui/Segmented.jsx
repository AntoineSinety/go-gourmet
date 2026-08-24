import styles from './Segmented.module.css';

/**
 * Bascule segmentée compacte (ex. mode de recherche « Nom » / « Ingrédient »).
 * options : [{ value, label }]
 */
const Segmented = ({ options = [], value, onChange, size = 'sm', className = '', label }) => (
  <div
    className={[styles.track, styles[size], className].filter(Boolean).join(' ')}
    role="tablist"
    aria-label={label}
  >
    {options.map((option) => (
      <button
        key={option.value}
        type="button"
        role="tab"
        aria-selected={value === option.value}
        className={`${styles.option} ${value === option.value ? styles.selected : ''}`}
        onClick={() => onChange(option.value)}
      >
        {option.label}
      </button>
    ))}
  </div>
);

export default Segmented;
