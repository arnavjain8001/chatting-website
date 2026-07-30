import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics, isSupported, Analytics } from "firebase/analytics";

export const firebaseConfig = {
  apiKey: "AIzaSyBI8heHlax1ekeYM52uZRBKN66Y4ihQo2I",
  authDomain: "talking-tom-jerry.firebaseapp.com",
  projectId: "talking-tom-jerry",
  storageBucket: "talking-tom-jerry.firebasestorage.app",
  messagingSenderId: "187599867245",
  appId: "1:187599867245:web:d72ba3d8e150ee3e8d1e64",
  measurementId: "G-Q2ED0C83B6"
};

// Initialize Firebase App
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firebase Auth
export const auth = getAuth(app);

// Initialize Firestore DB
export const db = getFirestore(app);

// Initialize Analytics safely
export let analytics: Analytics | null = null;
if (typeof window !== "undefined") {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  }).catch((err) => {
    console.warn("Analytics initialization skipped or not supported:", err);
  });
}


