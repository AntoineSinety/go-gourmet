import { useState } from 'react';
import { createPortal } from 'react-dom';
import { getRecipeTypeById } from '../utils/recipeTypes';
import styles from './MealSlot.module.css';

const MealSlot = ({
  meal,
  dayName,
  slotType, // 'lunch' or 'dinner'
  isPast,
  onAdd,
  onEdit,
  onRemove,
  onViewRecipe
}) => {
  const [showServingsEdit, setShowServingsEdit] = useState(false);
  const [editedServings, setEditedServings] = useState(meal?.servings || 2);

  const isEmpty = !meal || !meal.recipeId;
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
        className={`${styles.slot} ${styles.empty}`}
        onClick={() => onAdd && onAdd()}
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
      className={`${styles.slot} ${styles.filled} ${isPast ? styles.past : ''}`}
      onClick={() => !isPast && onViewRecipe && onViewRecipe(meal.recipeId)}
    >
      {/* Image de fond si disponible */}
      {meal.recipeImageUrl && (
        <div
          className={styles.mealImage}
          style={{ backgroundImage: `url(${meal.recipeImageUrl})` }}
        />
      )}

      {/* Contenu du meal slot */}
      <div className={styles.mealContent}>
        {/* Nom de la recette */}
        <h4 className={styles.recipeName}>{meal.recipeName}</h4>

        {/* Informations */}
        <div className={styles.mealInfo}>
          {/* Nombre de personnes */}
          <div
            className={styles.servings}
            onClick={(e) => {
              if (!isPast) {
                e.stopPropagation();
                setShowServingsEdit(true);
              }
            }}
            title={isPast ? "" : "Cliquer pour modifier"}
          >
            <span>{meal.servings || 2}p</span>
          </div>

          {/* Badge multi-day si applicable */}
          {meal.isMultiDay && (
            <div className={styles.multiDayBadge} title="Plat étalé sur plusieurs jours">
              <span className={styles.multiDayIcon}>📌</span>
              <span className={styles.multiDayText}>
                {meal.multiDayIndex}/{meal.multiDayCount}
              </span>
            </div>
          )}
        </div>

        {/* Boutons d'action */}
        {!isPast && (
          <div className={styles.actions}>
            <button
              className={`${styles.actionButton} ${styles.removeButton}`}
              onClick={(e) => {
                e.stopPropagation();
                onRemove && onRemove();
              }}
              title="Retirer"
            >
              ✕
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
