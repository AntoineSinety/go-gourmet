import styles from './Avatar.module.css';

const TONE_CYCLE = ['#ff7300', '#8b5cf6', '#14b8a6', '#ec4899', '#22c55e', '#eab308'];

const initials = (name = '') =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase() || '?';

/** Avatar de membre : photo Google si disponible, sinon initiales sur aplat coloré. */
const Avatar = ({ src, name, index = 0, size = 34, className = '', ...props }) => (
  <span
    className={[styles.avatar, className].filter(Boolean).join(' ')}
    style={{
      width: size,
      height: size,
      fontSize: Math.round(size * 0.38),
      backgroundColor: src ? 'var(--surface-raised)' : TONE_CYCLE[index % TONE_CYCLE.length]
    }}
    title={name}
    {...props}
  >
    {src ? <img src={src} alt="" className={styles.image} referrerPolicy="no-referrer" /> : initials(name)}
  </span>
);

export default Avatar;
