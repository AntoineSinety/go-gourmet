import { useState, useEffect, useMemo } from 'react';
import { useMealPlan } from '../contexts/MealPlanContext';
import { useRecipes } from '../contexts/RecipeContext';
import { ShoppingCart, X } from 'lucide-react';
import styles from './ShoppingList.module.css';

const ShoppingList = () => {
  const { mealPlan, loading: mealPlanLoading, addPermanentItem, deletePermanentItem, updateCheckedItems } = useMealPlan();
  const { recipes, loading: recipesLoading } = useRecipes();
  const [checkedItems, setCheckedItems] = useState({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [shoppingMode, setShoppingMode] = useState(false);
  const [newItem, setNewItem] = useState({
    name: '',
    category: 'Autres',
    quantity: '',
    unit: ''
  });

  // Charger les items cochés depuis le mealPlan
  useEffect(() => {
    if (mealPlan?.checkedItems) {
      setCheckedItems(mealPlan.checkedItems);
    }
  }, [mealPlan]);

  // Générer automatiquement la liste de courses basée sur les repas futurs
  const shoppingList = useMemo(() => {
    if (!mealPlan || !recipes.length) {
      return [];
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Collecter tous les repas futurs (non passés)
    const futureMeals = [];
    const processedMultiDay = new Set(); // Pour éviter les doublons multi-day

    Object.entries(mealPlan.meals || {}).forEach(([slotId, meal]) => {
      // Extraire la date du slotId (format: "monday_lunch")
      const [dayKey, slotType] = slotId.split('_');

      // Reconstruire la date à partir du mealPlan.startDate et du dayKey
      const dayIndex = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].indexOf(dayKey);
      const mealDate = new Date(mealPlan.startDate);
      mealDate.setDate(mealDate.getDate() + dayIndex);
      mealDate.setHours(0, 0, 0, 0);

      // Ne garder que les repas d'aujourd'hui et futurs
      if (mealDate < today) {
        return;
      }

      // Ignorer les repas marqués comme "j'ai déjà tout"
      if (meal.skipShoppingList) {
        return;
      }

      // Gérer les multi-day : ne compter qu'une seule fois
      if (meal.isMultiDay) {
        const multiDayKey = meal.multiDayMealIds?.sort().join('_');
        if (processedMultiDay.has(multiDayKey)) return;
        processedMultiDay.add(multiDayKey);
      }

      futureMeals.push({
        ...meal,
        slotId,
        date: mealDate
      });
    });

    // Ajouter les extras
    mealPlan.extras?.forEach(extra => {
      futureMeals.push({
        ...extra,
        isExtra: true
      });
    });

    // Agréger les ingrédients
    const ingredientMap = {};

    futureMeals.forEach(meal => {
      const recipe = recipes.find(r => r.id === meal.recipeId);

      if (!recipe || !recipe.ingredients) {
        return;
      }

      const servingsRatio = meal.servings / (recipe.servings || 1);

      recipe.ingredients.forEach(ingredient => {
        const key = `${ingredient.name}_${ingredient.unit || ''}`;

        if (!ingredientMap[key]) {
          ingredientMap[key] = {
            name: ingredient.name,
            unit: ingredient.unit || '',
            quantity: 0,
            category: ingredient.category || 'Autres',
            fromRecipes: []
          };
        }

        const adjustedQuantity = (ingredient.quantity || 0) * servingsRatio;
        ingredientMap[key].quantity += adjustedQuantity;
        ingredientMap[key].fromRecipes.push(recipe.name);
      });
    });

    // Convertir en tableau
    const ingredientsList = Object.values(ingredientMap);

    // Ajouter les items permanents NON cochés à leur catégorie d'origine
    const permanentItems = mealPlan.permanentItems || [];

    // Grouper par catégorie (items from recipes + items permanents non cochés)
    const grouped = ingredientsList.reduce((acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = [];
      }
      acc[item.category].push(item);
      return acc;
    }, {});

    // Ajouter les items permanents NON cochés à leurs catégories
    permanentItems.forEach(item => {
      const itemKey = item.id;
      const isChecked = checkedItems[itemKey];

      if (!isChecked) {
        // Item non coché : ajouter à sa catégorie d'origine
        if (!grouped[item.category]) {
          grouped[item.category] = [];
        }
        grouped[item.category].push({
          ...item,
          isPermanent: true,
          fromRecipes: []
        });
      }
    });

    // Créer une catégorie spéciale pour les items permanents cochés
    const checkedPermanent = permanentItems.filter(item => checkedItems[item.id]);
    if (checkedPermanent.length > 0) {
      grouped['✓ Cochés'] = checkedPermanent.map(item => ({
        ...item,
        isPermanent: true,
        fromRecipes: []
      }));
    }

    // Convertir en tableau de catégories avec leurs items
    return Object.entries(grouped).map(([category, items]) => ({
      category,
      items: items.sort((a, b) => a.name.localeCompare(b.name))
    })).sort((a, b) => {
      // Mettre "✓ Cochés" en dernier
      if (a.category === '✓ Cochés') return 1;
      if (b.category === '✓ Cochés') return -1;
      return a.category.localeCompare(b.category);
    });
  }, [mealPlan, recipes, checkedItems]);

  const toggleItem = async (category, itemName, itemId) => {
    const key = itemId || `${category}_${itemName}`;
    const newCheckedItems = {
      ...checkedItems,
      [key]: !checkedItems[key]
    };
    setCheckedItems(newCheckedItems);

    // Sauvegarder dans Firestore
    try {
      await updateCheckedItems(newCheckedItems);
    } catch (error) {
      console.error('Error updating checked items:', error);
    }
  };

  const clearChecked = async () => {
    setCheckedItems({});

    // Sauvegarder dans Firestore
    try {
      await updateCheckedItems({});
    } catch (error) {
      console.error('Error clearing checked items:', error);
    }
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

      setNewItem({
        name: '',
        category: 'Autres',
        quantity: '',
        unit: ''
      });
      setShowAddForm(false);
    } catch (error) {
      console.error('Error adding permanent item:', error);
    }
  };

  const handleDeletePermanent = async (itemId) => {
    try {
      await deletePermanentItem(itemId);
      // Retirer aussi de checkedItems
      setCheckedItems(prev => {
        const newChecked = { ...prev };
        delete newChecked[itemId];
        return newChecked;
      });
    } catch (error) {
      console.error('Error deleting permanent item:', error);
    }
  };

  const loading = mealPlanLoading || recipesLoading;

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Génération de la liste de courses...</div>
      </div>
    );
  }

  if (!mealPlan) {
    return (
      <div className={styles.container}>
        <div className={styles.empty}>
          <h2>📋 Aucun planning disponible</h2>
          <p>Créez un planning pour générer votre liste de courses automatiquement.</p>
        </div>
      </div>
    );
  }

  const totalItems = shoppingList.reduce((sum, cat) => sum + cat.items.length, 0);
  const checkedCount = Object.values(checkedItems).filter(Boolean).length;

  const categoryEmojis = {
    'Fruits & Légumes': '🥬',
    'Viandes & Poissons': '🥩',
    'Produits laitiers': '🥛',
    'Épicerie': '🏪',
    'Surgelés': '🧊',
    'Boissons': '🥤',
    'Boulangerie': '🥖',
    'Autres': '📦',
    '✓ Cochés': '✅'
  };

  const categories = [
    'Fruits & Légumes',
    'Viandes & Poissons',
    'Produits laitiers',
    'Épicerie',
    'Surgelés',
    'Boissons',
    'Boulangerie',
    'Autres'
  ];

  // Mode Shopping Full Screen
  if (shoppingMode) {
    return (
      <div className={styles.shoppingModeContainer}>
        {/* Header Mode Course */}
        <div className={styles.shoppingModeHeader}>
          <div className={styles.shoppingModeTitle}>
            <ShoppingCart size={18} strokeWidth={2} />
            <h1>Mode Course</h1>
          </div>
          <button
            onClick={() => setShoppingMode(false)}
            className={styles.exitShoppingMode}
            title="Quitter le mode course"
          >
            <X size={20} strokeWidth={2} />
          </button>
        </div>

        {/* Progress Bar */}
        <div className={styles.shoppingModeProgress}>
          <div className={styles.progressText}>
            {checkedCount} / {totalItems} articles
          </div>
          <div className={styles.progressBarContainer}>
            <div
              className={styles.progressBar}
              style={{ width: `${totalItems > 0 ? (checkedCount / totalItems) * 100 : 0}%` }}
            />
          </div>
        </div>

        {/* Liste simplifiée par catégorie */}
        <div className={styles.shoppingModeList}>
          {shoppingList.map(({ category, items }) => (
            <div key={category} className={styles.shoppingModeCategory}>
              <div className={styles.shoppingModeCategoryHeader}>
                <span>{categoryEmojis[category] || '📦'}</span>
                <h2>{category}</h2>
                <span className={styles.shoppingModeCategoryCount}>
                  {items.filter(item => {
                    const itemKey = item.isPermanent ? item.id : `${category}_${item.name}`;
                    return checkedItems[itemKey];
                  }).length}/{items.length}
                </span>
              </div>
              <div className={styles.shoppingModeItems}>
                {items.map((item, index) => {
                  const itemKey = item.isPermanent ? item.id : `${category}_${item.name}`;
                  const isChecked = checkedItems[itemKey];

                  return (
                    <div
                      key={index}
                      className={`${styles.shoppingModeItem} ${isChecked ? styles.shoppingModeItemChecked : ''}`}
                      onClick={() => toggleItem(category, item.name, item.isPermanent ? item.id : null)}
                    >
                      <div className={styles.shoppingModeCheckbox}>
                        {isChecked && (
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </div>
                      <div className={styles.shoppingModeItemContent}>
                        <div className={styles.shoppingModeItemName}>{item.name}</div>
                        {item.quantity && (
                          <div className={styles.shoppingModeItemQuantity}>
                            {Number.isInteger(item.quantity)
                              ? item.quantity
                              : item.quantity.toFixed(1)
                            } {item.unit}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1>📋 Liste de Courses</h1>
          <p className={styles.subtitle}>
            Générée automatiquement à partir de votre planning
          </p>
        </div>
        <div className={styles.headerButtons}>
          <button
            onClick={() => setShoppingMode(true)}
            className={styles.shoppingModeButton}
          >
            <ShoppingCart size={18} strokeWidth={2} />
            Mode Course
          </button>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className={styles.addButton}
          >
            {showAddForm ? '✕ Annuler' : '+ Ajouter item'}
          </button>
          {checkedCount > 0 && (
            <button onClick={clearChecked} className={styles.clearButton}>
              Effacer coches ({checkedCount})
            </button>
          )}
        </div>
      </div>

      {/* Formulaire d'ajout */}
      {showAddForm && (
        <form onSubmit={handleAddItem} className={styles.addForm}>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Nom de l'article *</label>
              <input
                type="text"
                value={newItem.name}
                onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                placeholder="Ex: Lait"
                required
                autoFocus
                className={styles.formInput}
              />
            </div>
            <div className={styles.formGroup}>
              <label>Catégorie</label>
              <select
                value={newItem.category}
                onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                className={styles.formSelect}
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Quantité (optionnel)</label>
              <input
                type="number"
                step="0.1"
                value={newItem.quantity}
                onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value })}
                placeholder="Ex: 2"
                className={styles.formInput}
              />
            </div>
            <div className={styles.formGroup}>
              <label>Unité (optionnel)</label>
              <input
                type="text"
                value={newItem.unit}
                onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                placeholder="Ex: L"
                className={styles.formInput}
              />
            </div>
          </div>
          <button type="submit" className={styles.submitButton}>
            Ajouter à la liste
          </button>
        </form>
      )}

      {/* Stats */}
      {totalItems > 0 && (
        <div className={styles.stats}>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>🛒</div>
            <div className={styles.statContent}>
              <div className={styles.statValue}>{totalItems}</div>
              <div className={styles.statLabel}>Articles</div>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>✓</div>
            <div className={styles.statContent}>
              <div className={styles.statValue}>{checkedCount}</div>
              <div className={styles.statLabel}>Cochés</div>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>📦</div>
            <div className={styles.statContent}>
              <div className={styles.statValue}>{shoppingList.length}</div>
              <div className={styles.statLabel}>Catégories</div>
            </div>
          </div>
        </div>
      )}

      {/* Liste des ingrédients par catégorie */}
      {shoppingList.length === 0 ? (
        <div className={styles.empty}>
          <h2>🍽️ Aucun article</h2>
          <p>Ajoutez des repas à votre planning ou des articles permanents.</p>
        </div>
      ) : (
        <div className={styles.categoriesList}>
          {shoppingList.map(({ category, items }) => (
            <div key={category} className={styles.categorySection}>
              <div className={styles.categoryHeader}>
                <h3 className={styles.categoryTitle}>
                  {categoryEmojis[category] || '📦'} {category}
                </h3>
                <span className={styles.categoryCount}>{items.length}</span>
              </div>
              <div className={styles.itemsList}>
                {items.map((item, index) => {
                  const itemKey = item.isPermanent ? item.id : `${category}_${item.name}`;
                  const isChecked = checkedItems[itemKey];

                  return (
                    <div
                      key={index}
                      className={`${styles.item} ${isChecked ? styles.checked : ''}`}
                    >
                      <div
                        className={styles.itemClickable}
                        onClick={() => toggleItem(category, item.name, item.isPermanent ? item.id : null)}
                      >
                        <div className={styles.checkbox}>
                          {isChecked && <span className={styles.checkmark}>✓</span>}
                        </div>
                        <div className={styles.itemContent}>
                          <div className={styles.itemName}>
                            {item.isPermanent && <span className={styles.customBadge}>✏️</span>}
                            {item.name}
                          </div>
                          <div className={styles.itemQuantity}>
                            {item.quantity && (
                              <>
                                {Number.isInteger(item.quantity)
                                  ? item.quantity
                                  : item.quantity.toFixed(1)
                                } {item.unit}
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      {item.isPermanent && (
                        <button
                          onClick={() => handleDeletePermanent(item.id)}
                          className={styles.deleteButton}
                          title="Supprimer définitivement"
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ShoppingList;
