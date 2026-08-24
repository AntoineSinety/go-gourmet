import { useEffect } from 'react';

/**
 * Comportement partagé des surfaces superposées (modale, sheet, panneau) :
 * fermeture au clavier et verrouillage du défilement de la page.
 */
export const useOverlay = (open, onClose) => {
  useEffect(() => {
    if (!open) return undefined;

    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose?.();
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open, onClose]);
};

export default useOverlay;
