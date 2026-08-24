import { useState, useEffect, useMemo, useCallback } from 'react';
import { useIngredients, INGREDIENT_CATEGORIES } from '../contexts/IngredientContext';
import { useToast } from '../contexts/ToastContext';
import { useScrollRestoration, usePersistedState } from '../hooks/useScrollRestoration';
import { UNITS, getUnitLabel } from '../utils/units';
import { toneVars } from '../utils/palette';
import ImageUpload from '../components/ImageUpload';
import OptimizedImage from '../components/OptimizedImage';
import { Plus, Pencil, Trash2, BookOpen, ArrowLeft, Carrot, SearchX } from 'lucide-react';
import {
  Page,
  Button,
  SearchField,
  Chip,
  EmojiPill,
  Modal,
  Field,
  Input,
  Select,
  EmptyState,
  RowSkeleton
} from '../components/ui';
import styles from './Ingredients.module.css';

const emptyForm = () => ({
  name: '',
  category: 'fruits-legumes',
  defaultUnit: 'g',
  imageUrl: null
});

const getCategory = (id) =>
  INGREDIENT_CATEGORIES.find((c) => c.id === id) ||
  INGREDIENT_CATEGORIES[INGREDIENT_CATEGORIES.length - 1];

const Ingredients = ({ onBack }) => {
  const {
    ingredients,
    loading,
    addIngredient,
    updateIngredient,
    deleteIngredient,
    getIngredientRecipes
  } = useIngredients();
  const toast = useToast();

  const [persistedFilters, setPersistedFilters] = usePersistedState('ingredientsFilters', {
    searchTerm: '',
    selectedCategory: 'all'
  });

  const [searchTerm, setSearchTerm] = useState(persistedFilters.searchTerm);
  const [selectedCategory, setSelectedCategory] = useState(persistedFilters.selectedCategory);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [imageFile, setImageFile] = useState(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [saving, setSaving] = useState(false);

  const [pendingDelete, setPendingDelete] = useState(null);
  const [usedInRecipes, setUsedInRecipes] = useState([]);

  useScrollRestoration('ingredients', [loading, ingredients.length]);

  useEffect(() => {
    setPersistedFilters({ searchTerm, selectedCategory });
  }, [searchTerm, selectedCategory, setPersistedFilters]);

  const countByCategory = useMemo(() => {
    const counts = {};
    ingredients.forEach((ing) => {
      counts[ing.category] = (counts[ing.category] || 0) + 1;
    });
    return counts;
  }, [ingredients]);

  const filtered = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();
    return ingredients.filter((ing) => {
      const matchesSearch = !search || ing.name.toLowerCase().includes(search);
      const matchesCategory = selectedCategory === 'all' || ing.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [ingredients, searchTerm, selectedCategory]);

  const sections = useMemo(
    () =>
      INGREDIENT_CATEGORIES.map((category) => ({
        ...category,
        items: filtered
          .filter((ing) => ing.category === category.id)
          .sort((a, b) => a.name.localeCompare(b.name, 'fr'))
      })).filter((category) => category.items.length > 0),
    [filtered]
  );

  const openCreate = () => {
    setEditing(null);
    setFormData(emptyForm());
    setImageFile(null);
    setRemoveImage(false);
    setFormOpen(true);
  };

  const openEdit = (ingredient) => {
    setEditing(ingredient);
    setFormData({
      name: ingredient.name,
      category: ingredient.category,
      defaultUnit: ingredient.defaultUnit || 'g',
      imageUrl: ingredient.imageUrl || null
    });
    setImageFile(null);
    setRemoveImage(false);
    setFormOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setSaving(true);
    const payload = { ...formData, name: formData.name.trim() };

    try {
      if (editing) {
        await updateIngredient(editing.id, payload, imageFile, removeImage);
        toast.success('Ingrédient modifié');
      } else {
        await addIngredient(payload, imageFile);
        toast.success(`« ${payload.name} » ajouté au catalogue`);
      }
      setFormOpen(false);
    } catch (error) {
      console.error('Error saving ingredient:', error);
      toast.error("L'ingrédient n'a pas pu être enregistré");
    } finally {
      setSaving(false);
    }
  };

  const askDelete = useCallback(
    async (ingredient) => {
      setPendingDelete(ingredient);
      setUsedInRecipes([]);
      try {
        setUsedInRecipes(await getIngredientRecipes(ingredient.id));
      } catch (error) {
        console.error('Error loading ingredient recipes:', error);
      }
    },
    [getIngredientRecipes]
  );

  const handleDelete = async () => {
    const ingredient = pendingDelete;
    setPendingDelete(null);

    try {
      await deleteIngredient(ingredient.id);
      toast.success(`« ${ingredient.name} » supprimé`);
    } catch (error) {
      console.error('Error deleting ingredient:', error);
      toast.error("L'ingrédient n'a pas pu être supprimé");
    }
  };

  const hasFilters = searchTerm !== '' || selectedCategory !== 'all';

  return (
    <Page>
      <header className={styles.header}>
        {onBack && (
          <button type="button" className={styles.back} onClick={onBack} aria-label="Retour aux réglages">
            <ArrowLeft size={19} strokeWidth={2.2} />
          </button>
        )}
        <div className={styles.headings}>
          <h1 className={styles.title}>Ingrédients</h1>
          <p className={styles.subtitle}>
            Catalogue du foyer · {ingredients.length} item{ingredients.length > 1 ? 's' : ''}
          </p>
        </div>
        <Button
          variant="primary"
          icon={Plus}
          onClick={openCreate}
          aria-label="Ajouter un ingrédient"
          className={styles.addButton}
        >
          <span className={styles.addLabel}>Ajouter</span>
        </Button>
      </header>

      <SearchField
        value={searchTerm}
        onChange={setSearchTerm}
        placeholder="Rechercher un ingrédient…"
      />

      <div className={`${styles.chipRow} scrollRow`}>
        <Chip
          label="Toutes"
          count={ingredients.length}
          active={selectedCategory === 'all'}
          onClick={() => setSelectedCategory('all')}
        />
        {INGREDIENT_CATEGORIES.map((category) => {
          const count = countByCategory[category.id] || 0;
          return (
            <Chip
              key={category.id}
              label={category.label}
              emoji={category.icon}
              tone={category.tone}
              count={count}
              active={selectedCategory === category.id}
              disabled={count === 0}
              onClick={() => setSelectedCategory(category.id)}
            />
          );
        })}
      </div>

      {loading ? (
        <div className={styles.list}>
          <RowSkeleton />
          <RowSkeleton />
          <RowSkeleton />
        </div>
      ) : ingredients.length === 0 ? (
        <EmptyState
          icon={Carrot}
          title="Catalogue vide"
          description="Les ingrédients créés depuis une recette apparaîtront ici automatiquement."
          action={
            <Button variant="primary" size="lg" icon={Plus} fullWidth onClick={openCreate}>
              Ajouter un ingrédient
            </Button>
          }
        />
      ) : sections.length === 0 ? (
        <EmptyState
          size="sm"
          dashed={false}
          icon={SearchX}
          title="Aucun résultat"
          description={`Aucun ingrédient ne correspond${searchTerm ? ` à « ${searchTerm} »` : ' à ce filtre'}.`}
          action={
            hasFilters && (
              <Button
                variant="secondary"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('all');
                }}
              >
                Réinitialiser
              </Button>
            )
          }
        />
      ) : (
        <div className={styles.sections}>
          {sections.map((category) => (
            <section key={category.id} className={styles.section}>
              <h2 className={styles.sectionHead} style={toneVars(category.tone)}>
                <EmojiPill emoji={category.icon} tone={category.tone} size="sm" />
                {category.label}
                <span className={styles.sectionCount}>{category.items.length}</span>
              </h2>

              <div className={styles.list}>
                {category.items.map((ingredient) => (
                  <div key={ingredient.id} className={styles.row}>
                    <OptimizedImage
                      src={ingredient.imageUrl}
                      alt=""
                      asBackground
                      caption=""
                      placeholder={
                        <span className={styles.rowEmoji}>{getCategory(ingredient.category).icon}</span>
                      }
                      className={styles.rowThumb}
                    />
                    <div className={styles.rowText}>
                      <span className={styles.rowName}>{ingredient.name}</span>
                      <span className={styles.rowCategory}>{category.label}</span>
                    </div>
                    {ingredient.defaultUnit && (
                      <span className={styles.rowUnit}>{getUnitLabel(ingredient.defaultUnit)}</span>
                    )}
                    <div className={styles.rowActions}>
                      <button
                        type="button"
                        className={styles.rowAction}
                        onClick={() => openEdit(ingredient)}
                        aria-label={`Modifier ${ingredient.name}`}
                      >
                        <Pencil size={15} strokeWidth={2} />
                      </button>
                      <button
                        type="button"
                        className={`${styles.rowAction} ${styles.rowDelete}`}
                        onClick={() => askDelete(ingredient)}
                        aria-label={`Supprimer ${ingredient.name}`}
                      >
                        <Trash2 size={15} strokeWidth={2} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? 'Modifier l’ingrédient' : 'Ajouter un ingrédient'}
        size="sm"
      >
        <form className={styles.form} onSubmit={handleSubmit}>
          <Field label="Nom" required htmlFor="ingredient-name">
            <Input
              id="ingredient-name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex. Lait de coco"
              autoFocus
            />
          </Field>

          <Field label="Catégorie">
            <div className={styles.categoryChips}>
              {INGREDIENT_CATEGORIES.map((category) => (
                <Chip
                  key={category.id}
                  label={category.label}
                  emoji={category.icon}
                  tone={category.tone}
                  active={formData.category === category.id}
                  onClick={() => setFormData({ ...formData, category: category.id })}
                />
              ))}
            </div>
          </Field>

          <Field label="Unité par défaut" hint="Pré-remplie quand on ajoute l’ingrédient à une recette.">
            <Select
              value={formData.defaultUnit}
              onChange={(e) => setFormData({ ...formData, defaultUnit: e.target.value })}
            >
              {UNITS.map((unit) => (
                <option key={unit.id} value={unit.id}>
                  {unit.label}
                </option>
              ))}
            </Select>
          </Field>

          <ImageUpload
            currentImage={formData.imageUrl}
            onImageSelect={(file) => {
              setImageFile(file);
              setRemoveImage(false);
            }}
            onImageRemove={() => {
              setImageFile(null);
              setRemoveImage(true);
              setFormData((prev) => ({ ...prev, imageUrl: null }));
            }}
            label="Photo"
          />

          <div className={styles.formActions}>
            <Button variant="secondary" onClick={() => setFormOpen(false)} disabled={saving}>
              Annuler
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={saving}
              disabled={!formData.name.trim()}
              className={styles.formSubmit}
            >
              {editing ? 'Enregistrer' : 'Ajouter au catalogue'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={!!pendingDelete}
        onClose={() => setPendingDelete(null)}
        title="Supprimer cet ingrédient ?"
        size="sm"
        footer={
          <>
            <Button variant="secondary" fullWidth onClick={() => setPendingDelete(null)}>
              Annuler
            </Button>
            <Button variant="danger" fullWidth icon={Trash2} onClick={handleDelete}>
              Supprimer
            </Button>
          </>
        }
      >
        <p className={styles.confirmText}>
          « {pendingDelete?.name} » sera retiré du catalogue du foyer.
        </p>
        {usedInRecipes.length > 0 && (
          <div className={styles.usage}>
            <span className={styles.usageTitle}>
              <BookOpen size={15} strokeWidth={2.2} />
              Utilisé dans {usedInRecipes.length} recette{usedInRecipes.length > 1 ? 's' : ''}
            </span>
            <span className={styles.usageList}>
              {usedInRecipes.map((recipe) => recipe.name).join(', ')}
            </span>
          </div>
        )}
      </Modal>
    </Page>
  );
};

export default Ingredients;
