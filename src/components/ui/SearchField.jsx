import { Search, X } from 'lucide-react';
import Segmented from './Segmented';
import styles from './SearchField.module.css';

/**
 * Barre de recherche du design system.
 * Peut embarquer une bascule segmentée à droite (ex. « Nom » / « Ingrédient »).
 */
const SearchField = ({
  value,
  onChange,
  placeholder = 'Rechercher…',
  modes,
  mode,
  onModeChange,
  modeLabel,
  className = '',
  ...props
}) => (
  <div className={[styles.wrap, className].filter(Boolean).join(' ')}>
    <Search size={18} strokeWidth={2} className={styles.icon} />
    <input
      type="search"
      className={styles.input}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      {...props}
    />
    {value && (
      <button type="button" className={styles.clear} onClick={() => onChange('')} aria-label="Effacer la recherche">
        <X size={16} strokeWidth={2.5} />
      </button>
    )}
    {modes && (
      <Segmented options={modes} value={mode} onChange={onModeChange} label={modeLabel} />
    )}
  </div>
);

export default SearchField;
