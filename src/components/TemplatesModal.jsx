import { useState, useEffect, useCallback } from 'react';
import { useMealPlan } from '../contexts/MealPlanContext';
import { useToast } from '../contexts/ToastContext';
import { CalendarRange, Trash2, AlertTriangle, BookMarked } from 'lucide-react';
import { Modal, Button, Input, EmptyState, Skeleton } from './ui';
import styles from './TemplatesModal.module.css';

const formatDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
};

/**
 * Modèles de semaine : enregistrer la semaine affichée, appliquer un modèle
 * existant, supprimer un modèle.
 */
const TemplatesModal = ({ isOpen, onClose }) => {
  const { mealPlan, createTemplate, getTemplates, applyTemplate, deleteTemplate } = useMealPlan();
  const toast = useToast();

  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [pendingApply, setPendingApply] = useState(null);

  const loadTemplates = useCallback(async () => {
    setLoading(true);
    try {
      setTemplates(await getTemplates());
    } catch (error) {
      console.error('Error loading templates:', error);
      toast.error('Impossible de charger les modèles');
    } finally {
      setLoading(false);
    }
  }, [getTemplates, toast]);

  useEffect(() => {
    if (isOpen) loadTemplates();
  }, [isOpen, loadTemplates]);

  const hasMeals = mealPlan && Object.keys(mealPlan.meals || {}).length > 0;

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    try {
      await createTemplate(name.trim(), '');
      toast.success(`Modèle « ${name.trim()} » enregistré`);
      setName('');
      await loadTemplates();
    } catch (error) {
      console.error('Error saving template:', error);
      toast.error('Erreur lors de la sauvegarde du modèle');
    } finally {
      setSaving(false);
    }
  };

  const handleApply = async () => {
    const template = pendingApply;
    setPendingApply(null);

    try {
      await applyTemplate(template.id);
      toast.success(`Modèle « ${template.name} » appliqué`);
      onClose();
    } catch (error) {
      console.error('Error applying template:', error);
      toast.error("Erreur lors de l'application du modèle");
    }
  };

  const handleDelete = async () => {
    const template = pendingDelete;
    setPendingDelete(null);

    try {
      await deleteTemplate(template.id);
      toast.success('Modèle supprimé');
      await loadTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
      toast.error('Erreur lors de la suppression du modèle');
    }
  };

  return (
    <>
      <Modal open={isOpen} onClose={onClose} title="Modèles de semaine" size="sm">
        <div className={styles.body}>
          <form className={styles.saveCard} onSubmit={handleSave}>
            <div className={styles.saveTitle}>
              {mealPlan
                ? `Enregistrer la semaine ${mealPlan.weekNumber} comme modèle`
                : 'Enregistrer la semaine comme modèle'}
            </div>
            <div className={styles.saveRow}>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nom du modèle"
                aria-label="Nom du modèle"
                disabled={!hasMeals}
              />
              <Button
                type="submit"
                variant="primary"
                loading={saving}
                disabled={!hasMeals || !name.trim()}
              >
                Enregistrer
              </Button>
            </div>
            {!hasMeals && (
              <p className={styles.saveHint}>
                Ajoutez au moins un repas à la semaine avant d’en faire un modèle.
              </p>
            )}
          </form>

          <div className={styles.listLabel}>
            {loading
              ? 'Chargement…'
              : `${templates.length} modèle${templates.length > 1 ? 's' : ''}`}
          </div>

          {loading ? (
            <div className={styles.skeletons}>
              <Skeleton variant="block" height={62} />
              <Skeleton variant="block" height={62} />
            </div>
          ) : templates.length === 0 ? (
            <EmptyState
              size="sm"
              icon={BookMarked}
              title="Aucun modèle"
              description="Enregistrez une semaine que vous aimez pour la rejouer plus tard."
            />
          ) : (
            <ul className={styles.list}>
              {templates.map((template) => {
                const slots = Object.keys(template.meals || {}).length;
                const updated = formatDate(template.updatedAt || template.createdAt);

                return (
                  <li key={template.id} className={styles.template}>
                    <span className={styles.templateIcon}>
                      <CalendarRange size={18} strokeWidth={2} />
                    </span>
                    <span className={styles.templateText}>
                      <span className={styles.templateName}>{template.name}</span>
                      <span className={styles.templateMeta}>
                        {slots} créneau{slots > 1 ? 'x' : ''}
                        {updated ? ` · maj. ${updated}` : ''}
                      </span>
                    </span>
                    <Button variant="secondary" size="sm" onClick={() => setPendingApply(template)}>
                      Appliquer
                    </Button>
                    <button
                      type="button"
                      className={styles.templateDelete}
                      onClick={() => setPendingDelete(template)}
                      aria-label={`Supprimer le modèle ${template.name}`}
                    >
                      <Trash2 size={16} strokeWidth={2} />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          <p className={styles.warning}>
            <AlertTriangle size={15} strokeWidth={2.2} />
            Appliquer un modèle remplace les créneaux de la semaine affichée.
          </p>
        </div>
      </Modal>

      <Modal
        open={!!pendingApply}
        onClose={() => setPendingApply(null)}
        title="Appliquer ce modèle ?"
        size="sm"
        footer={
          <>
            <Button variant="secondary" fullWidth onClick={() => setPendingApply(null)}>
              Annuler
            </Button>
            <Button variant="primary" fullWidth onClick={handleApply}>
              Appliquer
            </Button>
          </>
        }
      >
        <p className={styles.confirmText}>
          Le planning de la semaine affichée sera remplacé par « {pendingApply?.name} ».
        </p>
      </Modal>

      <Modal
        open={!!pendingDelete}
        onClose={() => setPendingDelete(null)}
        title="Supprimer ce modèle ?"
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
          « {pendingDelete?.name} » sera supprimé définitivement pour tous les membres du foyer.
        </p>
      </Modal>
    </>
  );
};

export default TemplatesModal;
