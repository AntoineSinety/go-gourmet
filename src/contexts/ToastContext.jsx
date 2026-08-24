import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Toast from '../components/ui/Toast';
import styles from './ToastContext.module.css';

const ToastContext = createContext(null);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};

const DURATION = 4000;
const EXIT = 180;

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const timers = useRef(new Map());
  const nextId = useRef(0);

  const dismiss = useCallback((id) => {
    setToasts((current) => current.map((t) => (t.id === id ? { ...t, leaving: true } : t)));
    window.setTimeout(() => {
      setToasts((current) => current.filter((t) => t.id !== id));
      timers.current.delete(id);
    }, EXIT);
  }, []);

  const push = useCallback(
    (message, variant = 'info', duration = DURATION) => {
      if (!message) return null;
      const id = ++nextId.current;
      setToasts((current) => [...current.slice(-2), { id, message, variant, leaving: false }]);
      timers.current.set(id, window.setTimeout(() => dismiss(id), duration));
      return id;
    },
    [dismiss]
  );

  const value = useMemo(
    () => ({
      toast: push,
      success: (message, duration) => push(message, 'success', duration),
      error: (message, duration) => push(message, 'error', duration),
      info: (message, duration) => push(message, 'info', duration),
      dismiss
    }),
    [push, dismiss]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      {createPortal(
        <div className={styles.viewport} aria-live="polite" aria-atomic="false">
          {toasts.map((t) => (
            <Toast
              key={t.id}
              variant={t.variant}
              message={t.message}
              leaving={t.leaving}
              onDismiss={() => dismiss(t.id)}
            />
          ))}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
};
