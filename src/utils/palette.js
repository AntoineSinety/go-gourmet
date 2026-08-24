/**
 * Tonalités de couleur du design system.
 *
 * Chaque tonalité fournit les quatre valeurs dont l'UI a besoin :
 * - `base`   : l'aplat plein (point de tag, jauge)
 * - `text`   : la variante éclaircie, lisible sur fond teinté (contraste AA)
 * - `soft`   : le fond teinté à 13–16 %
 * - `border` : la bordure teintée à 22–35 %
 *
 * Source : canvas « Go Gourmet Refonte », planche 00 « Fondations ».
 */
export const TONES = {
  accent: {
    base: '#ff7300',
    text: '#ffa347',
    soft: 'rgba(255, 115, 0, 0.16)',
    border: 'rgba(255, 115, 0, 0.35)'
  },
  green: {
    base: '#22c55e',
    text: '#4ade80',
    soft: 'rgba(34, 197, 94, 0.14)',
    border: 'rgba(34, 197, 94, 0.28)'
  },
  emerald: {
    base: '#10b981',
    text: '#34d399',
    soft: 'rgba(16, 185, 129, 0.14)',
    border: 'rgba(16, 185, 129, 0.28)'
  },
  teal: {
    base: '#14b8a6',
    text: '#2dd4bf',
    soft: 'rgba(20, 184, 166, 0.14)',
    border: 'rgba(20, 184, 166, 0.26)'
  },
  sky: {
    base: '#3b82f6',
    text: '#93c5fd',
    soft: 'rgba(59, 130, 246, 0.14)',
    border: 'rgba(59, 130, 246, 0.26)'
  },
  purple: {
    base: '#8b5cf6',
    text: '#a78bfa',
    soft: 'rgba(139, 92, 246, 0.14)',
    border: 'rgba(139, 92, 246, 0.26)'
  },
  pink: {
    base: '#ec4899',
    text: '#f472b6',
    soft: 'rgba(236, 72, 153, 0.14)',
    border: 'rgba(236, 72, 153, 0.26)'
  },
  red: {
    base: '#ef4444',
    text: '#f87171',
    soft: 'rgba(239, 68, 68, 0.13)',
    border: 'rgba(239, 68, 68, 0.24)'
  },
  amber: {
    base: '#f59e0b',
    text: '#fbbf24',
    soft: 'rgba(245, 158, 11, 0.14)',
    border: 'rgba(245, 158, 11, 0.26)'
  },
  yellow: {
    base: '#eab308',
    text: '#fbbf24',
    soft: 'rgba(234, 179, 8, 0.14)',
    border: 'rgba(234, 179, 8, 0.26)'
  },
  neutral: {
    base: '#5a6a85',
    text: '#9ba9be',
    soft: 'var(--surface-raised)',
    border: 'var(--border-color)'
  }
};

export const getTone = (name) => TONES[name] || TONES.neutral;

/**
 * Renvoie les variables CSS d'une tonalité, à passer en `style` sur un élément.
 * Les CSS Modules consomment ensuite `var(--tone-base)`, `var(--tone-text)`, etc.
 */
export const toneVars = (name) => {
  const tone = getTone(name);
  return {
    '--tone-base': tone.base,
    '--tone-text': tone.text,
    '--tone-soft': tone.soft,
    '--tone-border': tone.border
  };
};
