import { useState, useEffect } from 'react';
import { useHousehold } from '../contexts/HouseholdContext';
import { Home, Users, AlertCircle, PartyPopper } from 'lucide-react';
import AuthShell from '../components/AuthShell';
import { Button, Segmented, Field, Input } from '../components/ui';
import styles from './HouseholdSetup.module.css';

const MODES = [
  { value: 'create', label: 'Créer' },
  { value: 'join', label: 'Rejoindre' }
];

const HouseholdSetup = () => {
  const { createHousehold, joinHousehold } = useHousehold();

  const [mode, setMode] = useState('create');
  const [householdName, setHouseholdName] = useState('');
  const [householdId, setHouseholdId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isInviteLink, setIsInviteLink] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const joinId = params.get('join');

    if (joinId) {
      setHouseholdId(joinId);
      setMode('join');
      setIsInviteLink(true);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!householdName.trim()) {
      setError('Donnez un nom à votre foyer');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await createHousehold(householdName.trim());
    } catch (err) {
      console.error(err);
      setError('Le foyer n’a pas pu être créé. Réessayez.');
      setLoading(false);
    }
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    const cleanedId = householdId.trim();

    if (!cleanedId) {
      setError('Entrez le code d’invitation du foyer');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await joinHousehold(cleanedId);
    } catch (err) {
      console.error(err);
      setError('Foyer introuvable. Vérifiez le code reçu.');
      setLoading(false);
    }
  };

  return (
    <AuthShell>
      <h1 className={styles.title}>Votre foyer</h1>
      <p className={styles.intro}>
        Créez un foyer ou rejoignez celui de votre famille avec un code d’invitation.
      </p>

      {!isInviteLink && (
        <Segmented
          options={MODES}
          value={mode}
          onChange={(value) => {
            setMode(value);
            setError(null);
          }}
          size="md"
          label="Créer ou rejoindre un foyer"
          className={styles.modes}
        />
      )}

      <div className={styles.card}>
        <span className={styles.icon}>
          {mode === 'create' ? (
            <Home size={24} strokeWidth={2} />
          ) : (
            <Users size={24} strokeWidth={2} />
          )}
        </span>

        <h2 className={styles.cardTitle}>
          {mode === 'create' ? 'Créer un foyer' : 'Rejoindre un foyer'}
        </h2>

        {isInviteLink && (
          <p className={styles.invite}>
            <PartyPopper size={16} strokeWidth={2.2} />
            Vous avez été invité à rejoindre un foyer.
          </p>
        )}

        {error && (
          <div className={styles.error} role="alert">
            <AlertCircle size={17} strokeWidth={2.2} />
            <span>{error}</span>
          </div>
        )}

        {mode === 'create' ? (
          <form onSubmit={handleCreate} className={styles.form}>
            <Field
              label="Nom du foyer"
              hint="Vous pourrez le renommer et inviter des membres ensuite."
              htmlFor="household-name"
            >
              <Input
                id="household-name"
                value={householdName}
                onChange={(e) => setHouseholdName(e.target.value)}
                placeholder="Ex. Chez Antoine & Marie"
                autoFocus
                disabled={loading}
              />
            </Field>

            <Button type="submit" variant="primary" size="lg" fullWidth loading={loading}>
              Créer le foyer
            </Button>
          </form>
        ) : (
          <form onSubmit={handleJoin} className={styles.form}>
            <Field
              label="Code d’invitation"
              hint="Le code vous a été communiqué par un membre du foyer."
              htmlFor="household-code"
            >
              <Input
                id="household-code"
                value={householdId}
                onChange={(e) => setHouseholdId(e.target.value)}
                placeholder="Collez le code ici"
                autoFocus={!isInviteLink}
                disabled={loading}
                className={styles.codeInput}
              />
            </Field>

            <Button type="submit" variant="primary" size="lg" fullWidth loading={loading}>
              Rejoindre le foyer
            </Button>
          </form>
        )}
      </div>
    </AuthShell>
  );
};

export default HouseholdSetup;
