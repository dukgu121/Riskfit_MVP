import { createContext, useContext } from "react";
import type { User } from "firebase/auth";

export interface AuthContextValue {
  /** The signed-in Firebase user, or `null` when logged out / unconfigured. */
  user: User | null;
  /** True until the first auth-state callback has resolved. */
  loading: boolean;
  /** False when `.env.local` Firebase config is missing (login is disabled). */
  configured: boolean;
  /** Open the Google sign-in popup. */
  signIn: () => Promise<void>;
  /** Sign the current user out. */
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

/** Read the auth context. Throws if used outside `<AuthProvider>`. */
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within <AuthProvider>");
  }
  return ctx;
}
