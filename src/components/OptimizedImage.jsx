import { useState, useEffect, useRef } from 'react';
import { ImageOff } from 'lucide-react';
import styles from './OptimizedImage.module.css';

/**
 * Image avec chargement différé, squelette de chargement et placeholder de marque.
 *
 * Quand la photo manque, on n'affiche plus un dégradé générique mais le
 * placeholder du design system : aplat sourd, icône linéaire, mention discrète.
 *
 * @param {string} src - URL de l'image
 * @param {string} alt - Texte alternatif
 * @param {string} caption - Mention affichée sous l'icône du placeholder
 * @param {React.ReactNode} placeholder - Placeholder personnalisé
 * @param {boolean} asBackground - Utiliser comme background-image au lieu de <img>
 * @param {React.ReactNode} children - Contenu superposé (mode background)
 */
const OptimizedImage = ({
  src,
  alt = '',
  caption = 'aucune photo',
  placeholder,
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
        rootMargin: '150px',
        threshold: 0.01
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isInView || !src || hasError || !asBackground) return;

    const img = new Image();
    img.onload = () => setIsLoaded(true);
    img.onerror = () => setHasError(true);
    img.src = src;
  }, [isInView, src, asBackground, hasError]);

  const showFallback = !src || hasError;
  const showSkeleton = !isLoaded && !showFallback && isInView;

  const fallbackContent =
    placeholder !== undefined ? (
      placeholder
    ) : (
      <div className={styles.placeholder}>
        <ImageOff size={30} strokeWidth={1.5} />
        {caption && <span className={styles.caption}>{caption}</span>}
      </div>
    );

  if (asBackground) {
    return (
      <div
        ref={containerRef}
        className={`${styles.container} ${showFallback ? styles.empty : ''} ${className}`}
        style={{
          ...style,
          backgroundImage: isLoaded && !showFallback ? `url(${src})` : undefined
        }}
        onClick={onClick}
      >
        {showSkeleton && <div className={styles.skeleton} />}
        {showFallback && fallbackContent}
        {children}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`${styles.container} ${showFallback ? styles.empty : ''} ${className}`}
      style={style}
      onClick={onClick}
    >
      {showSkeleton && <div className={styles.skeleton} />}

      {showFallback
        ? fallbackContent
        : isInView && (
            <img
              src={src}
              alt={alt}
              className={`${styles.image} ${isLoaded ? styles.imageLoaded : ''}`}
              onLoad={() => setIsLoaded(true)}
              onError={() => setHasError(true)}
            />
          )}
      {children}
    </div>
  );
};

export default OptimizedImage;
