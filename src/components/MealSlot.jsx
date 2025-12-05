import { useState } from 'react';
import { createPortal } from 'react-dom';
import { getRecipeTypeById } from '../utils/recipeTypes';
import styles from './MealSlot.module.css';

const MealSlot = ({
  meal,
  dayName,
  slotType, // 'lunch' or 'dinner'
  slotId,
  isPast,
  onAdd,
  onEdit,
  onRemove,
  onViewRecipe,
  onDragStart,
  onDragEnd,
  onDrop
}) => {
  const [showServingsEdit, setShowServingsEdit] = useState(false);
  const [editedServings, setEditedServings] = useState(meal?.servings || 2);
  const [isDragOver, setIsDragOver] = useState(false);

  const isEmpty = !meal || !meal.recipeName;
  const isCustomMeal = meal?.isCustom || !meal?.recipeId;
  const slotLabel = slotType === 'lunch' ? 'Midi' : 'Soir';
  const slotIcon = slotType === 'lunch' ? '🌅' : '🌙';

  const handleServingsChange = () => {
    if (onEdit && meal) {
      onEdit({
        ...meal,
        servings: editedServings
      });
      setShowServingsEdit(false);
    }
  };

  const handleServingsCancel = () => {
    setEditedServings(meal?.servings || 2);
    setShowServingsEdit(false);
  };

  const handleDragStart = (e) => {
    if (isPast || !meal) return;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', slotId);
    onDragStart && onDragStart(slotId, meal);
  };

  const handleDragEnd = (e) => {
    setIsDragOver(false);
    onDragEnd && onDragEnd();
  };

  const handleDragOver = (e) => {
    if (isPast) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    if (isPast) return;
    e.preventDefault();
    setIsDragOver(false);
    const sourceSlotId = e.dataTransfer.getData('text/plain');
    if (sourceSlotId && sourceSlotId !== slotId) {
      onDrop && onDrop(sourceSlotId, slotId);
    }
  };

  if (isEmpty) {
    if (isPast) {
      return (
        <div className={`${styles.slot} ${styles.empty} ${styles.past}`}>
          <div className={styles.emptyContent}>
            <span className={styles.pastLabel}>—</span>
          </div>
        </div>
      );
    }
    return (
      <div
        className={`${styles.slot} ${styles.empty} ${isDragOver ? styles.dragOver : ''}`}
        onClick={() => onAdd && onAdd()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className={styles.emptyContent}>
          <span className={styles.addIcon}>+</span>
          <span className={styles.emptyLabel}>Ajouter</span>
        </div>
      </div>
    );
  }

  // Récupérer le type de recette pour afficher l'icône
  const recipeType = getRecipeTypeById(meal.recipeType || 'plat');

  return (
    <div
      className={`${styles.slot} ${styles.filled} ${isPast ? styles.past : ''} ${isCustomMeal ? styles.customMeal : ''} ${isDragOver ? styles.dragOver : ''}`}
      onClick={() => !isPast && !isCustomMeal && onViewRecipe && onViewRecipe(meal.recipeId)}
      draggable={!isPast}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Image en haut */}
      <div className={styles.mealImageContainer}>
        {meal.recipeImageUrl ? (
          <img
            src={meal.recipeImageUrl}
            alt={meal.recipeName}
            className={styles.mealImage}
          />
        ) : (
          <div className={styles.mealImagePlaceholder}>
            {recipeType.icon}
          </div>
        )}

        {/* Bouton supprimer en haut à droite */}
        {!isPast && (
          <button
            className={styles.removeButton}
            onClick={(e) => {
              e.stopPropagation();
              onRemove && onRemove();
            }}
            title="Retirer ce repas"
          >
            ✕
          </button>
        )}
      </div>

      {/* Contenu à droite */}
      <div className={styles.mealContent}>
        {/* En-tête avec titre et badge multi-day */}
        <div className={styles.mealHeader}>
          <h4 className={styles.recipeName}>
            {isCustomMeal && <span className={styles.customBadge}>✏️ </span>}
            {meal.recipeName}
          </h4>
          {meal.isMultiDay && (
            <div className={styles.multiDayBadge} title="Plat étalé sur plusieurs jours">
              <span className={styles.multiDayIcon}>📌</span>
              <span className={styles.multiDayText}>
                {meal.multiDayIndex}/{meal.multiDayCount}
              </span>
            </div>
          )}
        </div>

        {/* Boutons d'action uniformes en bas */}
        {!isPast && (
          <div className={styles.actionButtons}>
            <button
              className={styles.actionBtn}
              onClick={(e) => {
                e.stopPropagation();
                setShowServingsEdit(true);
              }}
              title="Modifier le nombre de personnes"
            >
              <span className={styles.actionIcon}>👥</span>
              <span className={styles.actionText}>{meal.servings || 2}p</span>
            </button>

            <button
              className={`${styles.actionBtn} ${meal.skipShoppingList ? styles.actionBtnInactive : styles.actionBtnActive}`}
              onClick={(e) => {
                e.stopPropagation();
                onEdit && onEdit({
                  ...meal,
                  skipShoppingList: !meal.skipShoppingList
                });
              }}
              title={meal.skipShoppingList ? "Réactiver dans la liste de courses" : "Retirer de la liste de courses"}
            >
              <span className={styles.actionIcon}>🛒</span>
              <span className={styles.actionText}>{meal.skipShoppingList ? 'Off' : 'On'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Modal d'édition du nombre de personnes - Rendu via portail */}
      {showServingsEdit && createPortal(
        <div className={styles.servingsModal} onClick={handleServingsCancel}>
          <div className={styles.servingsModalContent} onClick={(e) => e.stopPropagation()}>
            <label>Nombre de personnes :</label>
            <input
              type="number"
              min="1"
              max="20"
              value={editedServings}
              onChange={(e) => setEditedServings(Number(e.target.value))}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleServingsChange();
                if (e.key === 'Escape') handleServingsCancel();
              }}
              autoFocus
            />
            <div className={styles.servingsModalButtons}>
              <button onClick={handleServingsChange} className={styles.servingsSaveButton}>
                ✓
              </button>
              <button onClick={handleServingsCancel} className={styles.servingsCancelButton}>
                ✕
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default MealSlot;
