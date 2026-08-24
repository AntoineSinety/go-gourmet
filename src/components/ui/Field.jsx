import { forwardRef, useId } from 'react';
import styles from './Field.module.css';

/**
 * Enveloppe de champ : label, contrôle, message d'aide ou d'erreur.
 * États couverts : normal, focus, erreur, désactivé.
 */
export const Field = ({ label, hint, error, required, htmlFor, className = '', children }) => (
  <div className={[styles.field, error ? styles.hasError : '', className].filter(Boolean).join(' ')}>
    {label && (
      <label className={styles.label} htmlFor={htmlFor}>
        {label}
        {required && <span className={styles.required} aria-hidden="true"> *</span>}
      </label>
    )}
    {children}
    {error ? (
      <p className={styles.error} role="alert">{error}</p>
    ) : hint ? (
      <p className={styles.hint}>{hint}</p>
    ) : null}
  </div>
);

export const Input = forwardRef(function Input(
  { icon: Icon, error, className = '', ...props },
  ref
) {
  if (Icon) {
    return (
      <div className={[styles.control, styles.withIcon, error ? styles.invalid : '', className].filter(Boolean).join(' ')}>
        <Icon size={18} strokeWidth={2} className={styles.icon} />
        <input ref={ref} className={styles.bare} aria-invalid={!!error} {...props} />
      </div>
    );
  }
  return (
    <input
      ref={ref}
      className={[styles.control, error ? styles.invalid : '', className].filter(Boolean).join(' ')}
      aria-invalid={!!error}
      {...props}
    />
  );
});

export const Textarea = forwardRef(function Textarea({ error, className = '', ...props }, ref) {
  return (
    <textarea
      ref={ref}
      className={[styles.control, styles.textarea, error ? styles.invalid : '', className]
        .filter(Boolean)
        .join(' ')}
      aria-invalid={!!error}
      {...props}
    />
  );
});

export const Select = forwardRef(function Select({ error, className = '', children, ...props }, ref) {
  return (
    <div className={styles.selectWrap}>
      <select
        ref={ref}
        className={[styles.control, styles.select, error ? styles.invalid : '', className]
          .filter(Boolean)
          .join(' ')}
        aria-invalid={!!error}
        {...props}
      >
        {children}
      </select>
      <svg className={styles.chevron} width="16" height="16" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
        <path d="M6 9l6 6 6-6" />
      </svg>
    </div>
  );
});

/** Champ complet label + input, pour les cas simples. */
export const TextField = ({ label, hint, error, required, className, ...inputProps }) => {
  const id = useId();
  return (
    <Field label={label} hint={hint} error={error} required={required} htmlFor={id} className={className}>
      <Input id={id} error={error} required={required} {...inputProps} />
    </Field>
  );
};

export default Field;
