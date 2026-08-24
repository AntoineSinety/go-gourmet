import { ChevronDown } from 'lucide-react';
import EmojiPill from './EmojiPill';
import styles from './SectionHeader.module.css';

/**
 * En-tête de section, repliable ou non (rayons de courses, catégories d'ingrédients).
 */
const SectionHeader = ({
  emoji,
  tone = 'neutral',
  title,
  count,
  collapsible = false,
  collapsed = false,
  onToggle,
  actions,
  className = ''
}) => {
  const Element = collapsible ? 'button' : 'div';

  return (
    <div className={[styles.wrap, className].filter(Boolean).join(' ')}>
      <Element
        type={collapsible ? 'button' : undefined}
        className={styles.main}
        onClick={collapsible ? onToggle : undefined}
        aria-expanded={collapsible ? !collapsed : undefined}
      >
        {emoji && <EmojiPill emoji={emoji} tone={tone} size="md" />}
        <span className={styles.title}>{title}</span>
        {typeof count === 'number' && <span className={styles.count}>{count}</span>}
        {collapsible && (
          <ChevronDown
            size={18}
            strokeWidth={2}
            className={`${styles.chevron} ${collapsed ? styles.collapsed : ''}`}
          />
        )}
      </Element>
      {actions && <div className={styles.actions}>{actions}</div>}
    </div>
  );
};

export default SectionHeader;
