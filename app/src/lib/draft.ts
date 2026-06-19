/**
 * `lib/draft.ts` — the single analysis-cache + diagnosis-reset layer.
 *
 * MIGRATION_PLAN §5/§7 (FROZEN CONTRACT):
 *   - `/analyzing` calls `computeAndCacheAnalysis(profile, insurances)` ONCE
 *     and writes the result to `riskfit.analysis`.
 *   - Every result / improve / report / premium screen reads that cache
 *     READ-ONLY via `readAnalysis()`. No screen recomputes
 *     `totalRiskScore` / `coverageFit` / `outOfPocket` directly — the cache is
 *     the single source of truth, so headline numbers never drift.
 *   - The only sanctioned re-derivation outside this module is the improvement
 *     simulation (`lib/calc/improvement.ts`), which runs a hypothetical
 *     recompute over edited gaps.
 *
 * Polarity (do not confuse):
 *   - `coverageFit.overall` = 보장 적합도 FIT (higher = better), scored over the
 *     6 user-facing coverage types only (OD-11).
 *   - `riskScore.total` = 위험점수 RISK (higher = worse).
 *
 * This module is pure data plumbing — no React, no JSX — so it stays trivially
 * importable from any lane and is exercised by the build/typecheck.
 */

import {
  coverageBand,
  coverageFit,
  outOfPocket,
  selectUserType,
  totalRiskScore,
} from "./calc";
import { read, remove, write, STORAGE_KEYS } from "./storage";
import type {
  AnalysisCache,
  CoverageFit,
  CoverageTypeId,
  Insurance,
  PremiumState,
  UserProfileInput,
} from "../types";
import { ANALYSIS_CACHE_VERSION } from "../types";

/* ------------------------------------------------------------------ */
/*  coverageFit 6-type restriction (OD-11)                            */
/* ------------------------------------------------------------------ */

/**
 * The 6 user-facing 보장 types the input flow actually collects. The scoring
 * engine knows ~10 types, but the wizard only captures these — so the cached
 * `coverageFit.overall` + counts MUST be restricted to them, otherwise the
 * 72% hero + "공백 N개" story is mathematically unreachable (uncollectable
 * gaps would permanently drag the average down). FROZEN per MIGRATION_PLAN §4.
 */
export const USER_FACING_COVERAGE_TYPES: readonly CoverageTypeId[] = [
  "actual_medical",
  "cancer_diagnosis",
  "disease_hospitalization",
  "accident_hospitalization",
  "surgery",
  "income_interruption",
] as const;

const USER_FACING_SET = new Set<CoverageTypeId>(USER_FACING_COVERAGE_TYPES);

/**
 * Re-derive a `CoverageFit` keeping only the 6 user-facing items, recomputing
 * `overall` + band + the band-bucketed label arrays from that subset.
 *
 * `coverageFit()` already filters by `standardCoverages.required` per user
 * type; we additionally clamp to the user-facing set and rebuild the
 * aggregates so the headline matches what the user could actually input.
 */
export function restrictCoverageFitToUserFacing(full: CoverageFit): CoverageFit {
  const items = full.items.filter((item) => USER_FACING_SET.has(item.type));
  const overall = items.length
    ? Math.round(items.reduce((sum, item) => sum + item.fit, 0) / items.length)
    : 0;

  // Re-band the restricted overall via the canonical, data-driven
  // `coverageBand` (scoringRules.bands.coverageFit) so thresholds never drift
  // from the rest of the engine. The average is capped at 100 (each `fit` ≤
  // 100), so it can't reach the 과도/excessive band — an over-insurance signal
  // stays per-item, not in the headline.
  const band = coverageBand(overall);

  return {
    ...full,
    items,
    overall,
    band: band.id,
    bandLabel: band.label,
    sufficientCoverages: items
      .filter((item) => item.band === "sufficient")
      .map((item) => item.label),
    cautionCoverages: items
      .filter((item) => item.band === "caution")
      .map((item) => item.label),
    weakCoverages: items
      .filter((item) => item.band === "insufficient")
      .map((item) => item.label),
    excessiveCoverages: items
      .filter((item) => item.band === "excessive")
      .map((item) => item.label),
  };
}

/* ------------------------------------------------------------------ */
/*  Analysis cache read / write / compute                             */
/* ------------------------------------------------------------------ */

/** Persist the analysis cache. Called once by `/analyzing`. */
export function writeAnalysis(cache: AnalysisCache): void {
  write(STORAGE_KEYS.analysis, cache);
}

/**
 * Read the cached analysis, or `null` when missing / stale-shape / malformed.
 * Screens 16–29 use this; they must gracefully handle `null` (e.g. redirect to
 * `/analyzing` or show Agent A's seeded preview).
 */
export function readAnalysis(): AnalysisCache | null {
  const cached = read<AnalysisCache | null>(STORAGE_KEYS.analysis, null);
  if (!cached || typeof cached !== "object") return null;
  if (cached.version !== ANALYSIS_CACHE_VERSION) return null;
  if (!cached.riskScore || !cached.coverageFit || !cached.outOfPocket) {
    return null;
  }
  return cached;
}

/** Remove the analysis cache without touching anything else. */
export function clearAnalysis(): void {
  remove(STORAGE_KEYS.analysis);
}

/**
 * Compute the full analysis from a profile + insurances and write it to the
 * cache. The ONLY place `totalRiskScore` / `coverageFit` / `outOfPocket` are
 * called for the live flow. `coverageFit` is restricted to the 6 user-facing
 * types (OD-11) before caching.
 */
export function computeAndCacheAnalysis(
  profile: UserProfileInput,
  insurances: Insurance[],
): AnalysisCache {
  const userType = selectUserType(profile);
  const riskScore = totalRiskScore(profile, insurances);
  const fullFit = coverageFit(insurances, profile);
  const fit = restrictCoverageFitToUserFacing(fullFit);
  const oop = outOfPocket(profile, insurances);

  const cache: AnalysisCache = {
    riskScore,
    coverageFit: fit,
    outOfPocket: oop,
    userType,
    computedAt: Date.now(),
    version: ANALYSIS_CACHE_VERSION,
  };
  writeAnalysis(cache);
  return cache;
}

/* ------------------------------------------------------------------ */
/*  Premium flag                                                       */
/* ------------------------------------------------------------------ */

/** Read the premium (demo) subscription flag. */
export function isPremium(): boolean {
  const state = read<PremiumState | null>(STORAGE_KEYS.premium, null);
  return state?.subscribed === true;
}

/** Set the premium (demo) subscription flag. Survives 재진단. */
export function setPremium(subscribed: boolean): void {
  const state: PremiumState = { subscribed, updatedAt: Date.now() };
  write(STORAGE_KEYS.premium, state);
}

/* ------------------------------------------------------------------ */
/*  Onboarding-seen flag (OD-4)                                        */
/* ------------------------------------------------------------------ */

/** Whether the user has already seen onboarding (skip on revisit). */
export function hasOnboardingSeen(): boolean {
  return read<boolean>(STORAGE_KEYS.onboardingSeen, false) === true;
}

/** Mark onboarding as seen. */
export function setOnboardingSeen(): void {
  write(STORAGE_KEYS.onboardingSeen, true);
}

/* ------------------------------------------------------------------ */
/*  Insurance draft step (resume the 보험 세부 chain)                   */
/* ------------------------------------------------------------------ */

export function readInsuranceDraftStep(): string | null {
  return read<string | null>(STORAGE_KEYS.insuranceDraftStep, null);
}

export function writeInsuranceDraftStep(step: string): void {
  write(STORAGE_KEYS.insuranceDraftStep, step);
}

/* ------------------------------------------------------------------ */
/*  Insurance upsert helper                                            */
/* ------------------------------------------------------------------ */

/**
 * Upsert a single insurance row into a list, returning a NEW array. Matches on
 * `id` first; if the incoming row has no matching id it is appended. Pure — the
 * caller owns persistence (write to `STORAGE_KEYS.insurances`).
 *
 * The 보험 세부 chain saves one coverage type at a time; this keeps the merge
 * logic in one tested place instead of every sub-screen.
 */
export function upsertInsurance(
  list: Insurance[],
  row: Insurance,
): Insurance[] {
  const idx = list.findIndex((item) => item.id === row.id);
  if (idx === -1) return [...list, row];
  const next = list.slice();
  next[idx] = row;
  return next;
}

/* ------------------------------------------------------------------ */
/*  Diagnosis reset (RESET#1/#2/#3)                                    */
/* ------------------------------------------------------------------ */

/**
 * Reset the diagnosis for a fresh "다시 진단하기" run.
 *
 * CLEARS: profile slices (basic/health/family + aggregate/legacy), insurances
 * (plural + legacy singular), the analysis cache, the AI content bundle, the
 * checklist, the cached report, and the insurance draft-step pointer.
 *
 * KEEPS: consent (so the user doesn't re-accept) and premium (so a paid demo
 * survives re-diagnosis — OD-6). Onboarding-seen is also kept (no reason to
 * replay onboarding on a re-diagnose).
 */
export function resetDiagnosis(): void {
  const keysToClear: string[] = [
    STORAGE_KEYS.profile,
    STORAGE_KEYS.profileBasic,
    STORAGE_KEYS.profileHealth,
    STORAGE_KEYS.profileFamilyHistory,
    STORAGE_KEYS.insurance,
    STORAGE_KEYS.insurances,
    STORAGE_KEYS.checklist,
    STORAGE_KEYS.report,
    STORAGE_KEYS.analysis,
    STORAGE_KEYS.aiContent,
    STORAGE_KEYS.insuranceDraftStep,
  ];
  for (const key of keysToClear) remove(key);
}

/**
 * Preserve the `?return=` param as the user walks the input wizard, so the
 * Premium re-input loop (RESET#2/#3) lands back on /premium/lifecycle|report
 * (via /analyzing's `?return=` branch) instead of /result. Read from the live
 * URL at click time; returns "" when absent. Append to each forward navigate:
 *   navigate(`/input/health${returnSuffix()}`)
 */
export function returnSuffix(): string {
  if (typeof window === "undefined") return "";
  const ret = new URLSearchParams(window.location.search).get("return");
  return ret ? `?return=${encodeURIComponent(ret)}` : "";
}
