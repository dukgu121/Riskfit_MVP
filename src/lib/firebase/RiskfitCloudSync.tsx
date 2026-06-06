import { useEffect, useRef, useSyncExternalStore, type ReactNode } from "react";

import type { Insurance } from "../../types";
import { STORAGE_KEYS, read, readInsurances, write } from "../storage";
import { useAuth } from "./authContext";
import {
  loadChecklist,
  loadInsurances,
  loadProfile,
  loadUserConsent,
  saveChecklist,
  saveInsurances,
  saveProfile,
  saveUserConsent,
} from "./repository";
import type { LocalProfileSlices } from "./schema";

const SYNC_DEBOUNCE_MS = 600;
const hydrationListeners = new Set<() => void>();
let hydrationSnapshot = false;

const SYNC_KEYS = new Set<string>([
  STORAGE_KEYS.consent,
  STORAGE_KEYS.profileBasic,
  STORAGE_KEYS.profileHealth,
  STORAGE_KEYS.profileFamilyHistory,
  STORAGE_KEYS.insurances,
  STORAGE_KEYS.insurance,
  STORAGE_KEYS.checklist,
]);

export function RiskfitCloudSync({ children }: { children: ReactNode }) {
  const { user, loading, configured } = useAuth();
  const hydrating = useSyncExternalStore(
    subscribeToHydration,
    getHydrationSnapshot,
    getHydrationSnapshot,
  );
  const pausedRef = useRef(false);
  const hydratedUidRef = useRef<string | null>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!configured || loading) return;
    if (!user) {
      hydratedUidRef.current = null;
      setHydrating(false);
      return;
    }
    if (hydratedUidRef.current === user.uid) {
      setHydrating(false);
      return;
    }

    let cancelled = false;
    setHydrating(true);

    async function hydrate() {
      if (!user) return;

      pausedRef.current = true;
      try {
        const [remoteConsent, remoteProfile, remoteInsurances, remoteChecklist] =
          await Promise.all([
            loadUserConsent(user.uid),
            loadProfile(user.uid),
            loadInsurances(user.uid),
            loadChecklist(user.uid),
          ]);

        if (cancelled) return;

        if (remoteConsent === true) {
          write(STORAGE_KEYS.consent, true);
        }
        if (remoteProfile) {
          write(STORAGE_KEYS.profileBasic, remoteProfile.basic);
          write(STORAGE_KEYS.profileHealth, remoteProfile.health);
          write(
            STORAGE_KEYS.profileFamilyHistory,
            remoteProfile.familyHistory,
          );
        }
        if (remoteInsurances.length > 0) {
          write(STORAGE_KEYS.insurances, remoteInsurances);
        }
        if (remoteChecklist) {
          write(STORAGE_KEYS.checklist, remoteChecklist);
        }

        const localState = readLocalState();
        if (localState.consent) {
          await saveUserConsent(user.uid, true, "google");
          if (!remoteProfile && hasProfileData(localState.profile)) {
            await saveProfile(user.uid, localState.profile);
          }
          if (remoteInsurances.length === 0 && localState.insurances.length > 0) {
            await saveInsurances(user.uid, localState.insurances);
          }
          if (!remoteChecklist && hasChecklistData(localState.checklist)) {
            await saveChecklist(user.uid, localState.checklist);
          }
        }

        hydratedUidRef.current = user.uid;
      } catch (err) {
        if (import.meta.env.DEV) {
          console.warn("[firebase] initial sync failed:", err);
        }
      } finally {
        pausedRef.current = false;
        if (!cancelled) setHydrating(false);
      }
    }

    void hydrate();

    return () => {
      cancelled = true;
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [configured, loading, user]);

  useEffect(() => {
    if (!configured || !user) return;

    const schedule = (key: string) => {
      if (pausedRef.current) return;
      if (!SYNC_KEYS.has(key)) return;
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => {
        void syncLocalToCloud(user.uid);
      }, SYNC_DEBOUNCE_MS);
    };

    const handleRiskfitStorage = (event: Event) => {
      const detail = (event as CustomEvent<{ key?: string }>).detail;
      if (detail?.key) schedule(detail.key);
    };

    const handleBrowserStorage = (event: StorageEvent) => {
      if (event.key) schedule(event.key);
    };

    window.addEventListener("riskfit:storage-change", handleRiskfitStorage);
    window.addEventListener("storage", handleBrowserStorage);
    return () => {
      window.removeEventListener("riskfit:storage-change", handleRiskfitStorage);
      window.removeEventListener("storage", handleBrowserStorage);
    };
  }, [configured, user]);

  if (configured && (loading || hydrating)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white px-6 text-sm font-medium text-neutral-500">
        데이터를 불러오고 있어요.
      </div>
    );
  }

  return <>{children}</>;
}

async function syncLocalToCloud(uid: string): Promise<void> {
  const state = readLocalState();
  if (!state.consent) return;

  await saveUserConsent(uid, true, "google");

  await Promise.all([
    hasProfileData(state.profile)
      ? saveProfile(uid, state.profile)
      : Promise.resolve(),
    saveInsurances(uid, state.insurances),
    saveChecklist(uid, state.checklist),
  ]);
}

function readLocalState(): {
  consent: boolean;
  profile: LocalProfileSlices;
  insurances: Insurance[];
  checklist: Record<string, boolean>;
} {
  return {
    consent: read<boolean>(STORAGE_KEYS.consent, false) === true,
    profile: {
      basic: read<Record<string, unknown>>(STORAGE_KEYS.profileBasic, {}),
      health: read<Record<string, unknown>>(STORAGE_KEYS.profileHealth, {}),
      familyHistory: read<unknown>(STORAGE_KEYS.profileFamilyHistory, []),
    },
    insurances: readInsurances<Insurance>(),
    checklist: read<Record<string, boolean>>(STORAGE_KEYS.checklist, {}),
  };
}

function hasProfileData(profile: LocalProfileSlices): boolean {
  const family = Array.isArray(profile.familyHistory)
    ? profile.familyHistory
    : [];
  return (
    Object.keys(profile.basic).length > 0 ||
    Object.keys(profile.health).length > 0 ||
    family.length > 0
  );
}

function hasChecklistData(checklist: Record<string, boolean>): boolean {
  return Object.keys(checklist).length > 0;
}

function subscribeToHydration(listener: () => void): () => void {
  hydrationListeners.add(listener);
  return () => hydrationListeners.delete(listener);
}

function getHydrationSnapshot(): boolean {
  return hydrationSnapshot;
}

function setHydrating(next: boolean): void {
  if (hydrationSnapshot === next) return;
  hydrationSnapshot = next;
  for (const listener of hydrationListeners) {
    listener();
  }
}
