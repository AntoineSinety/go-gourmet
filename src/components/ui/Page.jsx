import styles from './Page.module.css';

/**
 * Conteneur d'écran : gouttières et rythme vertical identiques partout.
 * 16px de gouttière sur mobile, 48px sur desktop, contenu centré à 1400px.
 */
const Page = ({ children, className = '', width = 'default', ...props }) => (
  <div className={[styles.page, styles[width], className].filter(Boolean).join(' ')} {...props}>
    {children}
  </div>
);

export default Page;
