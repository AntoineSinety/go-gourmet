import { useEffect, useRef } from 'react';

/**
 * Hook pour sauvegarder et restaurer automatiquement la position de scroll
 * @param {string} key - Clé unique pour identifier la position (ex: 'recipes', 'ingredients')
 * @param {Array} deps - Dépendances pour déclencher la restauration
 */
export const useScrollRestoration = (key, deps = []) => {
  const isRestoredRef = useRef(false);

  // Sauvegarder la position avant le rafraîchissement
  useEffect(() => {
    const saveScrollPosition = () => {
      const scrollPositions = JSON.parse(sessionStorage.getItem('scrollPositions') || '{}');
      scrollPositions[key] = {
        x: window.scrollX,
        y: window.scrollY,
        timestamp: Date.now()
      };
      sessionStorage.setItem('scrollPositions', JSON.stringify(scrollPositions));
    };

    // Sauvegarder à chaque scroll (avec debounce via passive)
    let scrollTimeout;
    const handleScroll = () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(saveScrollPosition, 100);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('beforeunload', saveScrollPosition);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('beforeunload', saveScrollPosition);
      clearTimeout(scrollTimeout);
    };
  }, [key]);

  // Restaurer la position au chargement
  useEffect(() => {
    if (isRestoredRef.current) return;

    const scrollPositions = JSON.parse(sessionStorage.getItem('scrollPositions') || '{}');
    const savedPosition = scrollPositions[key];

    if (savedPosition) {
      // Vérifier que la position n'est pas trop ancienne (>5 minutes)
      const isRecent = Date.now() - savedPosition.timestamp < 5 * 60 * 1000;

      if (isRecent) {
        // Attendre que le contenu soit chargé
        requestAnimationFrame(() => {
          setTimeout(() => {
            window.scrollTo(savedPosition.x, savedPosition.y);
            isRestoredRef.current = true;
          }, 100);
        });
      } else {
        // Nettoyer les anciennes positions
        delete scrollPositions[key];
        sessionStorage.setItem('scrollPositions', JSON.stringify(scrollPositions));
      }
    }
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps

  // Réinitialiser le flag quand la clé change
  useEffect(() => {
    isRestoredRef.current = false;
  }, [key]);
};

/**
 * Hook pour sauvegarder et restaurer l'état de navigation
 * @param {string} key - Clé unique pour l'état
 * @param {*} initialState - État initial
 * @returns {[*, Function]} - [state, setState]
 */
export const usePersistedState = (key, initialState) => {
  // Récupérer l'état sauvegardé
  const getInitialState = () => {
    try {
      const savedState = sessionStorage.getItem(`state_${key}`);
      if (savedState) {
        const parsed = JSON.parse(savedState);
        // Vérifier que l'état n'est pas trop ancien (>30 minutes)
        if (Date.now() - parsed.timestamp < 30 * 60 * 1000) {
          return parsed.value;
        }
      }
    } catch (error) {
      console.error('Error loading persisted state:', error);
    }
    return initialState;
  };

  const savedValue = getInitialState();

  // Sauvegarder l'état
  const setValue = (value) => {
    try {
      const stateToSave = {
        value,
        timestamp: Date.now()
      };
      sessionStorage.setItem(`state_${key}`, JSON.stringify(stateToSave));
    } catch (error) {
      console.error('Error saving state:', error);
    }
  };

  return [savedValue, setValue];
};

/**
 * Hook pour synchroniser l'état avec l'URL et sessionStorage
 * @param {string} key - Clé unique pour l'état
 * @param {*} initialState - État initial
 * @param {Object} options - Options de configuration
 * @param {Function} options.serializeToUrl - Fonction pour convertir l'état en paramètres URL
 * @param {Function} options.deserializeFromUrl - Fonction pour lire l'état depuis l'URL
 * @returns {[*, Function]} - [state, setState]
 */
export const useUrlPersistedState = (key, initialState, options = {}) => {
  const { serializeToUrl, deserializeFromUrl } = options;

  // Récupérer l'état initial depuis URL ou sessionStorage
  const getInitialState = () => {
    // 1. Essayer depuis l'URL d'abord
    if (deserializeFromUrl) {
      const urlState = deserializeFromUrl();
      if (urlState && Object.keys(urlState).length > 0) {
        return { ...initialState, ...urlState };
      }
    }

    // 2. Sinon depuis sessionStorage
    try {
      const savedState = sessionStorage.getItem(`state_${key}`);
      if (savedState) {
        const parsed = JSON.parse(savedState);
        if (Date.now() - parsed.timestamp < 30 * 60 * 1000) {
          return parsed.value;
        }
      }
    } catch (error) {
      console.error('Error loading persisted state:', error);
    }

    return initialState;
  };

  const savedValue = getInitialState();

  // Sauvegarder l'état dans sessionStorage et URL
  const setValue = (value) => {
    try {
      // Sauvegarder dans sessionStorage
      const stateToSave = {
        value,
        timestamp: Date.now()
      };
      sessionStorage.setItem(`state_${key}`, JSON.stringify(stateToSave));

      // Mettre à jour l'URL si la fonction est fournie
      if (serializeToUrl) {
        serializeToUrl(value);
      }
    } catch (error) {
      console.error('Error saving state:', error);
    }
  };

  return [savedValue, setValue];
};
