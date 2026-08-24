import { useMemo } from 'react';
import { X, Check, PartyPopper } from 'lucide-react';
import { getAisle } from '../utils/shoppingAisles';
import { itemKey } from '../utils/shoppingList';
import { formatQuantity, getUnitLabel } from '../utils/units';
import { toneVars } from '../utils/palette';
import { Button, Checkbox, EmojiPill } from '../components/ui';
import styles from './ShoppingMode.module.css';

/**
 * Mode Course : plein écran, pensé pour une main, en marchant, en magasin.
 * Contrastes marqués, cibles de 68 px, progression collante en haut.
 */
const ShoppingMode = ({ aisles, checked, totalItems, checkedCount, onToggle, onExit }) => {
  const percent = totalItems > 0 ? Math.round((checkedCount / totalItems) * 100) : 0;
  const remaining = totalItems - checkedCount;
  const done = totalItems > 0 && remaining === 0;

  // On garde les articles cochés à leur place, barrés : en rayon, on veut
  // vérifier d'un coup d'œil ce qu'on vient de prendre.
  const sections = useMemo(() => {
    const byCategory = new Map();

    aisles.forEach(({ category, items }) => {
      byCategory.set(category, [...items]);
    });

    checked.forEach((item) => {
      const list = byCategory.get(item.category) || [];
      list.push({ ...item, done: true });
      byCategory.set(item.category, list);
    });

    return Array.from(byCategory.entries()).map(([category, items]) => ({
      category,
      items,
      remaining: items.filter((item) => !item.done).length
    }));
  }, [aisles, checked]);

  const nextAisle = sections.find((section) => section.remaining > 0);

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <button type="button" className={styles.exit} onClick={onExit} aria-label="Quitter le mode course">
            <X size={22} strokeWidth={2.2} />
          </button>
          <div className={styles.headerText}>
            <div className={styles.title}>Mode Course</div>
            <div className={`${styles.subtitle} ${done ? styles.subtitleDone : ''}`}>
              {done ? 'Tout est coché' : `${remaining} article${remaining > 1 ? 's' : ''} restant${remaining > 1 ? 's' : ''}`}
            </div>
          </div>
          <div className={`${styles.percent} ${done ? styles.percentDone : ''}`}>
            {percent}
            <span className={styles.percentSign}>%</span>
          </div>
        </div>

        <div className={styles.track}>
          <div
            className={`${styles.bar} ${done ? styles.barDone : ''}`}
            style={{ width: `${percent}%` }}
            role="progressbar"
            aria-valuenow={checkedCount}
            aria-valuemin={0}
            aria-valuemax={totalItems}
          />
        </div>
      </header>

      {done ? (
        <div className={styles.done}>
          <span className={styles.doneBadge}>
            <PartyPopper size={40} strokeWidth={1.8} />
          </span>
          <h1 className={styles.doneTitle}>Courses terminées</h1>
          <p className={styles.doneText}>
            {totalItems} article{totalItems > 1 ? 's' : ''} sur {totalItems}. La liste se
            régénérera avec le planning de la semaine suivante.
          </p>
        </div>
      ) : (
        <div className={styles.body}>
          {sections.map(({ category, items, remaining: left }) => {
            const aisle = getAisle(category);

            return (
              <section key={category} className={styles.section} style={toneVars(aisle.tone)}>
                <header className={styles.sectionHead}>
                  <EmojiPill emoji={aisle.icon} tone={aisle.tone} size="lg" />
                  <h2 className={styles.sectionTitle}>{aisle.label}</h2>
                  <span className={styles.sectionCount}>
                    {items.length - left}/{items.length}
                  </span>
                </header>

                <ul className={styles.items}>
                  {items.map((item, index) => {
                    const quantity = formatQuantity(item.quantity);

                    return (
                      <li key={`${itemKey(category, item)}-${index}`}>
                        <button
                          type="button"
                          className={`${styles.item} ${item.done ? styles.itemDone : ''}`}
                          onClick={() => onToggle(category, item)}
                          aria-pressed={!!item.done}
                        >
                          <Checkbox checked={!!item.done} size="lg" />
                          <span className={styles.itemName}>{item.name}</span>
                          {quantity && (
                            <span className={styles.itemQuantity}>
                              {quantity} {getUnitLabel(item.unit)}
                            </span>
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}
        </div>
      )}

      <footer className={styles.footer}>
        {done ? (
          <Button variant="primary" size="lg" fullWidth onClick={onExit} className={styles.exitButton}>
            Quitter le mode course
          </Button>
        ) : (
          <>
            <span className={styles.nextAisle}>
              {nextAisle ? (
                <>
                  Rayon suivant : {getAisle(nextAisle.category).icon}{' '}
                  {getAisle(nextAisle.category).label}
                </>
              ) : (
                <>
                  <Check size={14} strokeWidth={2.4} /> Tous les rayons sont faits
                </>
              )}
            </span>
            <Button variant="secondary" size="lg" onClick={onExit} className={styles.finishButton}>
              Terminer
            </Button>
          </>
        )}
      </footer>
    </div>
  );
};

export default ShoppingMode;
