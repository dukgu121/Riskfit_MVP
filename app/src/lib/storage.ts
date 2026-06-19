/**
 * Typed `localStorage` wrapper for RiskFit.
 *
 * RiskFit keeps profile inputs, consent, insurance rows, and checklist state in
 * localStorage so the UI can read them synchronously. When Firebase is
 * configured and the user signs in with consent, these same keys may be
 * mirrored to Firestore by the cloud sync layer.
 *
 * Failures (SSR / private-mode browsers / quota exceeded / malformed JSON)
 * are caught and degrade gracefully: reads return `fallback`, writes are
 * silently dropped. Errors are surfaced via `console.warn` in dev only.
 *
 * @example
 *   import { read, write, remove } from "../lib/storage";
 *
 *   const profile = read<UserProfileInput>("riskfit.profile", {});
 *   write("riskfit.consent", true);
 *   remove("riskfit.report");
 */

/** Detect whether `window.localStorage` is actually usable in this runtime. */
function hasStorage(): boolean {
  try {
    return (
      typeof window !== "undefined" &&
      typeof window.localStorage !== "undefined"
    );
  } catch {
    return false;
  }
}

/**
 * Read & parse a JSON value at `key`. Returns `fallback` when:
 *   - localStorage is unavailable
 *   - the key has never been written
 *   - the stored value is not valid JSON
 */
export function read<T>(key: string, fallback: T): T {
  if (!hasStorage()) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch (err) {
    if (import.meta.env.DEV) {
      console.warn(`[storage] failed to read "${key}":`, err);
    }
    return fallback;
  }
}

/**
 * JSON-serialise & persist `value` at `key`. Silently drops the write if
 * localStorage is unavailable or quota is exceeded.
 */
export function write<T>(key: string, value: T): void {
  if (!hasStorage()) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    emitStorageChange(key, "write", value);
  } catch (err) {
    if (import.meta.env.DEV) {
      console.warn(`[storage] failed to write "${key}":`, err);
    }
  }
}

/** Remove a key from localStorage. No-op if the key or storage is missing. */
export function remove(key: string, { emit = true }: { emit?: boolean } = {}): void {
  if (!hasStorage()) return;
  try {
    window.localStorage.removeItem(key);
    if (emit) emitStorageChange(key, "remove");
  } catch (err) {
    if (import.meta.env.DEV) {
      console.warn(`[storage] failed to remove "${key}":`, err);
    }
  }
}

function emitStorageChange(
  key: string,
  action: "write" | "remove",
  value?: unknown,
): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent("riskfit:storage-change", {
      detail: { key, action, value },
    }),
  );
  if (key === "riskfit.consent") {
    window.dispatchEvent(new Event("riskfit:consent-change"));
  }
}

/**
 * Canonical keys used across RiskFit. Centralising them prevents typos and
 * makes it trivial to wipe state for reset flows.
 *
 * Input wizard splits the profile into three slices (basic / health / family
 * history) plus an insurances list. Aggregated `profile` / `insurance` keys
 * remain for legacy code paths but downstream pages should prefer the
 * `readProfile` / `readInsurances` helpers below.
 */
export const STORAGE_KEYS = {
  consent: "riskfit.consent",
  profile: "riskfit.profile",
  profileBasic: "riskfit.profile.basic",
  profileHealth: "riskfit.profile.health",
  profileFamilyHistory: "riskfit.profile.familyHistory",
  insurance: "riskfit.insurance",
  insurances: "riskfit.insurances",
  checklist: "riskfit.checklist",
  report: "riskfit.report",
  /**
   * Single analysis cache produced once by `/analyzing` (MIGRATION_PLAN §7).
   * localStorage-only — intentionally NOT synced to Firestore.
   */
  analysis: "riskfit.analysis",
  /** Premium (demo paywall) flag. localStorage-only, survives 재진단. */
  premium: "riskfit.premium",
  /** "재방문자 온보딩 스킵" flag (OD-4). localStorage-only. */
  onboardingSeen: "riskfit.onboardingSeen",
  /**
   * Which 보험 세부 step the user last resumed (p9–p14 chain). localStorage-only.
   * Lifestyle stays inside the health slice — no separate lifestyle key here,
   * `readProfile` already merges health (which holds lifestyle fields too).
   */
  insuranceDraftStep: "riskfit.insuranceDraftStep",
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];

/**
 * Wipe every RiskFit-owned localStorage key.
 *
 * The local cache is shared per *browser*, not per Firebase uid. With the
 * login-first flow this would otherwise let one Google account see another's
 * (or stale dev) cached wizard input. We call this on sign-out and when a
 * different account signs in, so each session starts from that account's
 * cloud state. Safe to call when storage is unavailable.
 */
export function clearLocalState({ emit = true }: { emit?: boolean } = {}): void {
  for (const key of Object.values(STORAGE_KEYS)) {
    remove(key, { emit });
  }
}

/**
 * Coerce a stored value to a finite number, or `undefined` if it isn't a
 * usable number. The wizard persists numeric inputs as strings (so the form
 * inputs stay controlled), so every numeric field needs this on the way out.
 */
function toFiniteNumber(value: unknown): number | undefined {
  if (typeof value === "number") return Number.isFinite(value) ? value : undefined;
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number(value.replace(/,/g, ""));
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
}

/**
 * Merge the three profile slices written by the wizard into one
 * `UserProfileInput`-shaped object. Missing slices degrade to empty objects.
 *
 * Two normalisations happen here so that the *single* read path feeds every
 * downstream consumer (Analyzing, Result, the calc pipeline) correctly:
 *   1. Numeric fields the wizard stores as strings (age/키/몸무게) are coerced
 *      to real numbers — otherwise `normalizeProfile` rejects them as
 *      non-numbers and silently substitutes defaults.
 *   2. Financial inputs entered in 만원 under `*Man` keys are converted to
 *      canonical 원 under monthlyIncome / monthlyExpense / emergencyFund,
 *      which is what the calc and completeness checks actually read.
 */
export function readProfile<T extends Record<string, unknown>>(): T {
  const basic = read<Record<string, unknown>>(STORAGE_KEYS.profileBasic, {});
  const health = read<Record<string, unknown>>(STORAGE_KEYS.profileHealth, {});
  const rawFamily = read<unknown>(STORAGE_KEYS.profileFamilyHistory, []);
  const familyHistory = Array.isArray(rawFamily) ? rawFamily : [];

  const merged: Record<string, unknown> = { ...basic, ...health };

  for (const key of ["age", "heightCm", "weightKg"] as const) {
    const n = toFiniteNumber(merged[key]);
    if (n === undefined) delete merged[key];
    else merged[key] = n;
  }

  const manToWon: ReadonlyArray<readonly [string, string]> = [
    ["monthlyIncomeMan", "monthlyIncome"],
    ["monthlyExpenseMan", "monthlyExpense"],
    ["emergencyFundMan", "emergencyFund"],
  ];
  for (const [manKey, wonKey] of manToWon) {
    const man = toFiniteNumber(merged[manKey]);
    delete merged[manKey];
    if (man !== undefined) merged[wonKey] = man * 10_000;
  }

  return { ...merged, familyHistory } as unknown as T;
}

/**
 * Read the insurances list. The wizard persists under the plural
 * `riskfit.insurances`; legacy code may have written to the singular
 * `riskfit.insurance`. We try both, preferring the wizard's plural key.
 */
export function readInsurances<T>(): T[] {
  const plural = read<unknown>(STORAGE_KEYS.insurances, null);
  if (Array.isArray(plural) && plural.length > 0) return plural as T[];
  const legacy = read<unknown>(STORAGE_KEYS.insurance, []);
  return Array.isArray(legacy) ? (legacy as T[]) : [];
}
