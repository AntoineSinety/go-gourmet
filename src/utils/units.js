// Système d'unités avec conversions pour les courses

export const UNIT_CATEGORIES = {
  WEIGHT: 'weight',
  VOLUME: 'volume',
  PIECE: 'piece',
  OTHER: 'other'
};

export const UNITS = [
  // Poids
  { id: 'g', label: 'g', category: UNIT_CATEGORIES.WEIGHT, baseUnit: 'g', factor: 1 },
  { id: 'kg', label: 'kg', category: UNIT_CATEGORIES.WEIGHT, baseUnit: 'g', factor: 1000 },

  // Volume
  { id: 'ml', label: 'ml', category: UNIT_CATEGORIES.VOLUME, baseUnit: 'ml', factor: 1 },
  { id: 'l', label: 'L', category: UNIT_CATEGORIES.VOLUME, baseUnit: 'ml', factor: 1000 },
  { id: 'cuillere-cafe', label: 'c. à café', category: UNIT_CATEGORIES.VOLUME, baseUnit: 'ml', factor: 5 },
  { id: 'cuillere-soupe', label: 'c. à soupe', category: UNIT_CATEGORIES.VOLUME, baseUnit: 'ml', factor: 15 },

  // Pièces
  { id: 'piece', label: 'unité(s)', category: UNIT_CATEGORIES.PIECE, baseUnit: 'piece', factor: 1 },

  // Autres
  { id: 'pincee', label: 'pincée(s)', category: UNIT_CATEGORIES.OTHER, baseUnit: null, factor: 0 }
];

/**
 * Convertit une quantité d'une unité vers l'unité de base de sa catégorie
 */
export const convertToBaseUnit = (quantity, unitId) => {
  const unit = UNITS.find(u => u.id === unitId);
  if (!unit || !unit.baseUnit) return { quantity, unit: unitId };

  return {
    quantity: quantity * unit.factor,
    unit: unit.baseUnit
  };
};

/**
 * Trouve la meilleure unité pour afficher une quantité
 * (par exemple, 1500g devient 1.5kg)
 */
export const getBestDisplayUnit = (quantity, baseUnit) => {
  const unitsInCategory = UNITS.filter(u => u.baseUnit === baseUnit);

  // Trier par facteur décroissant
  const sortedUnits = unitsInCategory.sort((a, b) => b.factor - a.factor);

  // Trouver la meilleure unité (celle qui donne un nombre >= 1 et le plus petit possible)
  for (const unit of sortedUnits) {
    const convertedQty = quantity / unit.factor;
    if (convertedQty >= 1 || unit.id === baseUnit) {
      return {
        quantity: Math.round(convertedQty * 100) / 100, // 2 décimales
        unit: unit.id,
        label: unit.label
      };
    }
  }

  return {
    quantity: Math.round(quantity * 100) / 100,
    unit: baseUnit,
    label: UNITS.find(u => u.id === baseUnit)?.label || baseUnit
  };
};

/**
 * Agrège plusieurs quantités d'ingrédients en gérant les conversions
 */
export const aggregateIngredients = (ingredients) => {
  const aggregated = {};

  ingredients.forEach(({ ingredientId, name, category, quantity, unit }) => {
    const key = ingredientId;

    if (!aggregated[key]) {
      aggregated[key] = {
        ingredientId,
        name,
        category,
        quantities: []
      };
    }

    // Convertir en unité de base si possible
    const converted = convertToBaseUnit(parseFloat(quantity) || 0, unit);

    if (converted.unit) {
      // Chercher si on a déjà cette unité de base
      const existing = aggregated[key].quantities.find(q => q.baseUnit === converted.unit);
      if (existing) {
        existing.total += converted.quantity;
      } else {
        aggregated[key].quantities.push({
          baseUnit: converted.unit,
          total: converted.quantity
        });
      }
    } else {
      // Unités non convertibles (pincée, au goût)
      aggregated[key].quantities.push({
        baseUnit: null,
        total: quantity,
        originalUnit: unit
      });
    }
  });

  // Formater les résultats
  return Object.values(aggregated).map(item => {
    const formatted = item.quantities.map(q => {
      if (q.baseUnit) {
        const best = getBestDisplayUnit(q.total, q.baseUnit);
        return `${best.quantity} ${best.unit}`;
      } else {
        return `${q.total} ${q.originalUnit}`;
      }
    });

    return {
      ...item,
      displayQuantity: formatted.join(' + ')
    };
  });
};

/**
 * Retourne les unités groupées par catégorie pour l'affichage
 */
export const getUnitsByCategory = () => {
  const grouped = {
    [UNIT_CATEGORIES.WEIGHT]: [],
    [UNIT_CATEGORIES.VOLUME]: [],
    [UNIT_CATEGORIES.PIECE]: [],
    [UNIT_CATEGORIES.OTHER]: []
  };

  UNITS.forEach(unit => {
    grouped[unit.category].push(unit);
  });

  return grouped;
};
