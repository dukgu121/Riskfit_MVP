/**
 * Google sign-in helpers, thin wrappers over the Firebase Auth SDK.
 *
 * Everything here is a no-op (or returns `null`) when Firebase isn't configured
 * yet, so calling code never has to special-case the "before `.env.local`"
 * state — it just gets `user: null`.
 */

import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User,
} from "firebase/auth";

import { getFirebase } from "./app";

const googleProvider = new GoogleAuthProvider();

/**
 * Open the Google sign-in popup. Resolves to the signed-in `User`, or `null`
 * when Firebase isn't configured. Popup-closed / cancelled errors are swallowed
 * (the user simply stays logged out); other errors propagate so the UI can show
 * them.
 */
export async function signInWithGoogle(): Promise<User | null> {
  const fb = getFirebase();
  if (!fb) return null;
  try {
    const cred = await signInWithPopup(fb.auth, googleProvider);
    return cred.user;
  } catch (err) {
    if (isUserCancelledPopup(err)) return null;
    throw err;
  }
}

/** Sign the current user out. No-op when Firebase isn't configured. */
export async function signOutUser(): Promise<void> {
  const fb = getFirebase();
  if (!fb) return;
  await signOut(fb.auth);
}

/**
 * Subscribe to auth-state changes. Invokes `cb` immediately with the current
 * user (or `null`) and on every subsequent login/logout. Returns an
 * unsubscribe function; when Firebase isn't configured it fires `cb(null)` once
 * and returns a no-op unsubscribe.
 */
export function subscribeToAuth(cb: (user: User | null) => void): () => void {
  const fb = getFirebase();
  if (!fb) {
    cb(null);
    return () => {};
  }
  return onAuthStateChanged(fb.auth, cb);
}

/** Distinguish "user closed the popup" from real failures. */
function isUserCancelledPopup(err: unknown): boolean {
  const code = (err as { code?: string } | null)?.code;
  return (
    code === "auth/popup-closed-by-user" ||
    code === "auth/cancelled-popup-request" ||
    code === "auth/user-cancelled"
  );
}
