import { DndContext, closestCenter, PointerSensor, KeyboardSensor, useSensor, useSensors } from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, ChevronDown, ChevronUp, Trash2, Plus } from 'lucide-react';
import { INGREDIENT_CATEGORIES } from '../contexts/IngredientContext';
import { toneVars } from '../utils/palette';
import VoiceInput from './VoiceInput';
import styles from './StepEditor.module.css';

const getCategory = (id) =>
  INGREDIENT_CATEGORIES.find((c) => c.id === id) ||
  INGREDIENT_CATEGORIES[INGREDIENT_CATEGORIES.length - 1];

const StepCard = ({
  step,
  index,
  expanded,
  onExpand,
  onUpdate,
  onRemove,
  ingredients,
  canRemove
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: step.id
  });

  const style = {
    // Déplacement vertical uniquement : la liste d'étapes est une colonne.
    transform: CSS.Translate.toString(transform ? { ...transform, x: 0 } : null),
    transition,
    zIndex: isDragging ? 2 : undefined
  };

  const attached = ingredients.filter((ing) => step.ingredientIds?.includes(ing.ingredientId));

  const toggleIngredient = (ingredientId) => {
    const current = step.ingredientIds || [];
    onUpdate(
      'ingredientIds',
      current.includes(ingredientId)
        ? current.filter((id) => id !== ingredientId)
        : [...current, ingredientId]
    );
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${styles.card} ${expanded ? styles.expanded : ''} ${isDragging ? styles.dragging : ''}`}
    >
      <div className={styles.head}>
        <button
          type="button"
          className={styles.handle}
          aria-label={`Déplacer l'étape ${index + 1}`}
          {...attributes}
          {...listeners}
        >
          <GripVertical size={16} strokeWidth={2} />
        </button>

        <button type="button" className={styles.headMain} onClick={onExpand} aria-expanded={expanded}>
          <span className={styles.number}>{index + 1}</span>
          <span className={styles.summary}>
            {expanded
              ? `Étape ${index + 1}`
              : step.instruction?.trim() || <span className={styles.placeholder}>Étape vide</span>}
          </span>
          {expanded ? (
            <ChevronUp size={16} strokeWidth={2} className={styles.chevron} />
          ) : (
            <ChevronDown size={16} strokeWidth={2} className={styles.chevron} />
          )}
        </button>
      </div>

      {!expanded && attached.length > 0 && (
        <div className={styles.collapsedTags}>
          {attached.map((ing) => {
            const category = getCategory(ing.category);
            return (
              <span key={ing.ingredientId} className={styles.miniTag} style={toneVars(category.tone)}>
                {category.icon} {ing.name}
              </span>
            );
          })}
        </div>
      )}

      {expanded && (
        <div className={styles.body}>
          <VoiceInput
            value={step.instruction}
            onChange={(value) => onUpdate('instruction', value)}
            rows={4}
            placeholder="Décrivez cette étape, ou dictez-la…"
          />

          {ingredients.length > 0 && (
            <div className={styles.attach}>
              <span className={styles.attachLabel}>Ingrédients de cette étape</span>
              <div className={styles.attachList}>
                {ingredients.map((ing) => {
                  const category = getCategory(ing.category);
                  const isAttached = step.ingredientIds?.includes(ing.ingredientId);
                  return (
                    <button
                      key={ing.ingredientId}
                      type="button"
                      onClick={() => toggleIngredient(ing.ingredientId)}
                      aria-pressed={isAttached}
                      className={`${styles.attachChip} ${isAttached ? styles.attachChipOn : ''}`}
                      style={toneVars(category.tone)}
                    >
                      {category.icon} {ing.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {canRemove && (
            <button type="button" className={styles.removeStep} onClick={onRemove}>
              <Trash2 size={15} strokeWidth={2} />
              Supprimer cette étape
            </button>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * Éditeur d'étapes : accordéon (une seule étape ouverte à la fois),
 * réordonnable au glisser-déposer, avec rattachement d'ingrédients et dictée.
 */
const StepEditor = ({ steps, ingredients, expandedStep, onExpandStep, onChange }) => {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return;

    const from = steps.findIndex((s) => s.id === active.id);
    const to = steps.findIndex((s) => s.id === over.id);
    if (from === -1 || to === -1) return;

    onChange(arrayMove(steps, from, to).map((step, index) => ({ ...step, order: index })));
    onExpandStep(to);
  };

  const updateStep = (index, field, value) =>
    onChange(steps.map((step, idx) => (idx === index ? { ...step, [field]: value } : step)));

  const removeStep = (index) => {
    if (steps.length === 1) return;
    onChange(steps.filter((_, idx) => idx !== index).map((step, idx) => ({ ...step, order: idx })));
    onExpandStep(Math.max(0, index - 1));
  };

  const addStep = () => {
    onChange([
      ...steps,
      {
        id: `step-${Date.now()}`,
        order: steps.length,
        instruction: '',
        ingredientIds: []
      }
    ]);
    onExpandStep(steps.length);
  };

  return (
    <div className={styles.editor}>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={steps.map((s) => s.id)} strategy={verticalListSortingStrategy}>
          <div className={styles.list}>
            {steps.map((step, index) => (
              <StepCard
                key={step.id}
                step={step}
                index={index}
                expanded={expandedStep === index}
                onExpand={() => onExpandStep(expandedStep === index ? -1 : index)}
                onUpdate={(field, value) => updateStep(index, field, value)}
                onRemove={() => removeStep(index)}
                ingredients={ingredients}
                canRemove={steps.length > 1}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <button type="button" className={styles.addStep} onClick={addStep}>
        <Plus size={17} strokeWidth={2.4} />
        Ajouter une étape
      </button>
    </div>
  );
};

export default StepEditor;
