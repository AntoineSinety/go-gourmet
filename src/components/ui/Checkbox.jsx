import { Check } from 'lucide-react';
import styles from './Checkbox.module.css';

/**
 * Case à cocher de la liste de courses.
 * size : md (28) | lg (34, Mode Course)
 */
const Checkbox = ({ checked = false, size = 'md', className = '', ...props }) => (
  <span
    className={[styles.box, styles[size], checked ? styles.checked : '', className]
      .filter(Boolean)
      .join(' ')}
    aria-hidden="true"
    {...props}
  >
    {checked && <Check size={size === 'lg' ? 21 : 17} strokeWidth={3.2} />}
  </span>
);

export default Checkbox;
