import { useState } from 'react';
import { useHousehold } from '../contexts/HouseholdContext';
import styles from './HouseholdSetup.module.css';

const HouseholdSetup = () => {
  const { createHousehold, joinHousehold } = useHousehold();
  const [mode, setMode] = useState(null);
  const [householdName, setHouseholdName] = useState('');
  const [householdId, setHouseholdId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleCreateHousehold = async (e) => {
    e.preventDefault();
    if (!householdName.trim()) {
      setError('Veuillez entrer un nom de foyer');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await createHousehold(householdName);
    } catch (err) {
      setError('Erreur lors de la création du foyer');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinHousehold = async (e) => {
    e.preventDefault();
    if (!householdId.trim()) {
      setError('Veuillez entrer un ID de foyer');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await joinHousehold(householdId);
    } catch (err) {
      setError('Erreur lors de la connexion au foyer. Vérifiez l\'ID.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!mode) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.header}>
            <h1>Configuration du foyer</h1>
            <p>Choisissez comment vous souhaitez utiliser l'application</p>
          </div>

          <div className={styles.options}>
            <button
              onClick={() => setMode('create')}
              className={styles.optionButton}
            >
              <div className={styles.optionIcon}>+</div>
              <h3>Créer un nouveau foyer</h3>
              <p>Commencez avec votre propre collection de recettes</p>
            </button>

            <button
              onClick={() => setMode('join')}
              className={styles.optionButton}
            >
              <div className={styles.optionIcon}>→</div>
              <h3>Rejoindre un foyer</h3>
              <p>Partagez les recettes avec d'autres personnes</p>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (mode === 'create') {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <button
            onClick={() => setMode(null)}
            className={styles.backButton}
          >
            ← Retour
          </button>

          <div className={styles.header}>
            <h1>Créer un foyer</h1>
            <p>Donnez un nom à votre foyer</p>
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <form onSubmit={handleCreateHousehold} className={styles.form}>
            <div className={styles.formGroup}>
              <label htmlFor="householdName">Nom du foyer</label>
              <input
                type="text"
                id="householdName"
                value={householdName}
                onChange={(e) => setHouseholdName(e.target.value)}
                placeholder="Ex: Famille Dupont, Colocation..."
                autoFocus
                disabled={loading}
              />
            </div>

            <button type="submit" disabled={loading} className={styles.submitButton}>
              {loading ? 'Création...' : 'Créer le foyer'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <button
          onClick={() => setMode(null)}
          className={styles.backButton}
        >
          ← Retour
        </button>

        <div className={styles.header}>
          <h1>Rejoindre un foyer</h1>
          <p>Entrez l'ID du foyer partagé par un membre</p>
        </div>

        {error && <div className={styles.error}>{error}</div>}

        <form onSubmit={handleJoinHousehold} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="householdId">ID du foyer</label>
            <input
              type="text"
              id="householdId"
              value={householdId}
              onChange={(e) => setHouseholdId(e.target.value)}
              placeholder="Collez l'ID du foyer ici"
              autoFocus
              disabled={loading}
            />
            <small className={styles.hint}>
              L'ID vous a été communiqué par un membre du foyer
            </small>
          </div>

          <button type="submit" disabled={loading} className={styles.submitButton}>
            {loading ? 'Connexion...' : 'Rejoindre le foyer'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default HouseholdSetup;
