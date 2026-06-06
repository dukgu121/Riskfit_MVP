/**
 * `LoginButton` — compact Google sign-in / sign-out control.
 *
 * Rendered in the Landing top row. It is intentionally invisible until
 * Firebase is configured (`configured === false` → renders nothing), so the
 * app's design is untouched before `.env.local` exists. Once config is present
 * it shows either a "Google로 로그인" button or the signed-in user's name with
 * a quiet 로그아웃 affordance.
 *
 * Login here only authenticates (establishes the Firebase `uid`). Cloud
 * read/write is wired separately once the Firestore data contract is frozen.
 */

import { useState } from "react";

import { Button } from "../ui/button";
import { useAuth } from "../../lib/firebase/authContext";

export function LoginButton() {
  const { user, loading, configured, signIn, signOut } = useAuth();
  const [busy, setBusy] = useState(false);

  // Dormant until real Firebase config arrives; also avoid a flash while the
  // very first auth-state callback is still pending.
  if (!configured || loading) return null;

  const handleSignIn = async () => {
    setBusy(true);
    try {
      await signIn();
    } catch (err) {
      if (import.meta.env.DEV) console.error("[auth] sign-in failed:", err);
    } finally {
      setBusy(false);
    }
  };

  const handleSignOut = async () => {
    setBusy(true);
    try {
      await signOut();
    } finally {
      setBusy(false);
    }
  };

  if (user) {
    return (
      <div className="flex items-center gap-2.5">
        <span className="max-w-[10rem] truncate text-[13px] font-medium text-neutral-600">
          {user.displayName ?? user.email ?? "로그인됨"}
        </span>
        <button
          type="button"
          onClick={handleSignOut}
          disabled={busy}
          className="text-[13px] font-medium text-neutral-400 transition-colors hover:text-neutral-600 disabled:opacity-50"
        >
          로그아웃
        </button>
      </div>
    );
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={busy}
      onClick={handleSignIn}
      aria-label="Google로 로그인"
    >
      Google로 로그인
    </Button>
  );
}
