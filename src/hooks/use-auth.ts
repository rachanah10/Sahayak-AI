
"use client";

import { useState, useEffect, useCallback } from 'react';
import { onAuthStateChanged, signOut as firebaseSignOut, type User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

interface AuthUser extends User {
  is_admin?: boolean;
  name?: string;
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserDoc = useCallback(async (firebaseUser: User | null) => {
    if (firebaseUser) {
      try {
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUser({ ...firebaseUser, ...userData, is_admin: userData.is_admin || false });
        } else {
          // User exists in Auth but not Firestore. Handle this case.
          setUser({ ...firebaseUser, is_admin: false });
        }
      } catch (error) {
        console.error("Error fetching user document:", error);
        setUser({ ...firebaseUser, is_admin: false });
      }
    } else {
      setUser(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      fetchUserDoc(user);
    });

    return () => unsubscribe();
  }, [fetchUserDoc]);

  const signOut = async () => {
    await firebaseSignOut(auth);
  };

  return { user, loading, signOut };
}
