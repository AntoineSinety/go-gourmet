import { useState, useRef } from 'react';
import styles from './ImageUpload.module.css';

const ImageUpload = ({ currentImage, onImageSelect, onImageRemove, label = "Image" }) => {
  const [preview, setPreview] = useState(currentImage);
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Vérifier le type
    if (!file.type.startsWith('image/')) {
      alert('Veuillez sélectionner une image valide');
      return;
    }

    // Vérifier la taille (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('L\'image ne doit pas dépasser 5MB');
      return;
    }

    // Créer un aperçu
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(file);

    // Appeler le callback
    onImageSelect(file);
  };

  const handleRemove = () => {
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (onImageRemove) {
      onImageRemove();
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={styles.container}>
      <label className={styles.label}>{label}</label>

      <div className={styles.uploadArea}>
        {preview ? (
          <div className={styles.preview}>
            <img src={preview} alt="Preview" className={styles.previewImage} />
            <div className={styles.previewOverlay}>
              <button
                type="button"
                onClick={handleClick}
                className={styles.changeButton}
              >
                Changer
              </button>
              <button
                type="button"
                onClick={handleRemove}
                className={styles.removeButton}
              >
                Supprimer
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleClick}
            className={styles.uploadButton}
          >
            <span className={styles.uploadIcon}>📷</span>
            <span>Ajouter une image</span>
            <span className={styles.uploadHint}>JPG, PNG (max 5MB)</span>
          </button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className={styles.fileInput}
      />
    </div>
  );
};

export default ImageUpload;
