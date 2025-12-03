import { useState, useEffect } from 'react';
import { useIngredients, INGREDIENT_CATEGORIES } from '../contexts/IngredientContext';
import { loadImageWithCache } from '../services/imageService';
import styles from './IngredientSelector.module.css';

const IngredientSelector = ({ onSelect, onDeselect, selectedIngredients = [] }) => {
  const { ingredients, addIngredient } = useIngredients();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [ingredientImages, setIngredientImages] = useState({});
  const [newIngredient, setNewIngredient] = useState({
    name: '',
    category: 'fruits-legumes'
  });

  // Load ingredient images
  useEffect(() => {
    const loadImages = async () => {
      const images = {};
      for (const ingredient of ingredients) {
        if (ingredient.imageUrl) {
          try {
            const cachedUrl = await loadImageWithCache(ingredient.imageUrl);
            images[ingredient.id] = cachedUrl;
          } catch (error) {
            console.error(`Error loading image for ${ingredient.name}:`, error);
          }
        }
      }
      setIngredientImages(images);
    };

    if (ingredients.length > 0) {
      loadImages();
    }
  }, [ingredients]);

  // Filter ingredients
  const filteredIngredients = ingredients.filter(ingredient => {
    const matchesSearch = ingredient.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || ingredient.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const selectedIds = selectedIngredients.map(ing => ing.ingredientId || ing.id);

  // Group filtered ingredients by category for better display
  const ingredientsByCategory = INGREDIENT_CATEGORIES.map(category => ({
    ...category,
    ingredients: filteredIngredients.filter(ing => ing.category === category.id)
  })).filter(cat => cat.ingredients.length > 0);

  const handleSelectIngredient = (ingredient) => {
    if (selectedIds.includes(ingredient.id)) {
      // Déselectionner l'ingrédient
      if (onDeselect) {
        const selectedIngredient = selectedIngredients.find(
          ing => (ing.ingredientId || ing.id) === ingredient.id
        );
        onDeselect(selectedIngredient);
      }
    } else {
      // Sélectionner l'ingrédient
      onSelect(ingredient);
      setSearchTerm('');
    }
  };

  const handleAddNewIngredient = async () => {
    if (!newIngredient.name.trim()) return;

    try {
      const created = await addIngredient(newIngredient);
      onSelect(created);
      setNewIngredient({ name: '', category: 'fruits-legumes' });
      setShowAddForm(false);
      setSearchTerm('');
    } catch (error) {
      console.error('Error adding ingredient:', error);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.searchBox}>
        <input
          type="text"
          placeholder="Rechercher un ingrédient..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={styles.searchInput}
        />

        <div className={styles.categoryFilters}>
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`${styles.filterButton} ${selectedCategory === 'all' ? styles.active : ''}`}
          >
            Tous ({ingredients.length})
          </button>
          {INGREDIENT_CATEGORIES.map(category => {
            const count = ingredients.filter(ing => ing.category === category.id).length;
            if (count === 0) return null;
            return (
              <button
                key={category.id}
                type="button"
                onClick={() => setSelectedCategory(category.id)}
                className={`${styles.filterButton} ${selectedCategory === category.id ? styles.active : ''}`}
              >
                {category.icon} {count}
              </button>
            );
          })}
        </div>
      </div>

      {searchTerm && filteredIngredients.length === 0 && (
        <div className={styles.noResults}>
          <p>Aucun ingrédient trouvé pour "{searchTerm}"</p>
          <button
            type="button"
            onClick={() => {
              setNewIngredient({ ...newIngredient, name: searchTerm });
              setShowAddForm(true);
            }}
            className={styles.addNewButton}
          >
            + Créer "{searchTerm}"
          </button>
        </div>
      )}

      {(searchTerm || selectedCategory !== 'all') && filteredIngredients.length > 0 && (
        <div className={styles.suggestions}>
          {ingredientsByCategory.map(category => (
            <div key={category.id} className={styles.categoryGroup}>
              <h4 className={styles.categoryHeader}>
                {category.icon} {category.label}
              </h4>
              <div className={styles.ingredientGrid}>
                {category.ingredients.map(ingredient => {
                  const isSelected = selectedIds.includes(ingredient.id);

                  return (
                    <button
                      key={ingredient.id}
                      type="button"
                      onClick={() => handleSelectIngredient(ingredient)}
                      className={`${styles.ingredientCard} ${isSelected ? styles.selected : ''}`}
                    >
                      <div className={styles.ingredientImage}>
                        {ingredientImages[ingredient.id] ? (
                          <img src={ingredientImages[ingredient.id]} alt={ingredient.name} />
                        ) : (
                          <div className={styles.placeholderImage}>{category.icon}</div>
                        )}
                        {isSelected && <span className={styles.selectedBadge}>✓</span>}
                      </div>
                      <div className={styles.ingredientInfo}>
                        <span className={styles.ingredientName}>{ingredient.name}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {showAddForm && (
        <div className={styles.addForm}>
          <h4>Nouvel ingrédient</h4>
          <div>
            <div className={styles.formGroup}>
              <label>Nom</label>
              <input
                type="text"
                value={newIngredient.name}
                onChange={(e) => setNewIngredient({ ...newIngredient, name: e.target.value })}
                autoFocus
                required
              />
            </div>
            <div className={styles.formGroup}>
              <label>Catégorie</label>
              <select
                value={newIngredient.category}
                onChange={(e) => setNewIngredient({ ...newIngredient, category: e.target.value })}
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
                type="button"
                onClick={handleAddNewIngredient}
              >
                Ajouter
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
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

export default IngredientSelector;
