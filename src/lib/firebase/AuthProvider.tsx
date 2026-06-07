/**
 * `AuthProvider` / `useAuth` — app-wide access to the current Firebase user.
 *
 * Wrap the app once (in `main.tsx`) and any component can read the signed-in
 * user, trigger Google login/logout, and branch on whether Firebase is even
 * configured yet. Before `.env.local` is filled, `configured` is false and
 * `user` is always `null` — the rest of the app keeps working on localStorage.
 */

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { User } from "firebase/auth";

import { clearLocalState } from "../storage";
import { isFirebaseConfigured } from "./app";
import { signInWithGoogle, signOutUser, subscribeToAuth } from "./auth";
import { AuthContext, type AuthContextValue } from "./authContext";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  // When Firebase isn't configured there's nothing to wait for.
  const [loading, setLoading] = useState<boolean>(isFirebaseConfigured);

  useEffect(() => {
    const unsubscribe = subscribeToAuth((next) => {
      setUser(next);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const signIn = useCallback(async () => {
    await signInWithGoogle();
  }, []);

  const signOut = useCallback(async () => {
    await signOutUser();
    // 브라우저 공유 캐시를 비워, 다음 로그인(다른 계정일 수 있음)이 깨끗한
    // 상태에서 시작하도록 한다. 그 계정의 데이터는 로그인 시 클라우드에서 복원된다.
    clearLocalState({ emit: false });
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      configured: isFirebaseConfigured,
      signIn,
      signOut,
    }),
    [user, loading, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
