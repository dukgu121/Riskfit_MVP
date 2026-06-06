/**
 * `useConsent` — read & write the user's data-handling consent flag.
 *
 * Consent is stored in localStorage under `STORAGE_KEYS.consent` and gates
 * access to every non-landing route (see `ConsentGate`). The hook keeps an
 * in-memory React state in sync with the stored value so that:
 *
 *   1. Components re-render the moment consent changes.
 *   2. Multiple tabs stay in sync (we listen to the `storage` event).
 *
 * @example
 *   const { consent, setConsent } = useConsent();
 *   <Checkbox checked={consent} onCheckedChange={(c) => setConsent(c === true)} />
 */

import { useCallback, useEffect, useState } from "react";

import { STORAGE_KEYS, read, remove, write } from "./storage";

/** Convenience helper for non-hook contexts (e.g. router loaders). */
export function getStoredConsent(): boolean {
  return read<boolean>(STORAGE_KEYS.consent, false) === true;
}

export interface UseConsentReturn {
  /** True when the user has accepted the landing-page disclaimer. */
  consent: boolean;
  /** Persist a new consent value (and broadcast it to other listeners). */
  setConsent: (next: boolean) => void;
  /** Convenience: clear consent (e.g. on a "reset" action). */
  clearConsent: () => void;
}

export function useConsent(): UseConsentReturn {
  const [consent, setConsentState] = useState<boolean>(() => getStoredConsent());

  /**
   * Sync state when another tab (or another hook instance in the same tab)
   * mutates the underlying localStorage key. The native `storage` event only
   * fires across tabs, so we also dispatch a synthetic event below on writes.
   */
  useEffect(() => {
    function handleStorage(event: StorageEvent) {
      if (event.key !== STORAGE_KEYS.consent) return;
      setConsentState(getStoredConsent());
    }
    function handleSync() {
      setConsentState(getStoredConsent());
    }
    window.addEventListener("storage", handleStorage);
    window.addEventListener("riskfit:consent-change", handleSync);
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("riskfit:consent-change", handleSync);
    };
  }, []);

  const setConsent = useCallback((next: boolean) => {
    if (next) {
      write(STORAGE_KEYS.consent, true);
    } else {
      remove(STORAGE_KEYS.consent);
    }
    setConsentState(next);
    // Notify other useConsent() instances in this tab.
    window.dispatchEvent(new Event("riskfit:consent-change"));
  }, []);

  const clearConsent = useCallback(() => {
    remove(STORAGE_KEYS.consent);
    setConsentState(false);
    window.dispatchEvent(new Event("riskfit:consent-change"));
  }, []);

  return { consent, setConsent, clearConsent };
}
