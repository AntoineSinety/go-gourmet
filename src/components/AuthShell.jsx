import styles from './AuthShell.module.css';

/**
 * Écrans hors navigation (connexion, mise en place du foyer).
 * Le halo orange est la seule ornementation de l'app et ne sert qu'ici.
 */
const AuthShell = ({ children }) => (
  <div className={styles.shell}>
    <div className={styles.halo} aria-hidden="true" />
    <div className={styles.content}>{children}</div>
  </div>
);

export default AuthShell;
