import { BookOpen, Calendar, ShoppingCart, MoreHorizontal, Utensils } from 'lucide-react';
import { useHousehold } from '../contexts/HouseholdContext';
import Avatar from './ui/Avatar';
import styles from './AppNav.module.css';

const TABS = [
  { id: 'recipes', label: 'Recettes', Icon: BookOpen },
  { id: 'planning', label: 'Planning', Icon: Calendar },
  { id: 'shopping', label: 'Courses', Icon: ShoppingCart },
  { id: 'settings', label: 'Plus', Icon: MoreHorizontal }
];

/**
 * Navigation principale : barre horizontale en haut sur desktop,
 * tab bar en bas sur mobile. L'onglet Courses porte le nombre
 * d'articles restant a cocher.
 */
/** Les membres sont stockés soit en objet, soit en simple uid selon leur origine. */
const normalizeMember = (member, index) =>
  typeof member === 'string'
    ? { key: member, name: 'Membre', photoURL: null }
    : {
        key: member?.id || member?.uid || index,
        name: member?.name || member?.displayName || 'Membre',
        photoURL: member?.photoURL || null
      };

const AppNav = ({ currentView, onNavigate, shoppingCount = 0 }) => {
  const { household } = useHousehold();
  const members = (household?.members || []).map(normalizeMember);

  const badgeFor = (id) => (id === 'shopping' && shoppingCount > 0 ? shoppingCount : null);

  return (
    <>
      <header className={styles.header}>
        <button type="button" className={styles.logo} onClick={() => onNavigate('recipes')}>
          <span className={styles.logoMark}>
            <Utensils size={20} strokeWidth={2} />
          </span>
          <span className={styles.logoText}>Go Gourmet</span>
        </button>

        <nav className={styles.desktopNav} aria-label="Navigation principale">
          {TABS.map(({ id, label, Icon }) => {
            const badge = badgeFor(id);
            return (
              <button
                key={id}
                type="button"
                onClick={() => onNavigate(id)}
                className={`${styles.navItem} ${currentView === id ? styles.active : ''}`}
                aria-current={currentView === id ? 'page' : undefined}
              >
                <Icon size={18} strokeWidth={2} />
                <span>{label}</span>
                {badge && <span className={styles.navBadge}>{badge}</span>}
              </button>
            );
          })}
        </nav>

        <div className={styles.household}>
          {household?.name && <span className={styles.householdName}>{household.name}</span>}
          <div className={styles.avatars}>
            {members.slice(0, 3).map((member, index) => (
              <Avatar
                key={member.key}
                src={member.photoURL}
                name={member.name}
                index={index}
                size={34}
                className={styles.avatar}
              />
            ))}
          </div>
        </div>
      </header>

      <nav className={styles.mobileNav} aria-label="Navigation principale">
        {TABS.map(({ id, label, Icon }) => {
          const isActive = currentView === id;
          const badge = badgeFor(id);
          return (
            <button
              key={id}
              type="button"
              onClick={() => onNavigate(id)}
              className={`${styles.mobileItem} ${isActive ? styles.mobileActive : ''}`}
              aria-current={isActive ? 'page' : undefined}
            >
              <span className={styles.mobileIcon}>
                <Icon size={23} strokeWidth={isActive ? 2.4 : 2} />
                {badge && <span className={styles.mobileBadge}>{badge}</span>}
              </span>
              <span className={styles.mobileLabel}>{label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
};

export default AppNav;
