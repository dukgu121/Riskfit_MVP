/**
 * Form helpers for the InsuranceForm modal.
 *
 * Why this lives here:
 *   The 9 coverage types declared in `src/data/coverageTypes.json` each
 *   carry a `valueKind` ("boolean" | "money") and a `unit`
 *   ("presence" | "krw" | "krw_per_event" | "krw_per_day" |
 *   "krw_per_month"). The form must adapt its input field per coverage
 *   type — a boolean "있어요/없어요" toggle for `actual_medical`, a
 *   numeric "만원" entry for `cancer_diagnosis`, etc.
 *
 *   Keeping the branch decisions in a single helper avoids spaghetti
 *   inside the React component and makes unit testing the storage
 *   shape trivial.
 *
 * Storage convention:
 *   Money values are persisted in *원* (KRW). The user enters them in
 *   *만원* for readability, so the form multiplies by 10,000 on save and
 *   divides on load. Day/month per-unit money values are stored in raw
 *   원 to keep aggregation math simple.
 */

import coverageTypesJson from "../data/coverageTypes.json";
import type { AmountUnit, CoverageType, CoverageTypeId } from "../types";

/* ------------------------------------------------------------------
   Coverage-type registry
   ------------------------------------------------------------------ */
export const COVERAGE_TYPES = coverageTypesJson as readonly CoverageType[];

export function getCoverageType(id: CoverageTypeId): CoverageType {
  const found = COVERAGE_TYPES.find((t) => t.id === id);
  if (!found) {
    // Should never happen — the select only lets the user pick known IDs.
    throw new Error(`Unknown coverage type id: ${id}`);
  }
  return found;
}

/* ------------------------------------------------------------------
   UI shape per coverage type
   ------------------------------------------------------------------ */
type CoverageInputMode = "boolean" | "money_man_won" | "money_raw_won";

/** What input control the form should render for this coverage type. */
export function coverageInputMode(id: CoverageTypeId): CoverageInputMode {
  const t = getCoverageType(id);
  if (t.valueKind === "boolean") return "boolean";
  // Lump-sum and per-event money values are large (수억 단위까지) and
  // historically written in 만원 in Korean insurance UX — store as 원 but
  // edit in 만원. Per-day / per-month payouts are written in raw 원 because
  // amounts are smaller and "만원" wouldn't fit the mental model.
  if (t.unit === "krw_per_day" || t.unit === "krw_per_month") {
    return "money_raw_won";
  }
  return "money_man_won";
}

/** Human-readable unit shown to the right of the numeric input. */
export function unitSuffixForType(id: CoverageTypeId): string {
  const mode = coverageInputMode(id);
  switch (mode) {
    case "money_man_won":
      return "만원";
    case "money_raw_won": {
      const t = getCoverageType(id);
      return t.unit === "krw_per_day" ? "원/일" : "원/월";
    }
    case "boolean":
      return "";
  }
}

/** Convert what the form holds (whole-number `만원` or raw `원`) into 원 for storage. */
export function toStoredAmount(
  id: CoverageTypeId,
  formValue: number | null | undefined,
): number | null {
  if (formValue === null || formValue === undefined || !Number.isFinite(formValue)) {
    return null;
  }
  const mode = coverageInputMode(id);
  if (mode === "money_man_won") return Math.round(formValue) * 10_000;
  if (mode === "money_raw_won") return Math.round(formValue);
  return null;
}

/** Inverse of `toStoredAmount`. */
export function fromStoredAmount(
  id: CoverageTypeId,
  storedValue: number | null | undefined,
): number | null {
  if (
    storedValue === null ||
    storedValue === undefined ||
    !Number.isFinite(storedValue)
  ) {
    return null;
  }
  const mode = coverageInputMode(id);
  if (mode === "money_man_won") return Math.round(storedValue / 10_000);
  if (mode === "money_raw_won") return Math.round(storedValue);
  return null;
}

/** Helper to keep amountUnit in sync with the chosen coverageType. */
export function defaultAmountUnit(id: CoverageTypeId): AmountUnit {
  return getCoverageType(id).unit;
}
