import React, { createContext, useState, useEffect } from 'react';
import { auth, db } from '../services/firebase';
import { signInAnonymously } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { generateUserCode } from '../utils/helpers';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        const userRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userRef);
        
        if (!userDoc.exists()) {
          // Yeni kullanıcı için benzersiz kod oluştur
          const userCode = generateUserCode();
          await setDoc(userRef, {
            uid: user.uid,
            userCode,
            createdAt: new Date(),
            lastSeen: new Date()
          });
          
          setCurrentUser({ ...user, userCode });
        } else {
          setCurrentUser({ ...user, ...userDoc.data() });
        }
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async () => {
    try {
      const result = await signInAnonymously(auth);
      return result.user;
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await auth.signOut();
    } catch (error) {
      throw error;
    }
  };

  const updateUserProfile = async (data) => {
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      await setDoc(userRef, { ...data, lastSeen: new Date() }, { merge: true });
      setCurrentUser(prev => ({ ...prev, ...data }));
    } catch (error) {
      throw error;
    }
  };

  const value = {
    currentUser,
    login,
    logout,
    updateUserProfile,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
