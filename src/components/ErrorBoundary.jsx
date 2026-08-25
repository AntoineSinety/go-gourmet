import { Component } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import styles from './ErrorBoundary.module.css';

/**
 * Dernier filet avant l'écran blanc.
 *
 * Sans elle, une erreur de rendu — une donnée malformée, un champ absent —
 * vide l'écran sans message. En PWA installée l'utilisateur n'a même pas de
 * barre d'adresse pour recharger : il n'a plus aucune issue.
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('Erreur non rattrapée :', error, info.componentStack);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div className={styles.screen} role="alert">
        <div className={styles.card}>
          <span className={styles.icon}>
            <AlertTriangle size={30} strokeWidth={1.8} />
          </span>

          <h1 className={styles.title}>L’application s’est arrêtée</h1>
          <p className={styles.text}>
            Un affichage a rencontré une erreur inattendue. Vos recettes et votre planning sont
            intacts : ils sont enregistrés côté serveur, rien n’a été perdu.
          </p>

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.primary}
              onClick={() => window.location.reload()}
            >
              <RefreshCw size={18} strokeWidth={2} />
              Recharger l’application
            </button>
            <button
              type="button"
              className={styles.secondary}
              onClick={() => this.setState({ error: null })}
            >
              Réessayer sans recharger
            </button>
          </div>

          <details className={styles.details}>
            <summary className={styles.summary}>Détail technique</summary>
            <pre className={styles.trace}>{error.message || String(error)}</pre>
          </details>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
