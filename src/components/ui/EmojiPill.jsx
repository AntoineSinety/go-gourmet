import { toneVars } from '../../utils/palette';
import styles from './EmojiPill.module.css';

/**
 * Pastille encadrant un emoji de catégorie.
 * L'emoji ne flotte plus dans le texte : il vit dans un carré au fond teinté.
 *
 * size : xs (24) | sm (26) | md (32) | lg (40) | xl (48)
 */
const EmojiPill = ({ emoji, tone = 'neutral', size = 'md', className = '', ...props }) => (
  <span
    className={[styles.pill, styles[size], className].filter(Boolean).join(' ')}
    style={toneVars(tone)}
    aria-hidden="true"
    {...props}
  >
    {emoji}
  </span>
);

export default EmojiPill;
