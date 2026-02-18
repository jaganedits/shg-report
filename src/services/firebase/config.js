import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';

const env = import.meta.env || {};

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || '',
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: env.VITE_FIREBASE_APP_ID || '',
};

const isProduction = Boolean(env.PROD);
const allowLocalAuthFallback = !isProduction;
const isFirebaseConfigured = Object.values(firebaseConfig).every(value => typeof value === 'string' && value.trim() !== '');
const firebaseConfigError = isProduction && !isFirebaseConfigured
  ? 'Firebase is not configured for production. Please set all VITE_FIREBASE_* variables.'
  : '';

let app, auth, db;

if (isFirebaseConfigured) {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);

  // Use new cache API (replaces deprecated enableIndexedDbPersistence)
  db = initializeFirestore(app, {
    localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
  });
} else if (firebaseConfigError) {
  console.error(firebaseConfigError);
}

export {
  app,
  auth,
  db,
  isFirebaseConfigured,
  firebaseConfig,
  isProduction,
  allowLocalAuthFallback,
  firebaseConfigError,
};
