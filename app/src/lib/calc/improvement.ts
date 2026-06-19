/**
 * Improvement-plan + improvement-simulation engine for the 개선 and 리포트 flow.
 *
 * Given the user's real profile + insurances, it computes a hypothetical world
 * where the gaps the user could realistically fill are filled to the standard,
 * then re-runs the real `coverageFit` / `outOfPocket` calc over that virtual
 * insurance list. So the FIT headline (and the 공백/자기부담금 deltas) is a real
 * recompute, not a fabricated number — the only sanctioned re-derivation outside
 * `lib/draft.ts`.
 *
 * Polarity (frozen contract): everything here is 보장 적합도 FIT (higher = better).
 * We never show a risk-score "improvement" — the risk model barely moves when you
 * buy coverage, and showing a "risk dropped" number would mislead.
 *
 * Only the 6 user-facing coverage types are scored, so only their gaps are
 * fillable. We reuse `restrictCoverageFitToUserFacing` + the same standard-coverage
 * data the live calc reads, so the projected FIT is on the same scale as the
 * cached `coverageFit.overall`.
 *
 * Pure functions over the inputs + the static standard-coverage table. No
 * randomness, no actuarial model — "fill the gap to the standard" is the entire
 * mechanic.
 */

import standardCoveragesData from "../../data/standardCoverages.json";
import {
  coverageFit,
  outOfPocket,
  selectUserType,
  sumCoverageAmount,
  hasCoverage,
} from "../calc";
import {
  restrictCoverageFitToUserFacing,
  USER_FACING_COVERAGE_TYPES,
} from "../draft";
import type {
  AnalysisCache,
  CoverageBandId,
  CoverageFitItem,
  CoverageTypeId,
  Insurance,
  OutOfPocketResult,
  StandardCoverage,
  UserProfileInput,
  UserTypeId,
} from "../../types";

const standardCoverages = standardCoveragesData as StandardCoverage[];

/**
 * A single fillable improvement item — one of the 6 user-facing coverages that
 * currently scores below 충분 for this user. `gapAmount` is the shortfall to the
 * standard (in the coverage's native unit); `presenceGap` flags a missing
 * presence-only coverage (실손/수술) where the "gap" is binary, not a number.
 */
export interface ImprovementItem {
  type: CoverageTypeId;
  label: string;
  band: CoverageBandId;
  /** Current fit 0–100 (capped). */
  currentFit: number;
  /** Whether this coverage is presence-only (가입/미가입) vs an amount. */
  presence: boolean;
  /** Current amount in native unit (0 for missing / presence-absent). */
  current: number;
  /** Standard / 권장 amount in native unit (null for presence). */
  standard: number | null;
  /** Shortfall to the standard in native unit (0 when already met). */
  gapAmount: number;
  /** Native unit of the amounts above. */
  unit: StandardCoverage["unit"];
  /** Estimated FIT points recovered if this single gap is filled to standard. */
  fitGain: number;
}

export interface ImprovementPlan {
  userType: UserTypeId;
  /** All fillable items, worst-fit first (biggest opportunity first). */
  items: ImprovementItem[];
  /** Top 3 priorities (the worst gaps). */
  top3: ImprovementItem[];
  /** Current 보장 적합도 FIT (= cached `coverageFit.overall`). */
  currentOverallFit: number;
  /** Projected FIT if ALL `items` gaps are filled to the standard. */
  projectedOverallFit: number;
}

export interface SimulationMetric {
  /** Value today (read from the live recompute over current insurances). */
  before: number;
  /** Value after filling the selected gaps. */
  after: number;
}

export interface ImprovementSimulation {
  /** 보장 적합도 FIT — higher is better (before → after). */
  fit: SimulationMetric;
  /** 보장 공백 개수 — count of 미흡(부족/주의) coverages (lower is better). */
  gapCount: SimulationMetric;
  /** 예상 자기부담금 (원) — out-of-pocket for the standard scenario (lower better). */
  outOfPocket: SimulationMetric;
  /** The picks that were applied. */
  appliedTypes: CoverageTypeId[];
  /** The virtual insurance list used for the "after" recompute. */
  projectedInsurances: Insurance[];
}

// Standard-coverage lookup, mirroring coverageFit's data source.
function findStandard(
  userType: UserTypeId,
  coverageType: CoverageTypeId,
): StandardCoverage | undefined {
  return standardCoverages.find(
    (item) => item.userType === userType && item.coverageType === coverageType,
  );
}

/**
 * Build a new insurance list where each picked coverage is topped up to its
 * standard. Pure: never mutates the input list.
 *
 * - presence coverages (실손/수술 — `fitMode: presence`): if absent, append a
 *   synthetic row with a positive presence amount so `hasCoverage` reads 가입.
 * - amount coverages: append a synthetic row carrying the *shortfall* so the
 *   summed amount reaches the standard (`sumCoverageAmount` aggregates rows).
 *
 * Coverages already at/above standard are skipped (no-op top-up).
 */
function fillGaps(
  insurances: Insurance[],
  userType: UserTypeId,
  picks: readonly CoverageTypeId[],
): Insurance[] {
  const next = insurances.map((row) => ({ ...row }));

  for (const type of picks) {
    const standard = findStandard(userType, type);
    if (!standard || standard.required !== true) continue;

    if (standard.fitMode === "presence") {
      if (!hasCoverage(next, type)) {
        next.push({
          id: `sim-fill-${type}`,
          productName: "권장 보장(가상)",
          coverageType: type,
          coverageAmount: 1,
          amountUnit: "presence",
        });
      }
      continue;
    }

    const target = standard.standardAmount ?? 0;
    if (target <= 0) continue;
    const current = sumCoverageAmount(next, type);
    const shortfall = target - current;
    if (shortfall <= 0) continue;

    next.push({
      id: `sim-fill-${type}`,
      productName: "권장 보장(가상)",
      coverageType: type,
      coverageAmount: shortfall,
      amountUnit: standard.unit,
    });
  }

  return next;
}

/**
 * Count "보장 공백" = coverages whose band is 부족(insufficient) OR 주의(caution).
 * This is the user-facing "채워야 할 보장" count the 개선 flow promises to shrink.
 */
function countGaps(items: CoverageFitItem[]): number {
  return items.filter(
    (item) => item.band === "insufficient" || item.band === "caution",
  ).length;
}

/**
 * Build the improvement plan from the cached analysis + the source profile /
 * insurances. The plan's `currentOverallFit` matches the cache exactly; the
 * `projectedOverallFit` is a real recompute with every fillable gap filled.
 *
 * We pass `profile`/`insurances` because the cache stores the scored result, not
 * the raw inputs — the simulation needs the raw insurance rows to top up.
 */
export function improvementPlan(
  analysis: AnalysisCache,
  profile: UserProfileInput,
  insurances: Insurance[],
): ImprovementPlan {
  const userType = analysis.userType;
  const baseFit = analysis.coverageFit;

  // Fillable = a user-facing item below 충분 (band !== sufficient/excessive).
  const userFacing = new Set<CoverageTypeId>(USER_FACING_COVERAGE_TYPES);
  const fillable = baseFit.items.filter(
    (item) =>
      userFacing.has(item.type) &&
      item.band !== "sufficient" &&
      item.band !== "excessive",
  );

  const items: ImprovementItem[] = fillable.map((item) => {
    const standard = findStandard(userType, item.type);
    const presence = standard?.fitMode === "presence";
    const standardAmount = presence ? null : standard?.standardAmount ?? null;
    const current = presence
      ? item.current === true || item.current === 1
        ? 1
        : 0
      : typeof item.current === "number"
        ? item.current
        : 0;
    const gapAmount = presence
      ? current > 0
        ? 0
        : 1
      : Math.max(0, (standardAmount ?? 0) - current);

    // FIT recovered by filling this gap to standard: the gap closes to 100,
    // so the gain is the distance from the current (capped) fit.
    const fitGain = Math.max(0, 100 - item.fit);

    return {
      type: item.type,
      label: item.label,
      band: item.band,
      currentFit: item.fit,
      presence,
      current,
      standard: standardAmount,
      gapAmount,
      unit: standard?.unit ?? item.unit,
      fitGain,
    };
  });

  // Worst fit first → biggest opportunity first (presence-absent (fit 0) leads).
  items.sort((a, b) => a.currentFit - b.currentFit);

  // Projected FIT: fill EVERY fillable gap, recompute over the real calc.
  const allPicks = items.map((item) => item.type);
  const projected = fillGaps(insurances, userType, allPicks);
  const projectedFit = restrictCoverageFitToUserFacing(
    coverageFit(projected, profile),
  );

  return {
    userType,
    items,
    top3: items.slice(0, 3),
    currentOverallFit: baseFit.overall,
    projectedOverallFit: projectedFit.overall,
  };
}

/**
 * Recompute 적합도 / 공백 / 자기부담금 for a chosen set of gap fills, comparing
 * the live "before" (current insurances) against the "after" (gaps virtually
 * filled). Real recompute through the exact production calc path.
 *
 * `picks` defaults to ALL user-facing fillable coverages (the "fill everything"
 * preview the 개선 효과 screen shows). Pass a subset to preview a partial plan.
 */
export function simulateImprovement(
  profile: UserProfileInput,
  insurances: Insurance[],
  picks?: readonly CoverageTypeId[],
): ImprovementSimulation {
  const userType = selectUserType(profile);

  // BEFORE — recompute over the real inputs (matches the cache by construction).
  const beforeFitFull = coverageFit(insurances, profile);
  const beforeFit = restrictCoverageFitToUserFacing(beforeFitFull);
  const beforeOop = outOfPocket(profile, insurances);

  // Default picks: every user-facing coverage currently below 충분.
  const userFacing = new Set<CoverageTypeId>(USER_FACING_COVERAGE_TYPES);
  const resolvedPicks =
    picks ??
    beforeFit.items
      .filter(
        (item) =>
          userFacing.has(item.type) &&
          item.band !== "sufficient" &&
          item.band !== "excessive",
      )
      .map((item) => item.type);

  const projectedInsurances = fillGaps(insurances, userType, resolvedPicks);

  // AFTER — recompute over the virtual list.
  const afterFit = restrictCoverageFitToUserFacing(
    coverageFit(projectedInsurances, profile),
  );
  const afterOop: OutOfPocketResult = outOfPocket(profile, projectedInsurances);

  return {
    fit: { before: beforeFit.overall, after: afterFit.overall },
    gapCount: {
      before: countGaps(beforeFit.items),
      after: countGaps(afterFit.items),
    },
    outOfPocket: {
      before: beforeOop.total,
      after: afterOop.total,
    },
    appliedTypes: [...resolvedPicks],
    projectedInsurances,
  };
}
