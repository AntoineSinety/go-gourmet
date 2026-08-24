import { forwardRef } from 'react';
import styles from './Button.module.css';

/**
 * Bouton du design system.
 *
 * variant : primary | secondary | ghost | danger | icon
 * size    : sm (36px) | md (44px) | lg (48px)
 */
const Button = forwardRef(function Button(
  {
    variant = 'secondary',
    size = 'md',
    icon: Icon,
    iconRight: IconRight,
    fullWidth = false,
    loading = false,
    className = '',
    children,
    disabled,
    type = 'button',
    ...props
  },
  ref
) {
  const iconSize = size === 'sm' ? 16 : size === 'lg' ? 19 : 18;

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      className={[
        styles.button,
        styles[variant],
        styles[size],
        fullWidth ? styles.fullWidth : '',
        loading ? styles.loading : '',
        className
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {loading && <span className={styles.spinner} aria-hidden="true" />}
      {!loading && Icon && <Icon size={iconSize} strokeWidth={variant === 'primary' ? 2.5 : 2} />}
      {children && <span className={styles.label}>{children}</span>}
      {!loading && IconRight && <IconRight size={iconSize} strokeWidth={2} />}
    </button>
  );
});

export default Button;
