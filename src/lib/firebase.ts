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

import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";

// --- Add your Firebase config here ---
// You can also use VITE env vars: VITE_FIREBASE_API_KEY, etc.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "YOUR_API_KEY",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "andre-lulu.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "andre-lulu-love",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "andre-lulu-love.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "000000000000",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:000000000000:web:xxxxxxxxxxxxxxxxxxxxxx",
};

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
