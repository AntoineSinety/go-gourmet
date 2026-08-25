import { useState, useEffect, useMemo, useRef } from 'react';
import { useMealPlan } from '../contexts/MealPlanContext';
import { useRecipes } from '../contexts/RecipeContext';
import { usePermanentItems } from '../contexts/PermanentItemsContext';
import { useToast } from '../contexts/ToastContext';
import { buildShoppingList, itemKey, countTotal } from '../utils/shoppingList';
import { SHOPPING_AISLES, CHECKED_AISLE, AISLE_NAMES, getAisle } from '../utils/shoppingAisles';
import { UNITS, formatQuantity, getUnitLabel } from '../utils/units';
import { toneVars } from '../utils/palette';
import {
  ShoppingCart,
  Plus,
  MoreVertical,
  CheckSquare,
  Square,
  Trash2,
  ClipboardList,
  X
} from 'lucide-react';
import ShoppingMode from './ShoppingMode';
import {
  Page,
  PageHeader,
  Button,
  Checkbox,
  Progress,
  EmojiPill,
  SectionHeader,
  EmptyState,
  Skeleton,
  Field,
  Input,
  Select
} from '../components/ui';
import styles from './ShoppingList.module.css';

const emptyItem = () => ({ name: '', category: 'Autres', quantity: '', unit: 'piece' });

const ShoppingList = () => {
  const { mealPlan, loading: mealPlanLoading, setCheckedItems } = useMealPlan();
  const { recipes, loading: recipesLoading } = useRecipes();
  const {
    permanentItems,
    loading: permanentItemsLoading,
    addPermanentItem,
    deletePermanentItem
  } = usePermanentItems();
  const toast = useToast();

  const [checkedItems, setLocalChecked] = useState({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [newItem, setNewItem] = useState(emptyItem);
  const [shoppingMode, setShoppingMode] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [collapsed, setCollapsed] = useState({});
  const menuRef = useRef(null);

  useEffect(() => {
    if (mealPlan?.checkedItems) setLocalChecked(mealPlan.checkedItems);
  }, [mealPlan]);

  useEffect(() => {
    if (!menuOpen) return undefined;
    const onPointerDown = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [menuOpen]);

  const loading = mealPlanLoading || recipesLoading || permanentItemsLoading;

  const shoppingList = useMemo(
    () => buildShoppingList(mealPlan, recipes, permanentItems, checkedItems),
    [mealPlan, recipes, permanentItems, checkedItems]
  );

  // Les articles cochés quittent leur rayon pour la section « Cochés » en fin de liste.
  const { aisles, checked } = useMemo(() => {
    const done = [];
    const remaining = shoppingList
      .map(({ category, items }) => {
        const open = [];
        items.forEach((item) => {
          if (checkedItems[itemKey(category, item)]) done.push({ ...item, category });
          else open.push(item);
        });
        return { category, items: open, total: items.length, checked: items.length - open.length };
      })
      .filter((aisle) => aisle.items.length > 0);

    return { aisles: remaining, checked: done };
  }, [shoppingList, checkedItems]);

  const totalItems = countTotal(shoppingList);
  const checkedCount = checked.length;
  const percent = totalItems > 0 ? Math.round((checkedCount / totalItems) * 100) : 0;
  const remainingCount = totalItems - checkedCount;

  /**
   * N'envoie que les articles touchés : deux personnes qui cochent en même
   * temps dans le magasin ne s'effacent plus mutuellement.
   *
   * @param {Object} changes - { [clé] : true pour cocher, null pour décocher }
   */
  const persist = async (changes) => {
    // Affichage optimiste, puis écriture du seul delta.
    setLocalChecked((current) => {
      const next = { ...current };
      Object.entries(changes).forEach(([key, value]) => {
        if (value) next[key] = true;
        else delete next[key];
      });
      return next;
    });

    try {
      await setCheckedItems(changes);
    } catch (error) {
      console.error('Error updating checked items:', error);
      toast.error('Les coches n’ont pas pu être enregistrées');
    }
  };

  const toggleItem = (category, item) => {
    const key = itemKey(category, item);
    persist({ [key]: checkedItems[key] ? null : true });
  };

  const setAll = (value, onlyPermanent = false) => {
    const changes = {};

    shoppingList.forEach(({ category, items }) => {
      items.forEach((item) => {
        if (onlyPermanent && !item.isPermanent) return;
        const key = itemKey(category, item);
        // Inutile d'écrire ce qui est déjà dans l'état voulu.
        if (value && !checkedItems[key]) changes[key] = true;
        if (!value && checkedItems[key]) changes[key] = null;
      });
    });

    setMenuOpen(false);
    if (Object.keys(changes).length) persist(changes);
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!newItem.name.trim()) return;

    try {
      await addPermanentItem({
        name: newItem.name.trim(),
        category: newItem.category,
        quantity: newItem.quantity ? parseFloat(newItem.quantity) : null,
        unit: newItem.unit
      });
      toast.success(`« ${newItem.name.trim()} » ajouté à la liste`);
      setNewItem(emptyItem());
      setShowAddForm(false);
    } catch (error) {
      console.error('Error adding permanent item:', error);
      toast.error("L'article n'a pas pu être ajouté");
    }
  };

  const handleDeletePermanent = async (item) => {
    try {
      await deletePermanentItem(item.id);
      setLocalChecked((prev) => {
        const next = { ...prev };
        delete next[item.id];
        return next;
      });
      toast.success(`« ${item.name} » retiré`);
    } catch (error) {
      console.error('Error deleting permanent item:', error);
      toast.error("L'article n'a pas pu être retiré");
    }
  };

  if (shoppingMode) {
    return (
      <ShoppingMode
        aisles={aisles}
        checked={checked}
        totalItems={totalItems}
        checkedCount={checkedCount}
        onToggle={toggleItem}
        onExit={() => setShoppingMode(false)}
      />
    );
  }

  if (loading) {
    return (
      <Page>
        <PageHeader title="Liste de Courses" subtitle="Génération de la liste…" />
        <Skeleton variant="block" height={110} />
        <Skeleton variant="block" height={180} />
        <Skeleton variant="block" height={180} />
      </Page>
    );
  }

  const renderItem = (category, item, index) => {
    const key = itemKey(category, item);
    const isChecked = !!checkedItems[key];
    const quantity = formatQuantity(item.quantity);
    const origin = item.isPermanent
      ? 'item récurrent du foyer'
      : item.fromRecipes?.length
        ? `pour ${[...new Set(item.fromRecipes)].join(', ')}`
        : null;

    return (
      <li key={`${key}-${index}`} className={`${styles.item} ${isChecked ? styles.itemChecked : ''}`}>
        <button
          type="button"
          className={styles.itemMain}
          onClick={() => toggleItem(category, item)}
          aria-pressed={isChecked}
        >
          <Checkbox checked={isChecked} />
          <span className={styles.itemText}>
            <span className={styles.itemName}>
              {item.name}
              {item.isPermanent && <span className={styles.permanentBadge}>Permanent</span>}
            </span>
            {origin && <span className={styles.itemOrigin}>{origin}</span>}
          </span>
          {quantity && (
            <span className={styles.itemQuantity}>
              {quantity} {getUnitLabel(item.unit)}
            </span>
          )}
        </button>

        {item.isPermanent && (
          <button
            type="button"
            className={styles.itemDelete}
            onClick={() => handleDeletePermanent(item)}
            aria-label={`Supprimer ${item.name} des items permanents`}
          >
            <Trash2 size={16} strokeWidth={2} />
          </button>
        )}
      </li>
    );
  };

  return (
    <Page>
      <PageHeader
        title="Liste de Courses"
        subtitle={`Générée automatiquement à partir de votre planning${mealPlan ? ` · Semaine ${mealPlan.weekNumber}` : ''}`}
        actions={
          <>
            <Button
              variant="primary"
              icon={ShoppingCart}
              onClick={() => setShoppingMode(true)}
              disabled={totalItems === 0}
              className={styles.modeDesktop}
            >
              Mode Course
            </Button>
            <Button
              variant="secondary"
              icon={showAddForm ? X : Plus}
              onClick={() => setShowAddForm(!showAddForm)}
              className={styles.addDesktop}
            >
              {showAddForm ? 'Annuler' : 'Ajouter'}
            </Button>
            <div className={styles.menuWrap} ref={menuRef}>
              <Button
                variant="icon"
                icon={MoreVertical}
                onClick={() => setMenuOpen(!menuOpen)}
                aria-label="Actions sur la liste"
                aria-expanded={menuOpen}
                className={menuOpen ? styles.menuButtonOpen : ''}
              />
              {menuOpen && (
                <div className={styles.menu} role="menu">
                  <button type="button" className={styles.menuItem} onClick={() => setAll(true)}>
                    <CheckSquare size={16} strokeWidth={2} />
                    Tout cocher
                  </button>
                  <button type="button" className={styles.menuItem} onClick={() => setAll(false)}>
                    <Square size={16} strokeWidth={2} />
                    Tout décocher
                  </button>
                  <div className={styles.menuDivider} />
                  <button
                    type="button"
                    className={styles.menuItem}
                    onClick={() => setAll(true, true)}
                  >
                    <CheckSquare size={16} strokeWidth={2} />
                    Cocher les items perso
                  </button>
                  <button
                    type="button"
                    className={styles.menuItem}
                    onClick={() => setAll(false, true)}
                  >
                    <Square size={16} strokeWidth={2} />
                    Décocher les items perso
                  </button>
                </div>
              )}
            </div>
          </>
        }
      />

      <div className={styles.layout}>
        <div className={styles.main}>
          <div className={styles.statsCard}>
            <div className={styles.statsTop}>
              <div>
                <div className={styles.statsValue}>
                  {checkedCount}
                  <span className={styles.statsTotal}> / {totalItems}</span>
                </div>
                <div className={styles.statsLabel}>articles cochés</div>
              </div>
              <div className={styles.statsRight}>
                <div className={styles.statsPercent}>{percent} %</div>
                <div className={styles.statsLabel}>
                  {aisles.length} rayon{aisles.length > 1 ? 's' : ''}
                </div>
              </div>
            </div>
            <Progress
              value={checkedCount}
              max={totalItems || 1}
              tone={totalItems > 0 && checkedCount === totalItems ? 'success' : 'accent'}
            />
          </div>

          <div className={styles.mobileActions}>
            <Button
              variant="primary"
              size="lg"
              icon={ShoppingCart}
              onClick={() => setShoppingMode(true)}
              disabled={totalItems === 0}
              className={styles.modeMobile}
            >
              Mode Course
            </Button>
            <Button
              variant="secondary"
              size="lg"
              icon={showAddForm ? X : Plus}
              onClick={() => setShowAddForm(!showAddForm)}
              aria-label={showAddForm ? 'Annuler l’ajout' : 'Ajouter un article'}
              className={styles.addMobile}
            />
          </div>

          {showAddForm && (
            <form className={styles.addForm} onSubmit={handleAddItem}>
              <div className={styles.addFormGrid}>
                <Field label="Article" required className={styles.addName}>
                  <Input
                    value={newItem.name}
                    onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                    placeholder="Ex. Crevettes"
                    autoFocus
                  />
                </Field>
                <Field label="Rayon" className={styles.addAisle}>
                  <Select
                    value={newItem.category}
                    onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                  >
                    {AISLE_NAMES.map((aisle) => (
                      <option key={aisle} value={aisle}>
                        {getAisle(aisle).icon} {aisle}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Quantité" className={styles.addQuantity}>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    inputMode="decimal"
                    value={newItem.quantity}
                    onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value })}
                    placeholder="300"
                  />
                </Field>
                <Field label="Unité" className={styles.addUnit}>
                  <Select
                    value={newItem.unit}
                    onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                  >
                    {UNITS.map((unit) => (
                      <option key={unit.id} value={unit.id}>
                        {unit.label}
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>
              <Button type="submit" variant="primary" disabled={!newItem.name.trim()}>
                Ajouter à la liste
              </Button>
              <p className={styles.addHint}>
                Les articles ajoutés à la main reviennent dans chaque liste, jusqu’à leur
                suppression.
              </p>
            </form>
          )}

          {totalItems === 0 ? (
            <EmptyState
              icon={ClipboardList}
              title="Liste vide"
              description="Remplissez le planning de la semaine : la liste de courses se génère toute seule, rayon par rayon."
            />
          ) : (
            <div className={styles.aisles}>
              {aisles.map(({ category, items, total, checked: aisleChecked }) => {
                const aisle = getAisle(category);
                const isCollapsed = collapsed[category];

                return (
                  <section key={category} className={styles.aisle} style={toneVars(aisle.tone)}>
                    <div className={styles.aisleHead}>
                      <SectionHeader
                        emoji={aisle.icon}
                        tone={aisle.tone}
                        title={aisle.label}
                        collapsible
                        collapsed={isCollapsed}
                        onToggle={() =>
                          setCollapsed((prev) => ({ ...prev, [category]: !prev[category] }))
                        }
                        actions={
                          <span className={styles.aisleCount}>
                            {aisleChecked}/{total}
                          </span>
                        }
                      />
                    </div>
                    {!isCollapsed && (
                      <ul className={styles.items}>
                        {items.map((item, index) => renderItem(category, item, index))}
                      </ul>
                    )}
                  </section>
                );
              })}

              {checked.length > 0 && (
                <section className={styles.aisle} style={toneVars(CHECKED_AISLE.tone)}>
                  <div className={styles.aisleHead}>
                    <SectionHeader
                      emoji={CHECKED_AISLE.icon}
                      tone={CHECKED_AISLE.tone}
                      title={CHECKED_AISLE.label}
                      collapsible
                      collapsed={collapsed.__checked}
                      onToggle={() =>
                        setCollapsed((prev) => ({ ...prev, __checked: !prev.__checked }))
                      }
                      actions={<span className={styles.aisleCount}>{checked.length}</span>}
                    />
                  </div>
                  {!collapsed.__checked && (
                    <ul className={styles.items}>
                      {checked.map((item, index) => renderItem(item.category, item, index))}
                    </ul>
                  )}
                </section>
              )}
            </div>
          )}
        </div>

        <aside className={styles.sidebar}>
          <div className={styles.sideCard}>
            <div className={styles.sideLabel}>Rayons</div>
            <div className={styles.sideAisles}>
              {SHOPPING_AISLES.map((aisle) => {
                const source = shoppingList.find((entry) => entry.category === aisle.id);
                if (!source) return null;
                const done = source.items.filter(
                  (item) => checkedItems[itemKey(aisle.id, item)]
                ).length;

                return (
                  <div key={aisle.id} className={styles.sideAisle}>
                    <EmojiPill emoji={aisle.icon} tone={aisle.tone} size="sm" />
                    <span className={styles.sideAisleName}>{aisle.label}</span>
                    <span className={styles.sideAisleCount}>
                      {done}/{source.items.length}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className={styles.sideCard}>
            <div className={styles.sideLabel}>Provenance</div>
            <p className={styles.sideText}>
              Les quantités sont agrégées par ingrédient et converties automatiquement. Les extras
              de la semaine et les items permanents rejoignent la liste sans provenance de recette.
            </p>
            {remainingCount > 0 && (
              <p className={styles.sideRemaining}>
                {remainingCount} article{remainingCount > 1 ? 's' : ''} restant
                {remainingCount > 1 ? 's' : ''}
              </p>
            )}
          </div>
        </aside>
      </div>
    </Page>
  );
};

export default ShoppingList;
