/**
 * Firebase app singleton + lazy, config-guarded initialisation.
 *
 * The web app must keep running even before anyone fills in `.env.local`, so
 * we never call `initializeApp` at import time with empty credentials (that
 * throws and white-screens the whole SPA). Instead we:
 *
 *   1. Read the six `VITE_FIREBASE_*` values Vite inlines at build time.
 *   2. Expose `isFirebaseConfigured` — true only when every value is present.
 *   3. Initialise (and memoise) the SDK on first access via `getFirebase()`.
 *
 * Consumers (AuthProvider, the Firestore repository) check `isFirebaseConfigured`
 * and no-op gracefully when it's false. This means the app behaves exactly as
 * before (localStorage-only) until real config arrives — then login + cloud
 * sync light up with zero further code changes.
 */

import { initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
} as const;

/**
 * True when the Firebase web config values that Auth + Firestore actually need
 * are present. `appId` is intentionally NOT required: it's only used by
 * Analytics / Installations (which this app doesn't use), and gating on it would
 * disable login whenever the build is missing that one var — exactly the trap we
 * hit in production. The five values below are what `getAuth`/`getFirestore` and
 * Google sign-in depend on.
 */
export const isFirebaseConfigured: boolean = Boolean(
  firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId &&
    firebaseConfig.storageBucket &&
    firebaseConfig.messagingSenderId,
);

interface FirebaseHandles {
  app: FirebaseApp;
  auth: Auth;
  db: Firestore;
}

let cached: FirebaseHandles | null = null;

/**
 * Initialise (once) and return the Firebase handles, or `null` when config is
 * absent. Callers must handle `null` — it's the signal that Firebase features
 * should stay dormant.
 */
export function getFirebase(): FirebaseHandles | null {
  if (!isFirebaseConfigured) return null;
  if (cached) return cached;

  const app = initializeApp(firebaseConfig);
  cached = {
    app,
    auth: getAuth(app),
    db: getFirestore(app),
  };
  return cached;
}
