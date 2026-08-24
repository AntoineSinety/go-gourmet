import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useOverlay } from './useOverlay';
import styles from './Modal.module.css';

/**
 * Modale centrée sur desktop, bottom sheet sur mobile.
 * size : sm | md | lg
 */
const Modal = ({
  open,
  onClose,
  title,
  subtitle,
  headerExtra,
  footer,
  size = 'md',
  padded = true,
  children
}) => {
  useOverlay(open, onClose);

  if (!open) return null;

  return createPortal(
    <div className={styles.root}>
      <div className={styles.overlay} onClick={onClose} />
      <div
        className={[styles.panel, styles[size]].filter(Boolean).join(' ')}
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === 'string' ? title : undefined}
      >
        <div className={styles.grabber} aria-hidden="true" />
        {(title || onClose) && (
          <header className={styles.header}>
            <div className={styles.headings}>
              {title && <h2 className={styles.title}>{title}</h2>}
              {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
            </div>
            {headerExtra}
            {onClose && (
              <button type="button" className={styles.close} onClick={onClose} aria-label="Fermer">
                <X size={18} strokeWidth={2.2} />
              </button>
            )}
          </header>
        )}
        <div className={[styles.body, padded ? styles.padded : ''].filter(Boolean).join(' ')}>
          {children}
        </div>
        {footer && <footer className={styles.footer}>{footer}</footer>}
      </div>
    </div>,
    document.body
  );
};

export default Modal;
