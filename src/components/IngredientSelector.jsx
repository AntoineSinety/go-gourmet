import { useState, useMemo, useRef, useEffect } from 'react';
import { Search, Plus, Check } from 'lucide-react';
import { useIngredients, INGREDIENT_CATEGORIES } from '../contexts/IngredientContext';
import { useToast } from '../contexts/ToastContext';
import { getUnitLabel } from '../utils/units';
import EmojiPill from './ui/EmojiPill';
import { Select } from './ui/Field';
import Button from './ui/Button';
import styles from './IngredientSelector.module.css';

const MAX_RESULTS = 8;

const normalize = (value) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');

/**
 * Recherche dans le catalogue d'ingrédients du foyer, avec création à la volée.
 * Le champ reste dans le flux du formulaire : pas de modale intercalée.
 */
const IngredientSelector = ({ onSelect, onDeselect, selectedIngredients = [] }) => {
  const { ingredients, addIngredient } = useIngredients();
  const toast = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newCategory, setNewCategory] = useState('fruits-legumes');
  const [saving, setSaving] = useState(false);
  const wrapRef = useRef(null);

  const selectedIds = useMemo(
    () => selectedIngredients.map((ing) => ing.ingredientId || ing.id),
    [selectedIngredients]
  );

  const results = useMemo(() => {
    const query = normalize(searchTerm.trim());
    if (!query) return [];
    return ingredients
      .filter((ing) => normalize(ing.name).includes(query))
      .slice(0, MAX_RESULTS);
  }, [ingredients, searchTerm]);

  const exactMatch = useMemo(
    () =>
      ingredients.some((ing) => normalize(ing.name) === normalize(searchTerm.trim())),
    [ingredients, searchTerm]
  );

  const canCreate = searchTerm.trim().length >= 2 && !exactMatch;

  // Referme la liste quand on clique ailleurs.
  useEffect(() => {
    if (!open) return undefined;

    const onPointerDown = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
        setCreating(false);
      }
    };

    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  const handleToggle = (ingredient) => {
    if (selectedIds.includes(ingredient.id)) {
      const selected = selectedIngredients.find(
        (ing) => (ing.ingredientId || ing.id) === ingredient.id
      );
      onDeselect?.(selected);
      return;
    }

    onSelect(ingredient);
    setSearchTerm('');
    setOpen(false);
  };

  const handleCreate = async () => {
    const name = searchTerm.trim();
    if (!name) return;

    setSaving(true);
    try {
      const created = await addIngredient({ name, category: newCategory });
      onSelect(created);
      toast.success(`« ${name} » ajouté au catalogue du foyer`);
      setSearchTerm('');
      setCreating(false);
      setOpen(false);
    } catch (error) {
      console.error('Error adding ingredient:', error);
      toast.error("Impossible de créer l'ingrédient");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.wrap} ref={wrapRef}>
      <div className={`${styles.field} ${open ? styles.fieldOpen : ''}`}>
        <Search size={18} strokeWidth={2} className={styles.icon} />
        <input
          type="text"
          className={styles.input}
          placeholder="Rechercher dans le catalogue du foyer…"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setOpen(true);
            setCreating(false);
          }}
          onFocus={() => setOpen(true)}
        />
        {canCreate && !creating && (
          <button type="button" className={styles.createHint} onClick={() => setCreating(true)}>
            <Plus size={13} strokeWidth={2.5} />
            créer « {searchTerm.trim()} »
          </button>
        )}
      </div>

      {open && (creating || searchTerm.trim()) && (
        <div className={styles.dropdown}>
          {creating ? (
            <div className={styles.createForm}>
              <div className={styles.createTitle}>
                Nouvel ingrédient · <strong>{searchTerm.trim()}</strong>
              </div>
              <Select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                aria-label="Catégorie de l'ingrédient"
              >
                {INGREDIENT_CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.icon} {cat.label}
                  </option>
                ))}
              </Select>
              <div className={styles.createActions}>
                <Button variant="ghost" size="sm" onClick={() => setCreating(false)} disabled={saving}>
                  Annuler
                </Button>
                <Button variant="primary" size="sm" loading={saving} onClick={handleCreate}>
                  Créer et ajouter
                </Button>
              </div>
            </div>
          ) : results.length > 0 ? (
            <ul className={styles.results}>
              {results.map((ingredient) => {
                const category =
                  INGREDIENT_CATEGORIES.find((c) => c.id === ingredient.category) ||
                  INGREDIENT_CATEGORIES[INGREDIENT_CATEGORIES.length - 1];
                const isSelected = selectedIds.includes(ingredient.id);

                return (
                  <li key={ingredient.id}>
                    <button
                      type="button"
                      className={`${styles.result} ${isSelected ? styles.resultSelected : ''}`}
                      onClick={() => handleToggle(ingredient)}
                    >
                      <EmojiPill emoji={category.icon} tone={category.tone} size="md" />
                      <span className={styles.resultName}>{ingredient.name}</span>
                      <span className={styles.resultUnit}>
                        {getUnitLabel(ingredient.defaultUnit) || category.label}
                      </span>
                      {isSelected && <Check size={16} strokeWidth={2.5} className={styles.check} />}
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className={styles.noResults}>
              Aucun ingrédient ne correspond à « {searchTerm.trim()} ».
              {canCreate && (
                <Button variant="secondary" size="sm" icon={Plus} onClick={() => setCreating(true)}>
                  Créer cet ingrédient
                </Button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default IngredientSelector;
