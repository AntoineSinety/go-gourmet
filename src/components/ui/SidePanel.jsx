import { createPortal } from 'react-dom';
import { useOverlay } from './useOverlay';
import styles from './SidePanel.module.css';

/**
 * Panneau latéral droit sur desktop (≈ 480 px), plein écran sur mobile.
 * Utilisé pour le détail de recette, qui s'ouvre par-dessus l'onglet courant.
 */
const SidePanel = ({ open, onClose, children, label }) => {
  useOverlay(open, onClose);

  if (!open) return null;

  return createPortal(
    <>
      <div className={styles.overlay} onClick={onClose} />
      <aside className={styles.panel} role="dialog" aria-modal="true" aria-label={label}>
        {children}
      </aside>
    </>,
    document.body
  );
};

export default SidePanel;
