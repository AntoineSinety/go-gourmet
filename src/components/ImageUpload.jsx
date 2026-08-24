import { useState, useRef } from 'react';
import { ImagePlus, Upload, X } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import styles from './ImageUpload.module.css';

const MAX_SIZE = 5 * 1024 * 1024;

const formatSize = (bytes) => {
  const mo = bytes / (1024 * 1024);
  return `${mo.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} Mo`;
};

/**
 * Zone de dépôt de photo : dropzone en pointillés quand elle est vide,
 * aperçu 16:9 avec actions superposées une fois la photo choisie.
 */
const ImageUpload = ({ currentImage, onImageSelect, onImageRemove, label = 'Photo' }) => {
  const [preview, setPreview] = useState(currentImage);
  const [meta, setMeta] = useState(null);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef(null);
  const toast = useToast();

  const acceptFile = (file) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Ce fichier n’est pas une image');
      return;
    }

    if (file.size > MAX_SIZE) {
      toast.error(`Photo trop lourde (${formatSize(file.size)}, max 5 Mo)`);
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result);
    reader.readAsDataURL(file);

    setMeta({ name: file.name, size: formatSize(file.size) });
    onImageSelect(file);
  };

  const handleRemove = () => {
    setPreview(null);
    setMeta(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    onImageRemove?.();
  };

  const openPicker = () => fileInputRef.current?.click();

  return (
    <div className={styles.container}>
      <span className={styles.label}>{label}</span>

      {preview ? (
        <div className={styles.preview}>
          <img src={preview} alt="Aperçu de la photo" className={styles.previewImage} />
          <div className={styles.previewActions}>
            <button type="button" className={styles.previewButton} onClick={openPicker}>
              <Upload size={15} strokeWidth={2} />
              Remplacer
            </button>
            <button
              type="button"
              className={`${styles.previewButton} ${styles.previewRemove}`}
              onClick={handleRemove}
              aria-label="Retirer la photo"
            >
              <X size={16} strokeWidth={2.4} />
            </button>
          </div>
          {meta && (
            <span className={styles.caption}>
              {meta.name} · {meta.size}
            </span>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={openPicker}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            acceptFile(e.dataTransfer.files?.[0]);
          }}
          className={`${styles.dropzone} ${dragging ? styles.dragging : ''}`}
        >
          <span className={styles.dropIcon}>
            <ImagePlus size={26} strokeWidth={1.6} />
          </span>
          <span className={styles.dropTitle}>Ajouter une photo</span>
          <span className={styles.dropHint}>JPG ou PNG · 5 Mo maximum</span>
        </button>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => acceptFile(e.target.files[0])}
        className={styles.fileInput}
      />
    </div>
  );
};

export default ImageUpload;
