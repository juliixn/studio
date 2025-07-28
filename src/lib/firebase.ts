
// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
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
const db = getFirestore(app);

export { db };


// --- Server-side Firebase (Admin SDK) ---

const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
  : undefined;

if (!admin.apps.length) {
    if (serviceAccount) {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
    } else {
        // Initialize without credentials for client-side or if no service account is provided
        // Note: Admin-level operations will fail without a service account
        initializeApp(firebaseConfig);
    }
}


const adminDb = admin.firestore();

export { adminDb };
