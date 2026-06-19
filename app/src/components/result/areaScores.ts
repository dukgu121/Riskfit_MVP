/**
 * `areaScores.ts` — bridge the cached `RiskScore` (which already holds the four
 * weighted area sub-scores) + the profile into per-area display values for the
 * drill-down screens.
 *
 *   - `areaRawScore(area)`  — the area's own 0–100 risk score (the gauge hero).
 *       lifestyle/health/job/financial come straight from the cache (no
 *       recompute). 가족력 is a STANDALONE demo-derived score (OD-3) — it does
 *       NOT exist as a weighted area, so it is derived from the profile here.
 *   - `areaWeightedDelta(area)` — how many of the TOTAL 위험점수's points this
 *       area contributes = `rawScore × weight` (MIGRATION_PLAN §6). Used by the
 *       p17 overview's signed +N contribution bars. 가족력 is excluded from the
 *       weighted total (folded into health), so it has no weighted delta.
 *
 * Lane D owns `components/result/*`. Reads the cache READ-ONLY; never calls
 * `totalRiskScore` again.
 */

import scoringRules from "../../data/scoringRules.json";
import type { AreaId } from "../../lib/calc/riskContributions";
import { familyAreaScore } from "../../lib/calc/riskContributions";
import type { RiskScore, UserProfileInput } from "../../types";

/** Weighted areas only (가족력 is not weighted — OD-3). */
export type WeightedAreaId = "lifestyle" | "health" | "job" | "financial";

const WEIGHTS = scoringRules.weights;

const AREA_WEIGHT: Record<WeightedAreaId, number> = {
  health: WEIGHTS.health,
  lifestyle: WEIGHTS.lifestyle,
  job: WEIGHTS.job,
  financial: WEIGHTS.finance,
};

export function isWeightedArea(area: AreaId): area is WeightedAreaId {
  return area !== "family";
}

/** The area's own 0–100 risk score (gauge hero). */
export function areaRawScore(
  area: AreaId,
  risk: RiskScore,
  profile: UserProfileInput,
): number {
  switch (area) {
    case "lifestyle":
      return risk.lifestyle;
    case "health":
      return risk.health;
    case "job":
      return risk.job;
    case "financial":
      return risk.finance;
    case "family":
      return familyAreaScore(profile);
  }
}

/**
 * Points this area contributes to the TOTAL 위험점수 = `rawScore × weight`,
 * rounded. 가족력 returns 0 (not part of the weighted total). The sum of the
 * four weighted deltas ≈ `riskScore.total` (rounding aside) — the same identity
 * the engine uses.
 */
export function areaWeightedDelta(area: AreaId, risk: RiskScore): number {
  if (!isWeightedArea(area)) return 0;
  return Math.round(areaRawScore(area, risk, {}) * AREA_WEIGHT[area]);
}

/** Max possible weighted delta for an area (for bar scaling): `100 × weight`. */
export function areaWeightedMax(area: WeightedAreaId): number {
  return Math.round(100 * AREA_WEIGHT[area]);
}
