import { useState, useEffect } from 'react';
import { useHousehold } from '../contexts/HouseholdContext';
import { useAuth } from '../contexts/AuthContext';
import { useIngredients } from '../contexts/IngredientContext';
import { usePermanentItems } from '../contexts/PermanentItemsContext';
import { useToast } from '../contexts/ToastContext';
import {
  Carrot,
  RefreshCw,
  ShoppingCart,
  LogOut,
  Pencil,
  Check,
  X,
  Plus,
  Trash2,
  ChevronRight,
  Copy,
  Smartphone
} from 'lucide-react';
import {
  Page,
  PageHeader,
  Button,
  Avatar,
  Stepper,
  Input,
  Modal,
  EmojiPill
} from '../components/ui';
import styles from './Settings.module.css';

const APP_VERSION = '1.0.0';

const Settings = ({ onNavigate }) => {
  const { household, updateHousehold } = useHousehold();
  const { user, signOut } = useAuth();
  const { ingredients } = useIngredients();
  const { permanentItems } = usePermanentItems();
  const toast = useToast();

  const [isEditingName, setIsEditingName] = useState(false);
  const [householdName, setHouseholdName] = useState(household?.name || '');
  const [defaultServings, setDefaultServings] = useState(household?.defaultServings || 4);
  const [members, setMembers] = useState(household?.members || []);
  const [newMemberName, setNewMemberName] = useState('');
  const [showAddMember, setShowAddMember] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [confirmCache, setConfirmCache] = useState(false);

  useEffect(() => {
    if (household) {
      setHouseholdName(household.name || '');
      setDefaultServings(household.defaultServings || 4);
      setMembers(household.members || []);
    }
  }, [household]);

  const inviteLink = household
    ? `${window.location.origin}${window.location.pathname}?join=${household.id}`
    : '';

  const handleSaveName = async () => {
    if (!householdName.trim()) return;
    try {
      await updateHousehold({ name: householdName.trim() });
      setIsEditingName(false);
      toast.success('Nom du foyer mis à jour');
    } catch (error) {
      console.error('Error updating household name:', error);
      toast.error('Le nom n’a pas pu être mis à jour');
    }
  };

  const handleServingsChange = async (value) => {
    setDefaultServings(value);
    try {
      await updateHousehold({ defaultServings: value });
    } catch (error) {
      console.error('Error updating default servings:', error);
      toast.error('Le réglage n’a pas pu être enregistré');
    }
  };

  const handleAddMember = async () => {
    if (!newMemberName.trim()) return;

    const updated = [
      ...members,
      { id: `member_${Date.now()}`, name: newMemberName.trim(), addedAt: new Date().toISOString() }
    ];

    try {
      await updateHousehold({ members: updated });
      setMembers(updated);
      setNewMemberName('');
      setShowAddMember(false);
      toast.success('Membre ajouté');
    } catch (error) {
      console.error('Error adding member:', error);
      toast.error('Le membre n’a pas pu être ajouté');
    }
  };

  const handleRemoveMember = async (memberId) => {
    const updated = members.filter((m) => m.id !== memberId);
    try {
      await updateHousehold({ members: updated });
      setMembers(updated);
      toast.success('Membre retiré');
    } catch (error) {
      console.error('Error removing member:', error);
      toast.error('Le membre n’a pas pu être retiré');
    }
  };

  const copy = async (value, label) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${label} copié`);
    } catch (error) {
      console.error('Clipboard error:', error);
      toast.error('La copie a échoué');
    }
  };

  const handleClearCache = async () => {
    setConfirmCache(false);

    try {
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map((registration) => registration.unregister()));
      }

      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map((name) => caches.delete(name)));
      }

      localStorage.clear();
      sessionStorage.clear();
      window.location.reload();
    } catch (error) {
      console.error('Error clearing cache:', error);
      toast.error('Le cache n’a pas pu être vidé');
    }
  };

  if (!household) {
    return (
      <Page>
        <PageHeader title="Plus" subtitle="Chargement…" />
      </Page>
    );
  }

  return (
    <Page>
      <PageHeader title="Plus" subtitle="Réglages du foyer et de l’application" />

      <div className={styles.columns}>
        <div className={styles.column}>
          <section className={styles.card}>
            <h2 className={styles.cardLabel}>Pages</h2>
            <button
              type="button"
              className={styles.pageLink}
              onClick={() => onNavigate?.('ingredients')}
            >
              <EmojiPill emoji="🥬" tone="green" size="lg" />
              <span className={styles.pageName}>Ingrédients du foyer</span>
              <span className={styles.pageCount}>
                {ingredients.length} item{ingredients.length > 1 ? 's' : ''}
              </span>
              <ChevronRight size={18} strokeWidth={2} className={styles.pageArrow} />
            </button>
            <button
              type="button"
              className={styles.pageLink}
              onClick={() => onNavigate?.('shopping')}
            >
              <span className={styles.pageIcon}>
                <ShoppingCart size={19} strokeWidth={2} />
              </span>
              <span className={styles.pageName}>Items permanents</span>
              <span className={styles.pageCount}>
                {permanentItems?.length || 0} item{(permanentItems?.length || 0) > 1 ? 's' : ''}
              </span>
              <ChevronRight size={18} strokeWidth={2} className={styles.pageArrow} />
            </button>
            <button
              type="button"
              className={styles.pageLink}
              onClick={() => onNavigate?.('migrate')}
            >
              <span className={styles.pageIcon}>
                <RefreshCw size={19} strokeWidth={2} />
              </span>
              <span className={styles.pageName}>Migration des articles</span>
              <ChevronRight size={18} strokeWidth={2} className={styles.pageArrow} />
            </button>
          </section>

          <section className={styles.card}>
            <h2 className={styles.cardLabel}>Informations du foyer</h2>
            <div className={styles.fieldLabel}>Nom du foyer</div>
            {isEditingName ? (
              <div className={styles.editRow}>
                <Input
                  value={householdName}
                  onChange={(e) => setHouseholdName(e.target.value)}
                  autoFocus
                  aria-label="Nom du foyer"
                />
                <Button variant="primary" icon={Check} onClick={handleSaveName} aria-label="Enregistrer" />
                <Button
                  variant="secondary"
                  icon={X}
                  onClick={() => {
                    setHouseholdName(household.name || '');
                    setIsEditingName(false);
                  }}
                  aria-label="Annuler"
                />
              </div>
            ) : (
              <div className={styles.valueRow}>
                <span className={styles.value}>{household.name}</span>
                <button
                  type="button"
                  className={styles.inlineAction}
                  onClick={() => setIsEditingName(true)}
                  aria-label="Renommer le foyer"
                >
                  <Pencil size={16} strokeWidth={2} />
                </button>
              </div>
            )}
          </section>

          <section className={styles.card}>
            <h2 className={styles.cardLabel}>Inviter des membres</h2>
            <div className={styles.fieldLabel}>Code d’invitation</div>
            <div className={styles.inviteRow}>
              <div className={styles.code}>{household.id}</div>
              <Button variant="primary" icon={Copy} onClick={() => copy(household.id, 'Code')}>
                Copier
              </Button>
            </div>

            <div className={styles.fieldLabel}>Lien d’invitation</div>
            <div className={styles.inviteRow}>
              <div className={styles.link}>{inviteLink}</div>
              <Button variant="secondary" icon={Copy} onClick={() => copy(inviteLink, 'Lien')}>
                Copier
              </Button>
            </div>
          </section>

          <section className={styles.card}>
            <div className={styles.cardHead}>
              <h2 className={styles.cardLabel}>Membres du foyer · {members.length}</h2>
              <Button
                variant="secondary"
                size="sm"
                icon={showAddMember ? X : Plus}
                onClick={() => setShowAddMember(!showAddMember)}
              >
                {showAddMember ? 'Annuler' : 'Ajouter'}
              </Button>
            </div>

            {showAddMember && (
              <div className={styles.editRow}>
                <Input
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  placeholder="Prénom du membre"
                  aria-label="Prénom du membre"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddMember();
                  }}
                />
                <Button variant="primary" onClick={handleAddMember} disabled={!newMemberName.trim()}>
                  Ajouter
                </Button>
              </div>
            )}

            {members.length === 0 ? (
              <p className={styles.hint}>
                Aucun membre listé. Partagez le code d’invitation pour partager le foyer.
              </p>
            ) : (
              <ul className={styles.members}>
                {members.map((member, index) => {
                  const name = typeof member === 'string' ? 'Membre' : member.name || 'Membre';
                  const id = typeof member === 'string' ? member : member.id;

                  return (
                    <li key={id || index} className={styles.member}>
                      <Avatar name={name} index={index} size={38} />
                      <span className={styles.memberName}>{name}</span>
                      {index === 0 && <span className={styles.ownerBadge}>Créateur</span>}
                      {typeof member !== 'string' && (
                        <button
                          type="button"
                          className={styles.memberRemove}
                          onClick={() => handleRemoveMember(member.id)}
                          aria-label={`Retirer ${name}`}
                        >
                          <Trash2 size={15} strokeWidth={2} />
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>

        <div className={styles.column}>
          <section className={styles.card}>
            <h2 className={styles.cardLabel}>Paramètres par défaut</h2>
            <div className={styles.settingRow}>
              <div>
                <div className={styles.settingName}>Portions par défaut</div>
                <p className={styles.hint}>Appliquées aux nouvelles recettes et aux repas ajoutés.</p>
              </div>
              <Stepper
                value={defaultServings}
                onChange={handleServingsChange}
                min={1}
                max={50}
                label="Portions par défaut"
              />
            </div>
          </section>

          <section className={styles.card}>
            <h2 className={styles.cardLabel}>Compte</h2>
            <div className={styles.account}>
              <Avatar src={user?.photoURL} name={user?.displayName || user?.email} size={52} />
              <div className={styles.accountText}>
                <span className={styles.accountName}>{user?.displayName || 'Compte Google'}</span>
                <span className={styles.accountEmail}>{user?.email}</span>
              </div>
            </div>
            <Button variant="danger" icon={LogOut} fullWidth onClick={() => setConfirmLogout(true)}>
              Se déconnecter
            </Button>
          </section>

          <section className={styles.card}>
            <h2 className={styles.cardLabel}>Application</h2>
            <div className={styles.settingRow}>
              <span className={styles.settingName}>Version</span>
              <span className={styles.version}>{APP_VERSION}</span>
            </div>
            <div className={styles.pwaBanner}>
              <Smartphone size={19} strokeWidth={2} />
              <span className={styles.pwaText}>
                Installez Go Gourmet sur l’écran d’accueil depuis le menu de votre navigateur.
              </span>
            </div>
            <Button variant="secondary" icon={RefreshCw} fullWidth onClick={() => setConfirmCache(true)}>
              Vider le cache et recharger
            </Button>
          </section>
        </div>
      </div>

      <Modal
        open={confirmLogout}
        onClose={() => setConfirmLogout(false)}
        title="Se déconnecter ?"
        size="sm"
        footer={
          <>
            <Button variant="secondary" fullWidth onClick={() => setConfirmLogout(false)}>
              Annuler
            </Button>
            <Button variant="danger" fullWidth icon={LogOut} onClick={signOut}>
              Se déconnecter
            </Button>
          </>
        }
      >
        <p className={styles.confirmText}>
          Vous devrez vous reconnecter avec Google pour retrouver le foyer.
        </p>
      </Modal>

      <Modal
        open={confirmCache}
        onClose={() => setConfirmCache(false)}
        title="Vider le cache ?"
        size="sm"
        footer={
          <>
            <Button variant="secondary" fullWidth onClick={() => setConfirmCache(false)}>
              Annuler
            </Button>
            <Button variant="primary" fullWidth icon={RefreshCw} onClick={handleClearCache}>
              Vider et recharger
            </Button>
          </>
        }
      >
        <p className={styles.confirmText}>
          Les fichiers en cache seront supprimés et l’application rechargée dans sa dernière
          version. Vos données du foyer ne sont pas touchées.
        </p>
      </Modal>
    </Page>
  );
};

export default Settings;
