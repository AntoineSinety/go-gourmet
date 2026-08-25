import { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../services/firebase';
import {
  doc,
  getDoc,
  onSnapshot,
  setDoc,
  updateDoc,
  collection,
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

  // Deux écoutes chaînées : la fiche utilisateur donne le foyer courant, et le
  // foyer lui-même évolue (renommage, membres, portions par défaut). Le
  // chaînage fait aussi que rejoindre un foyer bascule l'app sans rechargement.
  useEffect(() => {
    if (!user) {
      setHousehold(null);
      setLoading(false);
      return undefined;
    }

    let unsubscribeHousehold = null;

    const unsubscribeUser = onSnapshot(
      doc(db, 'users', user.uid),
      (userSnap) => {
        const householdId = userSnap.data()?.householdId;

        unsubscribeHousehold?.();
        unsubscribeHousehold = null;

        if (!householdId) {
          setHousehold(null);
          setLoading(false);
          return;
        }

        unsubscribeHousehold = onSnapshot(
          doc(db, 'households', householdId),
          (householdSnap) => {
            setHousehold(
              householdSnap.exists()
                ? { id: householdSnap.id, ...householdSnap.data() }
                : null
            );
            setLoading(false);
          },
          (error) => {
            console.error('Error listening to household:', error);
            setLoading(false);
          }
        );
      },
      (error) => {
        console.error('Error listening to user document:', error);
        setLoading(false);
      }
    );

    return () => {
      unsubscribeUser();
      unsubscribeHousehold?.();
    };
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
