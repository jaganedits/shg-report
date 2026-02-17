import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDiG1LL2Q2AS-yF2k5OLzw5rXlhwxun9Sc",
  authDomain: "shreeannai-4d014.firebaseapp.com",
  projectId: "shreeannai-4d014",
  storageBucket: "shreeannai-4d014.firebasestorage.app",
  messagingSenderId: "37986373421",
  appId: "1:37986373421:web:0c6ab628438c3843254da4",
};

const isFirebaseConfigured = !!firebaseConfig.apiKey;

let app, auth, db;

if (isFirebaseConfigured) {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);

  // Use new cache API (replaces deprecated enableIndexedDbPersistence)
  db = initializeFirestore(app, {
    localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
  });
}

export { app, auth, db, isFirebaseConfigured, firebaseConfig };
