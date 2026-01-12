import { useState } from 'react';
import { db } from '../services/firebase';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc,
  deleteField,
  updateDoc
} from 'firebase/firestore';
import { useHousehold } from '../contexts/HouseholdContext';
import styles from './MigratePermanentItems.module.css';

const MigratePermanentItems = () => {
  const { household } = useHousehold();
  const [scanning, setScanning] = useState(false);
  const [migrating, setMigrating] = useState(false);
  const [mealPlansFound, setMealPlansFound] = useState([]);
  const [allPermanentItems, setAllPermanentItems] = useState([]);
  const [uniqueItems, setUniqueItems] = useState([]);
  const [migrationDone, setMigrationDone] = useState(false);

  // Scanner tous les mealPlans pour trouver les permanentItems
  const scanMealPlans = async () => {
    if (!household) {
      alert('Pas de household connecté');
      return;
    }

    setScanning(true);
    setMealPlansFound([]);
    setAllPermanentItems([]);
    setUniqueItems([]);

    try {
      // Récupérer TOUS les mealPlans du household
      const q = query(
        collection(db, 'mealPlans'),
        where('householdId', '==', household.id)
      );

      const querySnapshot = await getDocs(q);

      const plans = [];
      const allItems = [];

      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const planInfo = {
          id: docSnap.id,
          weekNumber: data.weekNumber,
          year: data.year,
          startDate: data.startDate,
          permanentItemsCount: data.permanentItems?.length || 0,
          permanentItems: data.permanentItems || []
        };

        plans.push(planInfo);

        // Collecter tous les permanentItems
        if (data.permanentItems && data.permanentItems.length > 0) {
          data.permanentItems.forEach(item => {
            allItems.push({
              ...item,
              fromWeek: `S${data.weekNumber} ${data.year}`,
              fromPlanId: docSnap.id
            });
          });
        }
      });

      // Trier par date
      plans.sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        return a.weekNumber - b.weekNumber;
      });

      setMealPlansFound(plans);
      setAllPermanentItems(allItems);

      // Dédupliquer par nom (garder le plus récent)
      const itemsByName = {};
      allItems.forEach(item => {
        const key = item.name.toLowerCase().trim();
        if (!itemsByName[key] || new Date(item.createdAt) > new Date(itemsByName[key].createdAt)) {
          itemsByName[key] = item;
        }
      });

      setUniqueItems(Object.values(itemsByName));

    } catch (error) {
      console.error('Erreur lors du scan:', error);
      alert('Erreur: ' + error.message);
    } finally {
      setScanning(false);
    }
  };

  // Migrer vers la nouvelle collection
  const migrateItems = async () => {
    if (!household || uniqueItems.length === 0) return;

    setMigrating(true);

    try {
      // Créer le document dans permanentShoppingItems
      const permanentDocRef = doc(db, 'permanentShoppingItems', household.id);

      // Préparer les items avec de nouveaux IDs propres
      const cleanItems = uniqueItems.map((item, index) => ({
        id: `permanent_${Date.now()}_${index}`,
        name: item.name,
        category: item.category || 'Autres',
        quantity: item.quantity || null,
        unit: item.unit || '',
        createdAt: item.createdAt || new Date().toISOString()
      }));

      await setDoc(permanentDocRef, {
        householdId: household.id,
        items: cleanItems,
        updatedAt: new Date().toISOString()
      });

      setMigrationDone(true);
      alert(`Migration réussie ! ${cleanItems.length} articles permanents migrés.`);

    } catch (error) {
      console.error('Erreur lors de la migration:', error);
      alert('Erreur: ' + error.message);
    } finally {
      setMigrating(false);
    }
  };

  if (!household) {
    return <div className={styles.container}>Connectez-vous d'abord</div>;
  }

  return (
    <div className={styles.container}>
      <h1>Migration des Articles Permanents</h1>
      <p className={styles.description}>
        Cet outil va scanner tous vos mealPlans (octobre 2025 - janvier 2026)
        pour récupérer les articles permanents et les migrer vers une collection séparée.
      </p>

      {/* Étape 1: Scanner */}
      <section className={styles.section}>
        <h2>Étape 1: Scanner les mealPlans</h2>
        <button
          onClick={scanMealPlans}
          disabled={scanning}
          className={styles.button}
        >
          {scanning ? 'Scan en cours...' : 'Scanner tous les mealPlans'}
        </button>

        {mealPlansFound.length > 0 && (
          <div className={styles.results}>
            <h3>MealPlans trouvés: {mealPlansFound.length}</h3>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Semaine</th>
                  <th>Année</th>
                  <th>Articles permanents</th>
                </tr>
              </thead>
              <tbody>
                {mealPlansFound.map(plan => (
                  <tr key={plan.id} className={plan.permanentItemsCount > 0 ? styles.hasItems : ''}>
                    <td>S{plan.weekNumber}</td>
                    <td>{plan.year}</td>
                    <td>{plan.permanentItemsCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Étape 2: Voir les items trouvés */}
      {allPermanentItems.length > 0 && (
        <section className={styles.section}>
          <h2>Étape 2: Articles trouvés</h2>

          <h3>Tous les articles ({allPermanentItems.length} total)</h3>
          <div className={styles.itemsList}>
            {allPermanentItems.map((item, idx) => (
              <div key={idx} className={styles.item}>
                <span className={styles.itemName}>{item.name}</span>
                <span className={styles.itemCategory}>{item.category}</span>
                <span className={styles.itemFrom}>{item.fromWeek}</span>
              </div>
            ))}
          </div>

          <h3>Articles uniques (dédupliqués): {uniqueItems.length}</h3>
          <div className={styles.itemsList}>
            {uniqueItems.map((item, idx) => (
              <div key={idx} className={styles.itemUnique}>
                <span className={styles.itemName}>{item.name}</span>
                <span className={styles.itemCategory}>{item.category}</span>
                {item.quantity && (
                  <span className={styles.itemQuantity}>{item.quantity} {item.unit}</span>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Étape 3: Migrer */}
      {uniqueItems.length > 0 && !migrationDone && (
        <section className={styles.section}>
          <h2>Étape 3: Migrer vers la nouvelle collection</h2>
          <p>Ceci va créer une collection <code>permanentShoppingItems</code> avec {uniqueItems.length} articles.</p>
          <button
            onClick={migrateItems}
            disabled={migrating}
            className={styles.buttonMigrate}
          >
            {migrating ? 'Migration en cours...' : 'Migrer les articles'}
          </button>
        </section>
      )}

      {migrationDone && (
        <section className={styles.section}>
          <h2>Migration terminée !</h2>
          <p className={styles.success}>
            Les articles ont été migrés vers la collection <code>permanentShoppingItems</code>.
          </p>
        </section>
      )}
    </div>
  );
};

export default MigratePermanentItems;
