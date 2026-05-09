import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyABl6i-hcm5p5mThMNWMF61A5vH7ITv90U",
  authDomain: "filmatch-16e19.firebaseapp.com",
  projectId: "filmatch-16e19",
  storageBucket: "filmatch-16e19.firebasestorage.app",
  messagingSenderId: "1043512913804",
  appId: "1:1043512913804:web:a01750922d56a5b39070a9",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
