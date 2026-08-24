import { useState } from 'react';
import { Plus, Users, ShoppingCart, Trash2, MoreVertical, Pin, Pencil } from 'lucide-react';
import { getRecipeTypeById } from '../utils/recipeTypes';
import OptimizedImage from './OptimizedImage';
import { Button, Modal, Stepper } from './ui';
import styles from './MealSlot.module.css';

/**
 * Créneau du planning, dans ses cinq états : vide, rempli, passé,
 * repas libre et plat étalé sur plusieurs jours.
 *
 * variant : grid (cellule de la grille desktop) | row (ligne de la vue liste)
 */
const MealSlot = ({
  meal,
  slotType,
  slotId,
  isPast,
  variant = 'grid',
  onAdd,
  onEdit,
  onRemove,
  onViewRecipe,
  onDragStart,
  onDragEnd,
  onDrop
}) => {
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const isEmpty = !meal || !meal.recipeName;
  const isCustomMeal = meal?.isCustom || !meal?.recipeId;
  const slotLabel = slotType === 'lunch' ? 'Midi' : 'Soir';

  const dragHandlers = {
    onDragOver: (e) => {
      if (isPast) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      setIsDragOver(true);
    },
    onDragLeave: () => setIsDragOver(false),
    onDrop: (e) => {
      if (isPast) return;
      e.preventDefault();
      setIsDragOver(false);
      const sourceSlotId = e.dataTransfer.getData('text/plain');
      if (sourceSlotId && sourceSlotId !== slotId) onDrop?.(sourceSlotId, slotId);
    }
  };

  // ---------- Créneau vide ----------
  if (isEmpty) {
    if (isPast) {
      return (
        <div className={`${styles.slot} ${styles[variant]} ${styles.empty} ${styles.past}`}>
          <span className={styles.pastLabel}>passé · vide</span>
        </div>
      );
    }

    return (
      <button
        type="button"
        className={`${styles.slot} ${styles[variant]} ${styles.empty} ${isDragOver ? styles.dropTarget : ''}`}
        onClick={onAdd}
        {...dragHandlers}
      >
        <Plus size={variant === 'grid' ? 16 : 15} strokeWidth={2.4} />
        <span className={styles.emptyLabel}>{isDragOver ? 'Déposer ici' : 'Ajouter'}</span>
      </button>
    );
  }

  const type = getRecipeTypeById(meal.recipeType || 'plat');

  const openRecipe = () => {
    if (isPast || isCustomMeal) return;
    onViewRecipe?.(meal.recipeId);
  };

  const options = (
    <Modal
      open={optionsOpen}
      onClose={() => setOptionsOpen(false)}
      title={meal.recipeName}
      subtitle={`${slotLabel} · ${meal.servings || 2} personne${(meal.servings || 2) > 1 ? 's' : ''}`}
      size="sm"
    >
      <div className={styles.options}>
        <div className={styles.optionRow}>
          <div>
            <div className={styles.optionLabel}>Portions</div>
            <p className={styles.optionHint}>Ajuste les quantités dans la liste de courses.</p>
          </div>
          <Stepper
            value={meal.servings || 2}
            onChange={(value) => onEdit?.({ ...meal, servings: value })}
            min={1}
            max={50}
            label="Portions"
          />
        </div>

        <div className={styles.optionRow}>
          <div>
            <div className={styles.optionLabel}>Compter dans les courses</div>
            <p className={styles.optionHint}>
              {meal.skipShoppingList
                ? 'Ce repas est exclu de la liste.'
                : 'Les ingrédients partent dans la liste.'}
            </p>
          </div>
          <Button
            variant={meal.skipShoppingList ? 'secondary' : 'primary'}
            size="sm"
            icon={ShoppingCart}
            onClick={() => onEdit?.({ ...meal, skipShoppingList: !meal.skipShoppingList })}
          >
            {meal.skipShoppingList ? 'Exclu' : 'Inclus'}
          </Button>
        </div>

        <Button
          variant="danger"
          size="md"
          icon={Trash2}
          fullWidth
          onClick={() => {
            setOptionsOpen(false);
            onRemove?.();
          }}
        >
          Retirer du planning
        </Button>
      </div>
    </Modal>
  );

  const thumb = (
    <span className={styles.thumbWrap}>
      {isCustomMeal ? (
        <span className={styles.customThumb}>
          <Pencil size={variant === 'grid' ? 18 : 20} strokeWidth={2} />
        </span>
      ) : (
        <OptimizedImage
          src={meal.recipeImageUrl}
          alt=""
          asBackground
          caption=""
          placeholder={<span className={styles.thumbEmoji}>{type.icon}</span>}
          className={styles.thumb}
        />
      )}
      {meal.isMultiDay && (
        <span className={styles.multiDay}>
          <Pin size={10} strokeWidth={2.4} />
          {meal.multiDayIndex}/{meal.multiDayCount}
        </span>
      )}
    </span>
  );

  const meta = isCustomMeal
    ? 'Repas libre'
    : `${meal.servings || 2} pers.${meal.skipShoppingList ? ' · hors courses' : ''}`;

  // ---------- Vue liste (mobile) ----------
  if (variant === 'row') {
    return (
      <>
        <div
          className={`${styles.slot} ${styles.row} ${styles.filled} ${isPast ? styles.past : ''} ${isDragOver ? styles.dropTarget : ''}`}
          {...dragHandlers}
        >
          <button type="button" className={styles.rowMain} onClick={openRecipe}>
            {thumb}
            <span className={styles.rowText}>
              <span className={styles.name}>{meal.recipeName}</span>
              <span className={styles.meta}>{meta}</span>
            </span>
          </button>
          {!isPast && (
            <button
              type="button"
              className={styles.rowOptions}
              onClick={() => setOptionsOpen(true)}
              aria-label={`Options du repas ${meal.recipeName}`}
            >
              <MoreVertical size={16} strokeWidth={2} />
            </button>
          )}
        </div>
        {options}
      </>
    );
  }

  // ---------- Vue grille (desktop) ----------
  return (
    <>
      <div
        className={`${styles.slot} ${styles.grid} ${styles.filled} ${isPast ? styles.past : ''} ${isCustomMeal ? styles.custom : ''} ${isDragging ? styles.dragSource : ''} ${isDragOver ? styles.dropTarget : ''}`}
        draggable={!isPast}
        onDragStart={(e) => {
          if (isPast) return;
          e.dataTransfer.effectAllowed = 'move';
          e.dataTransfer.setData('text/plain', slotId);
          setIsDragging(true);
          onDragStart?.(slotId, meal);
        }}
        onDragEnd={() => {
          setIsDragging(false);
          setIsDragOver(false);
          onDragEnd?.();
        }}
        {...dragHandlers}
      >
        <button type="button" className={styles.gridMain} onClick={openRecipe}>
          {isCustomMeal ? (
            <span className={styles.customBadge}>
              <Pencil size={11} strokeWidth={2.4} />
              Repas libre
            </span>
          ) : (
            thumb
          )}
          <span className={styles.name}>{meal.recipeName}</span>
          {!isCustomMeal && <span className={styles.meta}>{meta}</span>}
        </button>

        {!isPast && (
          <div className={styles.hoverActions}>
            <button
              type="button"
              className={styles.hoverButton}
              onClick={() => setOptionsOpen(true)}
              aria-label="Modifier les portions"
            >
              <Users size={16} strokeWidth={2} />
            </button>
            <button
              type="button"
              className={`${styles.hoverButton} ${meal.skipShoppingList ? styles.hoverOff : ''}`}
              onClick={() => onEdit?.({ ...meal, skipShoppingList: !meal.skipShoppingList })}
              aria-label={
                meal.skipShoppingList
                  ? 'Réintégrer dans la liste de courses'
                  : 'Retirer de la liste de courses'
              }
            >
              <ShoppingCart size={16} strokeWidth={2} />
            </button>
            <button
              type="button"
              className={`${styles.hoverButton} ${styles.hoverDanger}`}
              onClick={onRemove}
              aria-label="Retirer ce repas"
            >
              <Trash2 size={16} strokeWidth={2} />
            </button>
          </div>
        )}

        {isDragOver && (
          <div className={styles.dropHint}>
            <Plus size={20} strokeWidth={2.2} />
            Déposer ici
          </div>
        )}
      </div>
      {options}
    </>
  );
};

export default MealSlot;
