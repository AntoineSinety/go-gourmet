import { Utensils } from 'lucide-react';
import styles from './AppSplash.module.css';

/** Écran d'attente au démarrage, le temps de résoudre l'auth et le foyer. */
const AppSplash = ({ message = 'Chargement…' }) => (
  <div className={styles.splash}>
    <span className={styles.mark}>
      <Utensils size={30} strokeWidth={2} />
    </span>
    <span className={styles.name}>Go Gourmet</span>
    <span className={styles.message}>{message}</span>
    <span className={styles.track}>
      <span className={styles.bar} />
    </span>
  </div>
);

export default AppSplash;
