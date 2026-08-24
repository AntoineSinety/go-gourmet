import { Leaf, Sprout, Heart, Flame, Clock, Award, Utensils, Wheat, Droplets } from 'lucide-react';
import { getTone } from './palette';

/**
 * Tags de recette. Les couleurs sont alignées sur les tonalités du design system
 * (voir utils/palette.js) : chaque tag porte un `tone`, et expose en plus les
 * valeurs résolues pour les usages en style inline.
 */
const TAGS = [
  { id: 'vegetarian', label: 'Végétarien', icon: 'Leaf', IconComponent: Leaf, tone: 'green' },
  { id: 'vegan', label: 'Vegan', icon: 'Sprout', IconComponent: Sprout, tone: 'emerald' },
  { id: 'healthy', label: 'Équilibré', icon: 'Heart', IconComponent: Heart, tone: 'pink' },
  { id: 'spicy', label: 'Épicé', icon: 'Flame', IconComponent: Flame, tone: 'accent' },
  { id: 'quick', label: 'Rapide', icon: 'Clock', IconComponent: Clock, tone: 'sky' },
  { id: 'gourmet', label: 'Gastronomique', icon: 'Award', IconComponent: Award, tone: 'yellow' },
  { id: 'comfort', label: 'Réconfortant', icon: 'Utensils', IconComponent: Utensils, tone: 'amber' },
  { id: 'glutenfree', label: 'Sans gluten', icon: 'Wheat', IconComponent: Wheat, tone: 'purple' },
  { id: 'lowcarb', label: 'Faible en glucides', icon: 'Droplets', IconComponent: Droplets, tone: 'teal' }
];

export const RECIPE_TAGS = TAGS.map(tag => {
  const tone = getTone(tag.tone);
  return {
    ...tag,
    color: tone.base,
    textColor: tone.text,
    bgColor: tone.soft,
    borderColor: tone.border
  };
});

export const getTagById = (id) => {
  return RECIPE_TAGS.find(tag => tag.id === id);
};

export const getTagsByIds = (ids = []) => {
  return ids.map(id => getTagById(id)).filter(Boolean);
};
