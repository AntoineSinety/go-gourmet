import { useState, useEffect } from 'react';
import { useMealPlan } from '../contexts/MealPlanContext';
import { BookOpen, X, Save, Check, Trash2, UtensilsCrossed, Plus } from 'lucide-react';
import styles from './TemplatesModal.module.css';

const TemplatesModal = ({ isOpen, onClose }) => {
  const { mealPlan, createTemplate, getTemplates, applyTemplate, deleteTemplate } = useMealPlan();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    description: ''
  });

  // Charger les modèles au montage
  useEffect(() => {
    if (isOpen) {
      loadTemplates();
    }
  }, [isOpen]);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const data = await getTemplates();
      setTemplates(data);
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTemplate = async (e) => {
    e.preventDefault();
    if (!newTemplate.name.trim()) return;

    try {
      await createTemplate(newTemplate.name.trim(), newTemplate.description.trim());
      setNewTemplate({ name: '', description: '' });
      setShowSaveForm(false);
      await loadTemplates();
    } catch (error) {
      console.error('Error saving template:', error);
      alert('Erreur lors de la sauvegarde du modèle');
    }
  };

  const handleApplyTemplate = async (templateId) => {
    if (!confirm('Appliquer ce modèle remplacera le planning actuel. Continuer ?')) {
      return;
    }

    try {
      await applyTemplate(templateId);
      onClose();
    } catch (error) {
      console.error('Error applying template:', error);
      alert('Erreur lors de l\'application du modèle');
    }
  };

  const handleDeleteTemplate = async (templateId, templateName) => {
    if (!confirm(`Supprimer le modèle "${templateName}" ? Cette action est irréversible.`)) {
      return;
    }

    try {
      await deleteTemplate(templateId);
      await loadTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
      alert('Erreur lors de la suppression du modèle');
    }
  };

  if (!isOpen) return null;

  const hasMeals = mealPlan && Object.keys(mealPlan.meals || {}).length > 0;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <h2><BookOpen size={20} style={{ marginRight: '8px', verticalAlign: 'middle' }} />Modèles de Planning</h2>
          <button onClick={onClose} className={styles.closeButton}><X size={18} /></button>
        </div>

        {/* Content */}
        <div className={styles.content}>
          {/* Bouton sauvegarder */}
          <div className={styles.saveSection}>
            {!showSaveForm ? (
              <button
                onClick={() => setShowSaveForm(true)}
                className={styles.saveButton}
                disabled={!hasMeals}
                title={!hasMeals ? 'Ajoutez des repas avant de sauvegarder' : ''}
              >
                <Save size={16} style={{ marginRight: '6px' }} />Sauvegarder le planning actuel
              </button>
            ) : (
              <form onSubmit={handleSaveTemplate} className={styles.saveForm}>
                <div className={styles.formGroup}>
                  <label>Nom du modèle *</label>
                  <input
                    type="text"
                    value={newTemplate.name}
                    onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                    placeholder="Ex: Semaine équilibrée"
                    required
                    autoFocus
                    className={styles.input}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Description (optionnel)</label>
                  <textarea
                    value={newTemplate.description}
                    onChange={(e) => setNewTemplate({ ...newTemplate, description: e.target.value })}
                    placeholder="Ex: Planning équilibré avec des repas variés"
                    rows={2}
                    className={styles.textarea}
                  />
                </div>
                <div className={styles.formButtons}>
                  <button type="submit" className={styles.submitButton}>
                    Sauvegarder
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowSaveForm(false);
                      setNewTemplate({ name: '', description: '' });
                    }}
                    className={styles.cancelButton}
                  >
                    Annuler
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Liste des modèles */}
          <div className={styles.templatesSection}>
            <h3 className={styles.sectionTitle}>Modèles enregistrés</h3>

            {loading ? (
              <div className={styles.loading}>Chargement...</div>
            ) : templates.length === 0 ? (
              <div className={styles.empty}>
                <p>Aucun modèle enregistré</p>
                <p className={styles.emptyHint}>
                  Créez votre premier modèle en sauvegardant le planning actuel
                </p>
              </div>
            ) : (
              <div className={styles.templatesList}>
                {templates.map(template => (
                  <div key={template.id} className={styles.templateCard}>
                    <div className={styles.templateInfo}>
                      <h4 className={styles.templateName}>{template.name}</h4>
                      {template.description && (
                        <p className={styles.templateDescription}>{template.description}</p>
                      )}
                      <div className={styles.templateMeta}>
                        <span className={styles.metaItem}>
                          <UtensilsCrossed size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }} />{Object.keys(template.meals || {}).length} repas
                        </span>
                        {template.extras?.length > 0 && (
                          <span className={styles.metaItem}>
                            <Plus size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }} />{template.extras.length} extra{template.extras.length > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                      <div className={styles.templateDate}>
                        Créé le {new Date(template.createdAt).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </div>
                    </div>
                    <div className={styles.templateActions}>
                      <button
                        onClick={() => handleApplyTemplate(template.id)}
                        className={styles.applyButton}
                        title="Appliquer ce modèle"
                      >
                        <Check size={14} style={{ marginRight: '4px' }} />Appliquer
                      </button>
                      <button
                        onClick={() => handleDeleteTemplate(template.id, template.name)}
                        className={styles.deleteButton}
                        title="Supprimer ce modèle"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemplatesModal;
