import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBOpxawym507p_FastToq6o6uAjeIsLaec",
  authDomain: "nothiing.firebaseapp.com",
  projectId: "nothiing",
  storageBucket: "nothiing.firebasestorage.app",
  messagingSenderId: "473893522",
  appId: "1:473893522:web:6a0c3c14d662f2a4a6b44b",
  measurementId: "G-ES69DCY79G"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
