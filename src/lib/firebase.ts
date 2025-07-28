
// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";
import * as admin from 'firebase-admin';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBG0apWKqEaVobUdmPHDzPslBp4vBfWwpI",
  authDomain: "acceso-seguro-3cs42.firebaseapp.com",
  databaseURL: "https://acceso-seguro-3cs42-default-rtdb.firebaseio.com",
  projectId: "acceso-seguro-3cs42",
  storageBucket: "acceso-seguro-3cs42.appspot.com",
  messagingSenderId: "712343981243",
  appId: "1:712343981243:web:ced1cab1bbf6d194ea2d9e"
};


// --- Client-side Firebase ---
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Initialize App Check
if (typeof window !== 'undefined') {
  initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider('abcdefghijklmnopqrstuvwxy-1234567890abcd'),
    isTokenAutoRefreshEnabled: true
  });
}

const db = getFirestore(app);

export { db };


// --- Server-side Firebase (Admin SDK) ---

let adminDb: admin.firestore.Firestore;

if (typeof window === 'undefined') {
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
    ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
    : undefined;

  if (!admin.apps.length) {
    if (serviceAccount) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
    } else {
      // This will only run in development environments where the key might not be set.
      // It allows the app to build, but server-side admin features will not work.
      console.warn("Firebase Admin SDK not initialized. Server-side features will not work.");
    }
  }
  
  // Initialize adminDb only if the app has been initialized
  if (admin.apps.length > 0) {
    adminDb = admin.firestore();
  }
}

// Export adminDb safely. It will be undefined on the client or if initialization failed.
// @ts-ignore
export { adminDb };
