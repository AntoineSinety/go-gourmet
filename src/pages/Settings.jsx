import { useState, useEffect } from 'react';
import { useHousehold } from '../contexts/HouseholdContext';
import { useAuth } from '../contexts/AuthContext';
import { Settings as SettingsIcon, Smartphone, Carrot, RefreshCw, Home, Link, Users, User, Utensils, LogOut, Save, Pencil, Check, X, Plus, Trash2, ChevronRight, Minus } from 'lucide-react';
import styles from './Settings.module.css';

const Settings = ({ onNavigate }) => {
  const { household, updateHousehold } = useHousehold();
  const { user, logout } = useAuth();
  const [isEditingName, setIsEditingName] = useState(false);
  const [householdName, setHouseholdName] = useState(household?.name || '');
  const [defaultServings, setDefaultServings] = useState(household?.defaultServings || 4);
  const [members, setMembers] = useState(household?.members || []);
  const [newMemberName, setNewMemberName] = useState('');
  const [showAddMember, setShowAddMember] = useState(false);

  // Sync local state with household context
  useEffect(() => {
    if (household) {
      setHouseholdName(household.name || '');
      setDefaultServings(household.defaultServings || 4);
      setMembers(household.members || []);
    }
  }, [household]);

  const handleSaveName = async () => {
    if (!householdName.trim()) return;

    try {
      await updateHousehold({ name: householdName.trim() });
      setIsEditingName(false);
    } catch (error) {
      console.error('Error updating household name:', error);
      alert('Erreur lors de la mise à jour du nom');
    }
  };

  const handleSaveDefaultServings = async () => {
    try {
      await updateHousehold({ defaultServings: parseInt(defaultServings) });
      alert('Paramètres sauvegardés !');
    } catch (error) {
      console.error('Error updating default servings:', error);
      alert('Erreur lors de la mise à jour');
    }
  };

  const handleAddMember = async () => {
    if (!newMemberName.trim()) return;

    const newMember = {
      id: `member_${Date.now()}`,
      name: newMemberName.trim(),
      addedAt: new Date().toISOString()
    };

    const updatedMembers = [...members, newMember];

    try {
      await updateHousehold({ members: updatedMembers });
      setMembers(updatedMembers);
      setNewMemberName('');
      setShowAddMember(false);
    } catch (error) {
      console.error('Error adding member:', error);
      alert('Erreur lors de l\'ajout du membre');
    }
  };

  const handleRemoveMember = async (memberId) => {
    const updatedMembers = members.filter(m => m.id !== memberId);

    try {
      await updateHousehold({ members: updatedMembers });
      setMembers(updatedMembers);
    } catch (error) {
      console.error('Error removing member:', error);
      alert('Erreur lors de la suppression du membre');
    }
  };

  const handleLogout = async () => {
    if (confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
      await logout();
    }
  };

  const handleClearCache = async () => {
    if (!confirm('Vider le cache et recharger l\'application ? Cela permettra de récupérer la dernière version.')) {
      return;
    }

    try {
      // Unregister all service workers
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
          await registration.unregister();
        }
      }

      // Clear all caches
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
      }

      // Clear localStorage and sessionStorage
      localStorage.clear();
      sessionStorage.clear();

      // Reload the page
      window.location.reload(true);
    } catch (error) {
      console.error('Error clearing cache:', error);
      alert('Erreur lors du vidage du cache');
    }
  };

  if (!household) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Chargement...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <h1>Plus</h1>
        <p className={styles.subtitle}>Paramètres et options supplémentaires</p>
      </div>

      {/* Pages Section */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}><Smartphone size={18} style={{ verticalAlign: 'middle', marginRight: '8px' }} />Pages</h2>
        <div className={styles.card}>
          <button
            className={styles.pageButton}
            onClick={() => onNavigate && onNavigate('ingredients')}
          >
            <div className={styles.pageInfo}>
              <span className={styles.pageIcon}><Carrot size={24} /></span>
              <div className={styles.pageText}>
                <span className={styles.pageName}>Ingrédients</span>
                <span className={styles.pageDescription}>Gérer vos ingrédients</span>
              </div>
            </div>
            <span className={styles.pageArrow}><ChevronRight size={20} /></span>
          </button>
          <button
            className={styles.pageButton}
            onClick={() => onNavigate && onNavigate('migrate')}
          >
            <div className={styles.pageInfo}>
              <span className={styles.pageIcon}><RefreshCw size={24} /></span>
              <div className={styles.pageText}>
                <span className={styles.pageName}>Migration articles</span>
                <span className={styles.pageDescription}>Récupérer les articles permanents</span>
              </div>
            </div>
            <span className={styles.pageArrow}><ChevronRight size={20} /></span>
          </button>
        </div>
      </div>

      {/* Household Info */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}><Home size={18} style={{ verticalAlign: 'middle', marginRight: '8px' }} />Informations du foyer</h2>

        <div className={styles.card}>
          <div className={styles.cardRow}>
            <div className={styles.label}>Nom du foyer</div>
            {!isEditingName ? (
              <div className={styles.valueRow}>
                <span className={styles.value}>{household.name}</span>
                <button
                  onClick={() => {
                    setHouseholdName(household.name);
                    setIsEditingName(true);
                  }}
                  className={styles.editButton}
                >
                  <Pencil size={14} style={{ marginRight: '6px' }} />Modifier
                </button>
              </div>
            ) : (
              <div className={styles.editRow}>
                <input
                  type="text"
                  value={householdName}
                  onChange={(e) => setHouseholdName(e.target.value)}
                  className={styles.input}
                  autoFocus
                />
                <button onClick={handleSaveName} className={styles.saveButton}>
                  <Check size={14} style={{ marginRight: '4px' }} />Sauvegarder
                </button>
                <button
                  onClick={() => {
                    setIsEditingName(false);
                    setHouseholdName(household.name);
                  }}
                  className={styles.cancelButton}
                >
                  <X size={16} />
                </button>
              </div>
            )}
          </div>

          <div className={styles.cardRow}>
            <div className={styles.label}>Créé le</div>
            <div className={styles.value}>
              {new Date(household.createdAt).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Invite Link */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}><Link size={18} style={{ verticalAlign: 'middle', marginRight: '8px' }} />Inviter des membres</h2>
        <div className={styles.card}>
          <p className={styles.inviteDescription}>
            Partagez ce lien pour inviter quelqu'un à rejoindre votre foyer
          </p>
          <div className={styles.inviteLinkContainer}>
            <input
              type="text"
              value={`${window.location.origin}${window.location.pathname}?join=${household.id}`}
              readOnly
              className={styles.inviteLinkInput}
              onClick={(e) => e.target.select()}
            />
            <button
              onClick={async () => {
                const link = `${window.location.origin}${window.location.pathname}?join=${household.id}`;

                // Try to use native share API first
                if (navigator.share) {
                  try {
                    await navigator.share({
                      title: 'Invitation Go Gourmet',
                      text: `Rejoignez mon foyer "${household.name}" sur Go Gourmet !`,
                      url: link
                    });
                  } catch (err) {
                    // User cancelled or error - fallback to clipboard
                    if (err.name !== 'AbortError') {
                      navigator.clipboard.writeText(link);
                      alert('Lien copié dans le presse-papiers !');
                    }
                  }
                } else {
                  // Fallback for browsers without share API
                  navigator.clipboard.writeText(link);
                  alert('Lien copié dans le presse-papiers !');
                }
              }}
              className={styles.shareButton}
            >
              <Link size={16} style={{ marginRight: '6px' }} />Partager
            </button>
          </div>
        </div>
      </div>

      {/* Members */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}><Users size={18} style={{ verticalAlign: 'middle', marginRight: '8px' }} />Membres du foyer</h2>
          <button
            onClick={() => setShowAddMember(!showAddMember)}
            className={styles.addButton}
          >
            {showAddMember ? <><X size={14} style={{ marginRight: '4px' }} />Annuler</> : <><Plus size={14} style={{ marginRight: '4px' }} />Ajouter</>}
          </button>
        </div>

        {showAddMember && (
          <div className={styles.addMemberForm}>
            <input
              type="text"
              value={newMemberName}
              onChange={(e) => setNewMemberName(e.target.value)}
              placeholder="Nom du membre"
              className={styles.input}
              autoFocus
            />
            <button onClick={handleAddMember} className={styles.submitButton}>
              Ajouter
            </button>
          </div>
        )}

        <div className={styles.membersList}>
          {members.length === 0 ? (
            <div className={styles.emptyState}>
              Aucun membre ajouté
            </div>
          ) : (
            members.map(member => (
              <div key={member.id} className={styles.memberCard}>
                <div className={styles.memberInfo}>
                  <span className={styles.memberIcon}><User size={20} /></span>
                  <span className={styles.memberName}>{member.name}</span>
                </div>
                <button
                  onClick={() => handleRemoveMember(member.id)}
                  className={styles.removeButton}
                  title="Retirer ce membre"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Default Settings */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}><Utensils size={18} style={{ verticalAlign: 'middle', marginRight: '8px' }} />Paramètres par défaut</h2>

        <div className={styles.card}>
          <div className={styles.cardRow}>
            <div>
              <div className={styles.label}>Nombre de portions par défaut</div>
              <p className={styles.hint}>
                Utilisé lors de l'ajout de nouveaux repas au planning
              </p>
            </div>
            <div className={styles.servingsControl}>
              <button
                onClick={() => setDefaultServings(Math.max(1, defaultServings - 1))}
                className={styles.servingsButton}
              >
                −
              </button>
              <span className={styles.servingsValue}>{defaultServings}</span>
              <button
                onClick={() => setDefaultServings(defaultServings + 1)}
                className={styles.servingsButton}
              >
                +
              </button>
            </div>
          </div>
          <button onClick={handleSaveDefaultServings} className={styles.saveSettingsButton}>
            <Save size={16} style={{ marginRight: '6px' }} />Sauvegarder les paramètres
          </button>
        </div>
      </div>

      {/* Account */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}><User size={18} style={{ verticalAlign: 'middle', marginRight: '8px' }} />Compte</h2>

        <div className={styles.card}>
          <div className={styles.cardRow}>
            <div className={styles.label}>Email</div>
            <div className={styles.value}>{user?.email}</div>
          </div>

          <button onClick={handleLogout} className={styles.logoutButton}>
            <LogOut size={16} style={{ marginRight: '6px' }} />Se déconnecter
          </button>
        </div>
      </div>

      {/* Application */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}><Smartphone size={18} style={{ verticalAlign: 'middle', marginRight: '8px' }} />Application</h2>

        <div className={styles.card}>
          <div className={styles.cardRow}>
            <div>
              <div className={styles.label}>Vider le cache</div>
              <p className={styles.hint}>
                Supprime tous les fichiers en cache et recharge l'application pour récupérer la dernière version
              </p>
            </div>
          </div>
          <button onClick={handleClearCache} className={styles.logoutButton}>
            <RefreshCw size={16} style={{ marginRight: '6px' }} />Vider le cache et recharger
          </button>
        </div>
      </div>

      {/* App Info */}
      <div className={styles.footer}>
        <p className={styles.appName}><Utensils size={16} style={{ verticalAlign: 'middle', marginRight: '6px' }} />Go Gourmet</p>
        <p className={styles.version}>Version 1.0.0</p>
      </div>
    </div>
  );
};

export default Settings;
