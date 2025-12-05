import { Leaf, Heart, Flame, Clock, Award, Utensils, Wheat, Droplets } from 'lucide-react';

export const RECIPE_TAGS = [
  {
    id: 'vegetarian',
    label: 'Végétarien',
    icon: 'Leaf',
    IconComponent: Leaf,
    color: '#22c55e',
    bgColor: 'rgba(34, 197, 94, 0.1)',
    borderColor: 'rgba(34, 197, 94, 0.3)'
  },
  {
    id: 'vegan',
    label: 'Vegan',
    icon: 'Leaf',
    IconComponent: Leaf,
    color: '#10b981',
    bgColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: 'rgba(16, 185, 129, 0.3)'
  },
  {
    id: 'healthy',
    label: 'Équilibré',
    icon: 'Heart',
    IconComponent: Heart,
    color: '#ec4899',
    bgColor: 'rgba(236, 72, 153, 0.1)',
    borderColor: 'rgba(236, 72, 153, 0.3)'
  },
  {
    id: 'spicy',
    label: 'Épicé',
    icon: 'Flame',
    IconComponent: Flame,
    color: '#f97316',
    bgColor: 'rgba(249, 115, 22, 0.1)',
    borderColor: 'rgba(249, 115, 22, 0.3)'
  },
  {
    id: 'quick',
    label: 'Rapide',
    icon: 'Clock',
    IconComponent: Clock,
    color: '#3b82f6',
    bgColor: 'rgba(59, 130, 246, 0.1)',
    borderColor: 'rgba(59, 130, 246, 0.3)'
  },
  {
    id: 'gourmet',
    label: 'Gastronomique',
    icon: 'Award',
    IconComponent: Award,
    color: '#eab308',
    bgColor: 'rgba(234, 179, 8, 0.1)',
    borderColor: 'rgba(234, 179, 8, 0.3)'
  },
  {
    id: 'comfort',
    label: 'Réconfortant',
    icon: 'Utensils',
    IconComponent: Utensils,
    color: '#f59e0b',
    bgColor: 'rgba(245, 158, 11, 0.1)',
    borderColor: 'rgba(245, 158, 11, 0.3)'
  },
  {
    id: 'glutenfree',
    label: 'Sans gluten',
    icon: 'Wheat',
    IconComponent: Wheat,
    color: '#a855f7',
    bgColor: 'rgba(168, 85, 247, 0.1)',
    borderColor: 'rgba(168, 85, 247, 0.3)'
  },
  {
    id: 'lowcarb',
    label: 'Faible en glucides',
    icon: 'Droplets',
    IconComponent: Droplets,
    color: '#14b8a6',
    bgColor: 'rgba(20, 184, 166, 0.1)',
    borderColor: 'rgba(20, 184, 166, 0.3)'
  }
];

export const getTagById = (id) => {
  return RECIPE_TAGS.find(tag => tag.id === id);
};

export const getTagsByIds = (ids = []) => {
  return ids.map(id => getTagById(id)).filter(Boolean);
};
