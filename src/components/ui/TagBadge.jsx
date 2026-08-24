import { X } from 'lucide-react';
import { toneVars } from '../../utils/palette';
import styles from './TagBadge.module.css';

/**
 * Badge de tag de recette : point de couleur + libellé sur fond teinté.
 *
 * size    : sm (sur photo, grille dense) | md (par défaut)
 * variant : soft (par défaut) | overlay (posé sur une photo) | outlined (actif, retirable)
 */
const TagBadge = ({
  tag,
  size = 'md',
  variant = 'soft',
  onRemove,
  className = '',
  ...props
}) => {
  if (!tag) return null;

  const content = (
    <>
      <span className={styles.dot} aria-hidden="true" />
      <span className={styles.label}>{tag.label}</span>
      {onRemove && <X size={12} strokeWidth={2.5} className={styles.remove} />}
    </>
  );

  const classNames = [styles.badge, styles[size], styles[variant], className]
    .filter(Boolean)
    .join(' ');

  if (onRemove) {
    return (
      <button
        type="button"
        className={classNames}
        style={toneVars(tag.tone)}
        onClick={onRemove}
        aria-label={`Retirer le tag ${tag.label}`}
        {...props}
      >
        {content}
      </button>
    );
  }

  return (
    <span className={classNames} style={toneVars(tag.tone)} {...props}>
      {content}
    </span>
  );
};

export default TagBadge;
