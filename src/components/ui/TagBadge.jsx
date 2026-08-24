import { X } from 'lucide-react';
import { toneVars } from '../../utils/palette';
import styles from './TagBadge.module.css';

/**
 * Badge de tag de recette : point de couleur + libellé sur fond teinté.
 *
 * size    : sm (sur photo, grille dense) | md (par défaut)
 * variant : soft (par défaut) | overlay (posé sur une photo)
 *
 * Devient un bouton dès qu'un `onClick` ou un `onRemove` est fourni ;
 * `selected` ajoute la bordure teintée de l'état actif.
 */
const TagBadge = ({
  tag,
  size = 'md',
  variant = 'soft',
  selected = false,
  onClick,
  onRemove,
  className = '',
  ...props
}) => {
  if (!tag) return null;

  const interactive = onClick || onRemove;

  const content = (
    <>
      <span className={styles.dot} aria-hidden="true" />
      <span className={styles.label}>{tag.label}</span>
      {onRemove && <X size={12} strokeWidth={2.5} className={styles.remove} />}
    </>
  );

  const classNames = [
    styles.badge,
    styles[size],
    styles[variant],
    selected ? styles.selected : '',
    className
  ]
    .filter(Boolean)
    .join(' ');

  if (interactive) {
    return (
      <button
        type="button"
        className={classNames}
        style={toneVars(tag.tone)}
        onClick={onRemove || onClick}
        aria-pressed={onClick ? selected : undefined}
        aria-label={onRemove ? `Retirer le tag ${tag.label}` : undefined}
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
