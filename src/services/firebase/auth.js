import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile,
  getAuth,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
} from 'firebase/auth';
import { initializeApp, deleteApp } from 'firebase/app';
import { auth, isFirebaseConfigured, firebaseConfig } from './config';

export const signIn = async (email, password) => {
  if (!isFirebaseConfigured) throw new Error('Firebase not configured');
  return signInWithEmailAndPassword(auth, email, password);
};

// Creates a user via a secondary Firebase app so the current admin session is NOT affected
export const signUp = async (email, password, displayName) => {
  if (!isFirebaseConfigured) throw new Error('Firebase not configured');
  // Use a secondary app instance to avoid signing out the current admin
  const secondaryApp = initializeApp(firebaseConfig, `temp-${Date.now()}`);
  const secondaryAuth = getAuth(secondaryApp);
  try {
    const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
    if (displayName) {
      await updateProfile(userCredential.user, { displayName });
    }
    // Sign out from secondary app (cleanup)
    await firebaseSignOut(secondaryAuth);
    return userCredential;
  } finally {
    // Delete the secondary app to clean up
    await deleteApp(secondaryApp);
  }
};

export const signOut = async () => {
  if (!isFirebaseConfigured) throw new Error('Firebase not configured');
  return firebaseSignOut(auth);
};

export const reauthenticateCurrentUser = async (currentPassword) => {
  if (!isFirebaseConfigured) throw new Error('Firebase not configured');
  if (!auth.currentUser?.email) throw new Error('No authenticated user found');

  const credential = EmailAuthProvider.credential(auth.currentUser.email, currentPassword);
  return reauthenticateWithCredential(auth.currentUser, credential);
};

export const changeCurrentUserPassword = async (currentPassword, newPassword) => {
  if (!isFirebaseConfigured) throw new Error('Firebase not configured');
  await reauthenticateCurrentUser(currentPassword);
  if (!auth.currentUser) throw new Error('No authenticated user found');
  return updatePassword(auth.currentUser, newPassword);
};

export const onAuthChange = (callback) => {
  if (!isFirebaseConfigured) return () => {};
  return onAuthStateChanged(auth, callback);
};
