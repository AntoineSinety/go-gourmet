import { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../services/firebase';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  arrayUnion
} from 'firebase/firestore';
import { useAuth } from './AuthContext';

const HouseholdContext = createContext();

export const useHousehold = () => {
  const context = useContext(HouseholdContext);
  if (!context) {
    throw new Error('useHousehold must be used within HouseholdProvider');
  }
  return context;
};

export const HouseholdProvider = ({ children }) => {
  const { user } = useAuth();
  const [household, setHousehold] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadHousehold = async () => {
      if (!user) {
        setHousehold(null);
        setLoading(false);
        return;
      }

      try {
        const userRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userRef);
        const userData = userDoc.data();

        if (userData?.householdId) {
          const householdRef = doc(db, 'households', userData.householdId);
          const householdDoc = await getDoc(householdRef);

          if (householdDoc.exists()) {
            setHousehold({
              id: householdDoc.id,
              ...householdDoc.data()
            });
          }
        }
      } catch (error) {
        console.error('Error loading household:', error);
      } finally {
        setLoading(false);
      }
    };

    loadHousehold();
  }, [user]);

  const createHousehold = async (householdName) => {
    if (!user) return;

    try {
      const householdRef = doc(collection(db, 'households'));
      const householdData = {
        name: householdName,
        members: [],
        defaultServings: 4,
        createdBy: user.uid,
        createdAt: new Date().toISOString()
      };

      await setDoc(householdRef, householdData);

      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, {
        householdId: householdRef.id
      }, { merge: true });

      setHousehold({
        id: householdRef.id,
        ...householdData
      });

      return householdRef.id;
    } catch (error) {
      console.error('Error creating household:', error);
      throw error;
    }
  };

  const joinHousehold = async (householdId) => {
    if (!user) return;

    try {
      const householdRef = doc(db, 'households', householdId);
      const householdDoc = await getDoc(householdRef);

      if (!householdDoc.exists()) {
        throw new Error('Foyer introuvable');
      }

      await updateDoc(householdRef, {
        members: arrayUnion(user.uid)
      });

      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, {
        householdId: householdId
      }, { merge: true });

      setHousehold({
        id: householdDoc.id,
        ...householdDoc.data()
      });

      return householdId;
    } catch (error) {
      console.error('Error joining household:', error);
      throw error;
    }
  };

  const updateHousehold = async (updates) => {
    if (!household) return;

    try {
      const householdRef = doc(db, 'households', household.id);

      const updateData = {
        ...updates,
        updatedAt: new Date().toISOString()
      };

      await updateDoc(householdRef, updateData);

      setHousehold({
        ...household,
        ...updateData
      });
    } catch (error) {
      console.error('Error updating household:', error);
      throw error;
    }
  };

  const value = {
    household,
    loading,
    createHousehold,
    joinHousehold,
    updateHousehold
  };

  return (
    <HouseholdContext.Provider value={value}>
      {children}
    </HouseholdContext.Provider>
  );
};
