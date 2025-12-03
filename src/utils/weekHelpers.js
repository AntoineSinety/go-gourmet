import {
  startOfWeek,
  endOfWeek,
  addWeeks,
  format,
  getISOWeek,
  getISOWeekYear,
  parse,
  isAfter,
  isBefore,
  startOfDay,
  endOfDay
} from 'date-fns';
import { fr } from 'date-fns/locale';

/**
 * Obtient les informations de la semaine courante
 * @returns {Object} { weekNumber, year, startDate, endDate }
 */
export const getCurrentWeek = () => {
  const now = new Date();
  const start = startOfWeek(now, { weekStartsOn: 1 }); // Lundi
  const end = endOfWeek(now, { weekStartsOn: 1 }); // Dimanche

  return {
    weekNumber: getISOWeek(now),
    year: getISOWeekYear(now),
    startDate: start.toISOString(),
    endDate: end.toISOString(),
  };
};

/**
 * Calcule les dates de début et fin pour une semaine donnée
 * @param {number} weekNumber - Numéro ISO de la semaine (1-53)
 * @param {number} year - Année
 * @returns {Object} { startDate, endDate }
 */
export const getWeekDates = (weekNumber, year) => {
  // Créer une date pour le 4 janvier de l'année donnée (toujours dans la semaine 1)
  const jan4 = new Date(year, 0, 4);
  const week1Start = startOfWeek(jan4, { weekStartsOn: 1 });

  // Calculer le début de la semaine demandée
  const start = addWeeks(week1Start, weekNumber - 1);
  const end = endOfWeek(start, { weekStartsOn: 1 });

  return {
    startDate: start.toISOString(),
    endDate: end.toISOString(),
  };
};

/**
 * Vérifie si une date est dans le passé
 * @param {string} dateString - Date au format ISO
 * @returns {boolean}
 */
export const isPastDate = (dateString) => {
  const date = new Date(dateString);
  const today = startOfDay(new Date());
  return isBefore(endOfDay(date), today);
};

/**
 * Formate le label d'une semaine pour l'affichage
 * @param {string} startDateString - Date de début (ISO)
 * @param {string} endDateString - Date de fin (ISO)
 * @returns {string} Ex: "18 - 24 Novembre 2024"
 */
export const getWeekLabel = (startDateString, endDateString) => {
  const start = new Date(startDateString);
  const end = new Date(endDateString);

  const startDay = format(start, 'd', { locale: fr });
  const endDay = format(end, 'd', { locale: fr });

  // Vérifier si les deux dates sont dans le même mois
  const startMonth = format(start, 'MMMM', { locale: fr });
  const endMonth = format(end, 'MMMM', { locale: fr });
  const year = format(end, 'yyyy', { locale: fr });

  if (startMonth === endMonth) {
    return `${startDay} - ${endDay} ${startMonth} ${year}`;
  } else {
    return `${startDay} ${startMonth} - ${endDay} ${endMonth} ${year}`;
  }
};

/**
 * Navigue vers une semaine différente
 * @param {number} currentWeekNumber - Numéro de semaine actuel
 * @param {number} currentYear - Année actuelle
 * @param {number} direction - +1 pour semaine suivante, -1 pour semaine précédente
 * @returns {Object} { weekNumber, year, startDate, endDate }
 */
export const navigateWeek = (currentWeekNumber, currentYear, direction) => {
  const currentDate = parse(`${currentYear}-W${String(currentWeekNumber).padStart(2, '0')}-1`, 'RRRR-\'W\'II-i', new Date());
  const newDate = addWeeks(currentDate, direction);

  const start = startOfWeek(newDate, { weekStartsOn: 1 });
  const end = endOfWeek(newDate, { weekStartsOn: 1 });

  return {
    weekNumber: getISOWeek(newDate),
    year: getISOWeekYear(newDate),
    startDate: start.toISOString(),
    endDate: end.toISOString(),
  };
};

/**
 * Obtient les jours de la semaine avec leurs dates
 * @param {string} startDateString - Date de début de la semaine (ISO)
 * @returns {Array} Tableau de 7 objets { dayName, date, dayNumber, shortDate }
 */
export const getWeekDays = (startDateString) => {
  const start = new Date(startDateString);
  const days = [];

  const dayNames = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
  const dayKeys = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  for (let i = 0; i < 7; i++) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);

    days.push({
      dayName: dayNames[i],
      dayKey: dayKeys[i],
      date: date.toISOString(),
      dayNumber: format(date, 'd', { locale: fr }),
      shortDate: format(date, 'EEE dd', { locale: fr }), // Ex: "Lun 18"
      isPast: isPastDate(date.toISOString()),
    });
  }

  return days;
};

/**
 * Génère un ID unique pour un créneau de repas
 * @param {string} dayKey - Clé du jour (monday, tuesday, etc.)
 * @param {string} slotType - Type de créneau (lunch ou dinner)
 * @returns {string} Ex: "monday_lunch"
 */
export const getMealSlotId = (dayKey, slotType) => {
  return `${dayKey}_${slotType}`;
};

/**
 * Parse un ID de meal slot
 * @param {string} slotId - Ex: "monday_lunch"
 * @returns {Object} { dayKey, slotType }
 */
export const parseMealSlotId = (slotId) => {
  const [dayKey, slotType] = slotId.split('_');
  return { dayKey, slotType };
};
