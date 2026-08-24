import { X } from 'lucide-react';
import { toneVars } from '../../utils/palette';
import EmojiPill from './EmojiPill';
import styles from './Chip.module.css';

/**
 * Puce de filtre : type de recette, catégorie, rayon.
 *
 * - `active`   : aplat orange, texte sombre
 * - `emoji`    : encadré dans une pastille 26px teintée
 * - `count`    : compteur en DM Mono
 * - `count===0`: état « vide », bordure pointillée, non cliquable visuellement
 */
const Chip = ({
  label,
  emoji,
  tone = 'neutral',
  count,
  active = false,
  onRemove,
  className = '',
  children,
  ...props
}) => {
  const isEmpty = count === 0 && !active;

  return (
    <button
      type="button"
      aria-pressed={active}
      className={[
        styles.chip,
        active ? styles.active : '',
        isEmpty ? styles.empty : '',
        emoji ? styles.withEmoji : '',
        className
      ]
        .filter(Boolean)
        .join(' ')}
      style={toneVars(tone)}
      {...props}
    >
      {emoji && !active && <EmojiPill emoji={emoji} tone={tone} size="sm" />}
      {emoji && active && <span className={styles.plainEmoji}>{emoji}</span>}
      <span className={styles.label}>{label ?? children}</span>
      {typeof count === 'number' && <span className={styles.count}>{count}</span>}
      {onRemove && (
        <X
          size={12}
          strokeWidth={2.5}
          className={styles.remove}
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
        />
      )}
    </button>
  );
};

export default Chip;
