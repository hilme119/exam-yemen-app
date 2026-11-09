import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  initializeFirestore,
  getFirestore, 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  writeBatch
} from 'firebase/firestore';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  signInAnonymously,
  signOut, 
  onAuthStateChanged, 
  User 
} from 'firebase/auth';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// Direct Firebase configuration matching your project yemen-national-exam-system
const firebaseConfig = {
  apiKey: 'AIzaSyAnyK07aHJ9sKULQNukyiFVk0nniTJLhNk',
  authDomain: 'yemen-national-exam-system.firebaseapp.com',
  projectId: 'yemen-national-exam-system',
  storageBucket: 'yemen-national-exam-system.firebasestorage.app',
  messagingSenderId: '1085196995430',
  appId: '1:1085196995430:web:8dcb31a5c2c675a85416a7'
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

let dbInstance;
try {
  dbInstance = initializeFirestore(app, {
    ignoreUndefinedProperties: true
  });
} catch {
  dbInstance = getFirestore(app);
}

export const db = dbInstance;

export const auth = getAuth(app);
export const storage = getStorage(app);

export {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  writeBatch,
  signInWithEmailAndPassword,
  signInAnonymously,
  signOut,
  onAuthStateChanged,
  ref,
  uploadBytes,
  getDownloadURL
};
export type { User };
