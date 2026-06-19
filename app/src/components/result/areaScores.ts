/**
 * Bridges the cached `RiskScore` (which already holds the four weighted area
 * sub-scores) plus the profile into per-area display values for the drill-down
 * screens. Reads the cache read-only; never recomputes `totalRiskScore`.
 *
 *   - `areaRawScore(area)`  — the area's own 0–100 risk score (the gauge hero).
 *       lifestyle/health/job/financial come straight from the cache. 가족력 is
 *       NOT a weighted area, so it is derived from the profile here.
 *   - `areaWeightedDelta(area)` — points this area contributes to the TOTAL
 *       위험점수 = `rawScore × weight`, for the overview's signed +N bars. 가족력
 *       is excluded from the weighted total (folded into health), so it has no
 *       weighted delta.
 */

import scoringRules from "../../data/scoringRules.json";
import type { AreaId } from "../../lib/calc/riskContributions";
import { familyAreaScore } from "../../lib/calc/riskContributions";
import type { RiskScore, UserProfileInput } from "../../types";

/** Weighted areas only (가족력 is not weighted). */
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
