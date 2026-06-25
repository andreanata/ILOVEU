// ANDRE & LULU ❤️
// Firebase configuration
// Replace with your own Firebase project credentials.
// This file is Vercel / Next.js ready.
//
// To enable true cross-device realtime sync:
// 1. Create a Firebase project at https://console.firebase.google.com
// 2. Enable Firestore Database, Storage, and Authentication (Anonymous)
// 3. Paste your config below (or use VITE_ env vars)
// 4. Deploy. All devices will sync instantly via onSnapshot.

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;
let firebaseEnabled = false;

try {
  if (firebaseConfig.apiKey && !firebaseConfig.apiKey.includes("YOUR_API_KEY")) {
    app = getApps().length ? getApps()[0]! : initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
    firebaseEnabled = true;
    console.log("[Andre & Lulu] Firebase live mode enabled ❤️");
  } else {
    console.log("[Andre & Lulu] Running in Demo Realtime mode - add your Firebase config for true cross-device sync.");
  }
} catch (e) {
  console.warn("Firebase init failed, falling back to demo mode.", e);
}

export { app, auth, db, storage, firebaseEnabled };
