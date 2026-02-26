import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";
import { getAuth, Auth, GoogleAuthProvider } from "firebase/auth";

const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "";

// Only initialize Firebase when a real API key is present
const isConfigured = apiKey.length > 10 && !apiKey.startsWith("placeholder");

const firebaseConfig = {
    apiKey,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let _app: FirebaseApp | undefined;
let _db: Firestore | undefined;
let _storage: FirebaseStorage | undefined;
let _auth: Auth | undefined;

if (isConfigured) {
    _app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    _db = getFirestore(_app);
    _storage = getStorage(_app);
    _auth = getAuth(_app);
}

export const db = _db as Firestore;
export const storage = _storage as FirebaseStorage;
export const auth = _auth as Auth;
export const googleProvider = new GoogleAuthProvider();
export const firebaseReady = isConfigured;
