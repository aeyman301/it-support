import { initializeApp, type FirebaseOptions } from "firebase/app";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import {
  connectAuthEmulator,
  getAuth,
  onAuthStateChanged,
  signInAnonymously,
} from "firebase/auth";

const firebaseConfig: FirebaseOptions = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const firebaseConfigured = Boolean(
  firebaseConfig.projectId && firebaseConfig.apiKey,
);

export const app = initializeApp(
  firebaseConfigured
    ? firebaseConfig
    : { projectId: "demo-erp", apiKey: "demo-key" },
);

export const db = getFirestore(app);
export const auth = getAuth(app);

// Point at the local Firebase emulators during development when requested,
// so the app is usable before any real Firebase project is wired up.
if (import.meta.env.VITE_USE_FIRESTORE_EMULATOR === "true") {
  connectFirestoreEmulator(db, "127.0.0.1", 8080);
  connectAuthEmulator(auth, "http://127.0.0.1:9099");
}

/**
 * The default Firestore rules (see firestore.rules) only allow access to
 * signed-in users. This app has no login screen yet, so it signs everyone in
 * anonymously — good enough to keep the planning data out of reach of the
 * open internet, but NOT a real access control boundary since anyone with
 * the Firebase config could do the same. Replace this with real
 * authentication (e.g. Google sign-in restricted to your company domain)
 * before treating this as anything more than a private prototype.
 */
export const authReady: Promise<void> = firebaseConfigured
  ? new Promise((resolve) => {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        if (user) {
          unsubscribe();
          resolve();
        } else {
          signInAnonymously(auth).catch((err) => {
            console.error("Anonymous sign-in failed:", err);
          });
        }
      });
    })
  : new Promise(() => {});
