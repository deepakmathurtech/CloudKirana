import { getAnalytics, isSupported } from 'firebase/analytics';
import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, onAuthStateChanged, signInAnonymously, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyAu49lfg_aTYtdDJRwEmesW-GDP9-clHqY',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'hirelens-43306.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'hirelens-43306',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'hirelens-43306.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '469663903503',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:469663903503:web:a44b6f970e1c4f0b87d87a',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-07CXHFQXGK'
};

export const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const firebaseAuth = getAuth(firebaseApp);
export const firestore = getFirestore(firebaseApp);
export const googleProvider = new GoogleAuthProvider();

export async function startFirebase() {
  const user = firebaseAuth.currentUser || (await signInAnonymously(firebaseAuth)).user;
  if (typeof window !== 'undefined' && await isSupported()) getAnalytics(firebaseApp);
  return user;
}

export function watchAuth(callback) {
  return onAuthStateChanged(firebaseAuth, callback);
}

export async function signInWithGoogle() {
  return (await signInWithPopup(firebaseAuth, googleProvider)).user;
}

export function signOutUser() {
  return signOut(firebaseAuth);
}
