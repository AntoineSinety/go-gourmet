import { useEffect, useState } from 'react';

/**
 * S'abonne à une media query. Utilisé pour les bascules qui ne peuvent pas
 * être faites en CSS seul (par exemple : la grille du planning n'a pas de
 * sens sous 769px, la vue liste s'impose).
 */
export const useMediaQuery = (query) => {
  const [matches, setMatches] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(query).matches
  );

  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = (e) => setMatches(e.matches);

    setMatches(mql.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [query]);

  return matches;
};

export default useMediaQuery;
