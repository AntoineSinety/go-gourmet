import { useState, useEffect, useRef } from 'react';
import styles from './OptimizedImage.module.css';

/**
 * Composant d'image optimisé avec lazy loading et skeleton
 *
 * @param {string} src - URL de l'image
 * @param {string} alt - Texte alternatif
 * @param {string} fallbackIcon - Emoji ou icône de fallback (défaut: '🍳')
 * @param {string} fallbackGradient - Gradient CSS de fallback
 * @param {string} className - Classes CSS additionnelles
 * @param {object} style - Styles inline additionnels
 * @param {boolean} asBackground - Utiliser comme background-image au lieu de <img>
 * @param {function} onClick - Handler de clic
 * @param {React.ReactNode} children - Contenu enfant (pour mode background)
 */
const OptimizedImage = ({
  src,
  alt = '',
  fallbackIcon = '🍳',
  fallbackGradient = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  className = '',
  style = {},
  asBackground = false,
  onClick,
  children
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [hasError, setHasError] = useState(false);
  const containerRef = useRef(null);
  const imgRef = useRef(null);

  // Observer pour le lazy loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '100px', // Précharger 100px avant d'être visible
        threshold: 0.01
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Charger l'image quand elle est dans le viewport
  useEffect(() => {
    if (!isInView || !src || hasError) return;

    // Pour le mode background, on précharge l'image
    if (asBackground) {
      const img = new Image();
      img.onload = () => setIsLoaded(true);
      img.onerror = () => setHasError(true);
      img.src = src;
    }
  }, [isInView, src, asBackground, hasError]);

  const handleImageLoad = () => {
    setIsLoaded(true);
  };

  const handleImageError = () => {
    setHasError(true);
  };

  const showFallback = !src || hasError;
  const showSkeleton = !isLoaded && !showFallback && isInView;

  // Mode background-image
  if (asBackground) {
    return (
      <div
        ref={containerRef}
        className={`${styles.container} ${className}`}
        style={{
          ...style,
          backgroundImage: isLoaded && !showFallback ? `url(${src})` : fallbackGradient
        }}
        onClick={onClick}
      >
        {showSkeleton && <div className={styles.skeleton} />}
        {showFallback && (
          <div className={styles.fallbackIcon}>{fallbackIcon}</div>
        )}
        {children}
      </div>
    );
  }

  // Mode <img> standard
  return (
    <div
      ref={containerRef}
      className={`${styles.container} ${className}`}
      style={style}
      onClick={onClick}
    >
      {showSkeleton && <div className={styles.skeleton} />}

      {showFallback ? (
        <div
          className={styles.fallback}
          style={{ background: fallbackGradient }}
        >
          <div className={styles.fallbackIcon}>{fallbackIcon}</div>
        </div>
      ) : (
        isInView && (
          <img
            ref={imgRef}
            src={src}
            alt={alt}
            className={`${styles.image} ${isLoaded ? styles.imageLoaded : ''}`}
            onLoad={handleImageLoad}
            onError={handleImageError}
          />
        )
      )}
      {children}
    </div>
  );
};

export default OptimizedImage;
