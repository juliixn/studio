
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
  try {
    const appCheck = initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider('abcdefghijklmnopqrstuvwxy-1234567890abcd'),
      isTokenAutoRefreshEnabled: true
    });
  } catch (error) {
    console.warn("App Check initialization failed, likely due to test environment or missing config.", error);
  }
}

const db = getFirestore(app);

export { db };


// --- Server-side Firebase (Admin SDK) ---

let adminDb: admin.firestore.Firestore;

if (process.env.NODE_ENV === 'development' || process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    if (!admin.apps.length) {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '{}');
        try {
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount)
            });
            adminDb = admin.firestore();
        } catch (error: any) {
            if (error.code !== 'app/no-app') { // Ignore error if app is already initialized
                console.error("Firebase Admin SDK Initialization Error:", error);
            }
        }
    }
    if (!adminDb) {
        adminDb = admin.firestore();
    }
} else {
    console.warn("Firebase Admin SDK not initialized. FIREBASE_SERVICE_ACCOUNT_KEY not found.");
}


// Export adminDb safely. It will be undefined on the client or if initialization failed.
// @ts-ignore
export { adminDb };
