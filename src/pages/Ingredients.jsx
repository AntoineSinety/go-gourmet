import { useState, useEffect } from 'react';
import { useIngredients, INGREDIENT_CATEGORIES } from '../contexts/IngredientContext';
import { useScrollRestoration, usePersistedState } from '../hooks/useScrollRestoration';
import ImageUpload from '../components/ImageUpload';
import { loadImageWithCache } from '../services/imageService';
import { Plus, Pencil, Trash2, BookOpen, LayoutGrid, List, Package, Users } from 'lucide-react';
import styles from './Ingredients.module.css';

const Ingredients = () => {
  const {
    ingredients,
    loading,
    addIngredient,
    updateIngredient,
    deleteIngredient,
    getIngredientRecipes
  } = useIngredients();

  // Persister les filtres
  const [persistedFilters, setPersistedFilters] = usePersistedState('ingredientsFilters', {
    searchTerm: '',
    selectedCategory: 'all',
    viewMode: 'category'
  });

  const [searchTerm, setSearchTerm] = useState(persistedFilters.searchTerm);
  const [selectedCategory, setSelectedCategory] = useState(persistedFilters.selectedCategory);
  const [viewMode, setViewMode] = useState(persistedFilters.viewMode);

  // Restaurer le scroll
  useScrollRestoration('ingredients', [loading, ingredients.length]);

  // Sauvegarder les filtres
  useEffect(() => {
    setPersistedFilters({
      searchTerm,
      selectedCategory,
      viewMode
    });
  }, [searchTerm, selectedCategory, viewMode, setPersistedFilters]);
  const [editingIngredient, setEditingIngredient] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [ingredientRecipes, setIngredientRecipes] = useState([]);
  const [loadingRecipes, setLoadingRecipes] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [recipeCountsCache, setRecipeCountsCache] = useState({});
  const [showRecipesModal, setShowRecipesModal] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    category: 'fruits-legumes',
    imageUrl: null
  });

  // Charger les compteurs de recettes pour tous les ingrédients
  useEffect(() => {
    const loadRecipeCounts = async () => {
      const counts = {};
      for (const ingredient of ingredients) {
        const recipes = await getIngredientRecipes(ingredient.id);
        counts[ingredient.id] = recipes.length;
      }
      setRecipeCountsCache(counts);
    };

    if (ingredients.length > 0) {
      loadRecipeCounts();
    }
  }, [ingredients, getIngredientRecipes]);

  const filteredIngredients = ingredients.filter(ing => {
    const matchesSearch = ing.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || ing.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Grouper par catégories
  const ingredientsByCategory = INGREDIENT_CATEGORIES.map(category => ({
    ...category,
    ingredients: filteredIngredients.filter(ing => ing.category === category.id)
  })).filter(cat => cat.ingredients.length > 0);

  const handleAddIngredient = async () => {
    if (!formData.name.trim()) return;

    try {
      await addIngredient(formData, imageFile);
      setFormData({ name: '', category: 'fruits-legumes', imageUrl: null });
      setImageFile(null);
      setShowAddForm(false);
    } catch (error) {
      console.error('Error adding ingredient:', error);
    }
  };

  const handleEditIngredient = async () => {
    if (!formData.name.trim() || !editingIngredient) return;

    try {
      await updateIngredient(editingIngredient.id, formData, imageFile, removeImage);
      setEditingIngredient(null);
      setFormData({ name: '', category: 'fruits-legumes', imageUrl: null });
      setImageFile(null);
      setRemoveImage(false);
    } catch (error) {
      console.error('Error updating ingredient:', error);
    }
  };

  const handleDeleteClick = async (ingredient) => {
    setLoadingRecipes(true);
    const recipes = await getIngredientRecipes(ingredient.id);
    setIngredientRecipes(recipes);
    setShowDeleteConfirm(ingredient);
    setLoadingRecipes(false);
  };

  const handleDeleteConfirm = async () => {
    if (!showDeleteConfirm) return;

    try {
      await deleteIngredient(showDeleteConfirm.id);
      setShowDeleteConfirm(null);
      setIngredientRecipes([]);
    } catch (error) {
      console.error('Error deleting ingredient:', error);
    }
  };

  const handleShowRecipes = async (ingredient) => {
    setLoadingRecipes(true);
    const recipes = await getIngredientRecipes(ingredient.id);
    setShowRecipesModal({ ingredient, recipes });
    setLoadingRecipes(false);
  };

  const openEditForm = (ingredient) => {
    setEditingIngredient(ingredient);
    setFormData({
      name: ingredient.name,
      category: ingredient.category,
      imageUrl: ingredient.imageUrl
    });
    setImageFile(null);
    setRemoveImage(false);
    setShowAddForm(false);
  };

  const cancelEdit = () => {
    setEditingIngredient(null);
    setFormData({ name: '', category: 'fruits-legumes', imageUrl: null });
    setImageFile(null);
    setRemoveImage(false);
  };

  const handleImageSelect = (file) => {
    setImageFile(file);
    setRemoveImage(false);
  };

  const handleImageRemove = () => {
    setImageFile(null);
    setRemoveImage(true);
    setFormData(prev => ({ ...prev, imageUrl: null }));
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Chargement des ingrédients...</div>
      </div>
    );
  }

  const IngredientCard = ({ ingredient }) => {
    const category = INGREDIENT_CATEGORIES.find(c => c.id === ingredient.category);
    const [cachedImageUrl, setCachedImageUrl] = useState(null);
    const recipeCount = recipeCountsCache[ingredient.id] || 0;

    useEffect(() => {
      if (ingredient.imageUrl) {
        loadImageWithCache(ingredient.imageUrl).then(setCachedImageUrl);
      }
    }, [ingredient.imageUrl]);

    return (
      <div className={styles.ingredientCard}>
        <div className={styles.ingredientImage}>
          {cachedImageUrl || ingredient.imageUrl ? (
            <img src={cachedImageUrl || ingredient.imageUrl} alt={ingredient.name} />
          ) : (
            <div className={styles.placeholderImage}>
              <span className={styles.placeholderIcon}><Package size={32} /></span>
            </div>
          )}
        </div>
        <div className={styles.ingredientInfo}>
          <h3>{ingredient.name}</h3>
        </div>
        <div className={styles.ingredientFooter}>
          <button
            onClick={() => handleShowRecipes(ingredient)}
            className={styles.recipeCount}
            title="Voir les recettes"
          >
            <BookOpen size={14} style={{ marginRight: '4px' }} />{recipeCount}
          </button>
          <div className={styles.ingredientActions}>
            <button
              onClick={() => openEditForm(ingredient)}
              className={styles.editBtn}
              title="Modifier"
            >
              <Pencil size={14} />
            </button>
            <button
              onClick={() => handleDeleteClick(ingredient)}
              className={styles.deleteBtn}
              title="Supprimer"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Gestion des ingrédients</h1>
        <button
          onClick={() => {
            setShowAddForm(true);
            setEditingIngredient(null);
            setFormData({ name: '', category: 'fruits-legumes', imageUrl: null });
            setImageFile(null);
            setRemoveImage(false);
          }}
          className={styles.addButton}
        >
          <Plus size={18} style={{ verticalAlign: 'middle', marginRight: '6px' }} />Ajouter
        </button>
      </div>

      <div className={styles.filters}>
        <input
          type="text"
          placeholder="Rechercher un ingrédient..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={styles.searchInput}
        />
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className={styles.categoryFilter}
        >
          <option value="all">Toutes les catégories</option>
          {INGREDIENT_CATEGORIES.map(cat => (
            <option key={cat.id} value={cat.id}>
              {cat.icon} {cat.label}
            </option>
          ))}
        </select>
        <div className={styles.viewToggle}>
          <button
            onClick={() => setViewMode('grid')}
            className={viewMode === 'grid' ? styles.active : ''}
            title="Vue grille"
          >
            <LayoutGrid size={18} />
          </button>
          <button
            onClick={() => setViewMode('category')}
            className={viewMode === 'category' ? styles.active : ''}
            title="Vue par catégorie"
          >
            <List size={18} />
          </button>
        </div>
      </div>

      {(showAddForm || editingIngredient) && (
        <div className={styles.formCard}>
          <h3>{editingIngredient ? 'Modifier l\'ingrédient' : 'Nouvel ingrédient'}</h3>

          <ImageUpload
            currentImage={formData.imageUrl}
            onImageSelect={handleImageSelect}
            onImageRemove={handleImageRemove}
            label="Photo de l'ingrédient"
          />

          <div className={styles.formGroup}>
            <label>Nom</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Tomates"
              autoFocus
            />
          </div>
          <div className={styles.formGroup}>
            <label>Catégorie</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            >
              {INGREDIENT_CATEGORIES.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.icon} {cat.label}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.formActions}>
            <button
              onClick={editingIngredient ? handleEditIngredient : handleAddIngredient}
              className={styles.saveButton}
            >
              {editingIngredient ? 'Enregistrer' : 'Ajouter'}
            </button>
            <button
              onClick={() => {
                setShowAddForm(false);
                cancelEdit();
              }}
              className={styles.cancelButton}
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      <div className={styles.stats}>
        <p>
          {filteredIngredients.length} ingrédient{filteredIngredients.length > 1 ? 's' : ''}
          {selectedCategory !== 'all' && ' dans cette catégorie'}
        </p>
      </div>

      {viewMode === 'grid' ? (
        <div className={styles.categoriesView}>
          {ingredientsByCategory.map(category => (
            <div key={category.id} className={styles.categorySection}>
              <h2 className={styles.categoryTitle}>
                <span className={styles.categoryIcon}>{category.icon}</span>
                {category.label}
                <span className={styles.categoryCount}>({category.ingredients.length})</span>
              </h2>
              <div className={styles.ingredientsList}>
                {category.ingredients.map(ingredient => (
                  <IngredientCard key={ingredient.id} ingredient={ingredient} />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={styles.categoriesView}>
          {ingredientsByCategory.map(category => (
            <div key={category.id} className={styles.categorySection}>
              <h2 className={styles.categoryTitle}>
                <span className={styles.categoryIcon}>{category.icon}</span>
                {category.label}
                <span className={styles.categoryCount}>({category.ingredients.length})</span>
              </h2>
              <div className={styles.ingredientsList}>
                {category.ingredients.map(ingredient => (
                  <IngredientCard key={ingredient.id} ingredient={ingredient} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {filteredIngredients.length === 0 && (
        <div className={styles.emptyState}>
          <p>Aucun ingrédient trouvé</p>
        </div>
      )}

      {/* Modal pour voir les recettes */}
      {showRecipesModal && (
        <div className={styles.modal} onClick={() => setShowRecipesModal(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h3>Recettes avec {showRecipesModal.ingredient.name}</h3>

            {loadingRecipes ? (
              <p className={styles.loadingRecipes}>Chargement des recettes...</p>
            ) : showRecipesModal.recipes.length > 0 ? (
              <>
                <p className={styles.recipeInfo}>
                  Cet ingrédient est utilisé dans {showRecipesModal.recipes.length} recette{showRecipesModal.recipes.length > 1 ? 's' : ''} :
                </p>
                <ul className={styles.recipesList}>
                  {showRecipesModal.recipes.map(recipe => (
                    <li key={recipe.id} className={styles.recipeItem}>
                      <span className={styles.recipeName}>{recipe.name}</span>
                      {recipe.servings && (
                        <span className={styles.recipeServings}>
                          <Users size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} />{recipe.servings} pers.
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p className={styles.noRecipes}>
                Cet ingrédient n'est utilisé dans aucune recette pour le moment.
              </p>
            )}

            <div className={styles.modalActions}>
              <button
                onClick={() => setShowRecipesModal(null)}
                className={styles.closeButton}
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de suppression */}
      {showDeleteConfirm && (
        <div className={styles.modal} onClick={() => setShowDeleteConfirm(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h3>Supprimer l'ingrédient ?</h3>
            <p className={styles.deleteWarning}>
              Voulez-vous vraiment supprimer <strong>{showDeleteConfirm.name}</strong> ?
            </p>

            {loadingRecipes ? (
              <p className={styles.loadingRecipes}>Vérification des recettes associées...</p>
            ) : (
              <>
                {ingredientRecipes.length > 0 && (
                  <div className={styles.associatedRecipes}>
                    <p className={styles.warningText}>
                      ⚠️ Cet ingrédient est utilisé dans {ingredientRecipes.length} recette{ingredientRecipes.length > 1 ? 's' : ''} :
                    </p>
                    <ul className={styles.recipesList}>
                      {ingredientRecipes.map(recipe => (
                        <li key={recipe.id}>{recipe.name}</li>
                      ))}
                    </ul>
                    <p className={styles.warningText}>
                      La suppression de cet ingrédient peut affecter ces recettes.
                    </p>
                  </div>
                )}
              </>
            )}

            <div className={styles.modalActions}>
              <button
                onClick={handleDeleteConfirm}
                className={styles.confirmDeleteButton}
                disabled={loadingRecipes}
              >
                Supprimer
              </button>
              <button
                onClick={() => {
                  setShowDeleteConfirm(null);
                  setIngredientRecipes([]);
                }}
                className={styles.cancelButton}
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Ingredients;
