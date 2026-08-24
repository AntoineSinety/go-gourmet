import { Minus, Plus } from 'lucide-react';
import styles from './Stepper.module.css';

/** Sélecteur numérique compact (portions, quantité de jours). */
const Stepper = ({ value, onChange, min = 1, max = 99, suffix, label, className = '' }) => (
  <div className={[styles.stepper, className].filter(Boolean).join(' ')} role="group" aria-label={label}>
    <button
      type="button"
      className={styles.button}
      onClick={() => onChange(Math.max(min, value - 1))}
      disabled={value <= min}
      aria-label="Diminuer"
    >
      <Minus size={16} strokeWidth={2.5} />
    </button>
    <span className={styles.value}>
      {value}
      {suffix && <span className={styles.suffix}> {suffix}</span>}
    </span>
    <button
      type="button"
      className={styles.button}
      onClick={() => onChange(Math.min(max, value + 1))}
      disabled={value >= max}
      aria-label="Augmenter"
    >
      <Plus size={16} strokeWidth={2.5} />
    </button>
  </div>
);

export default Stepper;
