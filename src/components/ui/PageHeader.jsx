import styles from './PageHeader.module.css';

/**
 * En-tête d'écran : titre en police d'affichage, sous-titre, actions à droite.
 * Sur mobile le titre passe à 30px et les actions se placent à côté du titre.
 */
const PageHeader = ({ title, subtitle, actions, className = '', children }) => (
  <div className={[styles.header, className].filter(Boolean).join(' ')}>
    <div className={styles.headings}>
      <h1 className={styles.title}>{title}</h1>
      {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
      {children}
    </div>
    {actions && <div className={styles.actions}>{actions}</div>}
  </div>
);

export default PageHeader;
