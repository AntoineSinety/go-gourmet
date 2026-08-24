import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import styles from './Toast.module.css';

const ICONS = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info
};

/** Toast présentationnel — l'orchestration vit dans contexts/ToastContext.jsx */
const Toast = ({ variant = 'info', message, onDismiss, leaving = false }) => {
  const Icon = ICONS[variant] || Info;

  return (
    <div
      className={[styles.toast, styles[variant], leaving ? styles.leaving : ''].filter(Boolean).join(' ')}
      role={variant === 'error' ? 'alert' : 'status'}
    >
      <Icon size={18} strokeWidth={2.2} className={styles.icon} />
      <span className={styles.message}>{message}</span>
      {onDismiss && (
        <button type="button" className={styles.close} onClick={onDismiss} aria-label="Fermer">
          <X size={15} strokeWidth={2.5} />
        </button>
      )}
    </div>
  );
};

export default Toast;
