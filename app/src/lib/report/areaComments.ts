/**
 * `lib/report/areaComments.ts` — DETERMINISTIC, template-driven one-liners for
 * the result drill-down screens. NOT an LLM call (the async `generateReport`
 * lives elsewhere); these resolve synchronously off the score band + the top
 * contributing factor so the same input always yields the same copy.
 *
 * Two surfaces:
 *   - `areaComment(area, score, topFactorLabel?)` — the single AI 코멘트 shown
 *     on p17 (overview) and p18–p22 (per-area detail).
 *   - `buildSummaryBlurb(...)` — the 1-line summary on the p16 result screen,
 *     framed around 보장 적합도 FIT (NOT risk), per the FIT/RISK polarity
 *     contract (MIGRATION_PLAN §9).
 *
 * Toss tone: friendly 해요체, concrete, never alarmist. Import DIRECTLY
 * (`../report/areaComments`); this is a net-new module, not in any barrel.
 */

import type { AreaId } from "../calc/riskContributions";
import type { CoverageBandId, RiskBandId } from "../../types";

/* ------------------------------------------------------------------ */
/*  Risk band from a 0–100 score (mirrors scoringRules.bands.risk)     */
/* ------------------------------------------------------------------ */

/** Local band bucket so this module needs no calc import / no barrel. */
export function riskBandOf(score: number): RiskBandId {
  if (score < 40) return "low";
  if (score < 70) return "medium";
  return "high";
}

/* ------------------------------------------------------------------ */
/*  Per-area copy, keyed by band                                       */
/* ------------------------------------------------------------------ */

const AREA_NOUN: Record<AreaId, string> = {
  lifestyle: "생활습관",
  health: "건강",
  family: "가족력",
  job: "직업",
  financial: "재무",
};

/**
 * Band-keyed base sentences per area. `{top}` is replaced with the top factor
 * label when available, otherwise the sentence degrades gracefully.
 */
const AREA_COPY: Record<AreaId, Record<RiskBandId, string>> = {
  lifestyle: {
    low: "생활습관이 전반적으로 안정적이에요. 지금 리듬을 유지하면 충분해요.",
    medium:
      "생활습관에서 위험을 조금 키우는 부분이 있어요. {top}부터 가볍게 바꿔 보세요.",
    high: "생활습관이 위험을 크게 키우고 있어요. {top}을(를) 먼저 손보는 게 좋아요.",
  },
  health: {
    low: "건강 지표가 양호한 편이에요. 정기검진만 챙기면 돼요.",
    medium:
      "건강 신호 중 살펴볼 항목이 있어요. {top} 관리에 조금만 신경 써 보세요.",
    high: "건강 위험 신호가 또렷해요. {top}은(는) 전문가 상담을 권해요.",
  },
  family: {
    low: "가족력에서 특별히 높은 위험은 보이지 않아요.",
    medium:
      "가족력에 참고할 항목이 있어요. {top} 관련 진단 보장을 챙겨 두면 안심돼요.",
    high: "가족력 위험이 높은 편이에요. {top} 진단비 보장을 우선 점검해 보세요.",
  },
  job: {
    low: "직업으로 인한 위험은 낮은 편이에요.",
    medium:
      "직업 특성상 신경 쓸 위험이 있어요. {top}에 대비한 상해 보장을 점검해 보세요.",
    high: "직업 위험이 높은 편이에요. {top} 관련 상해·소득중단 보장을 강화해 보세요.",
  },
  financial: {
    low: "재무 기반이 탄탄해요. 갑작스러운 지출도 감당할 여력이 있어요.",
    medium:
      "재무 여력에 약한 고리가 있어요. {top}을(를) 보완하면 더 든든해져요.",
    high: "재무 위험이 높은 편이에요. {top}부터 정비해 비상 대응력을 키워 보세요.",
  },
};

/**
 * Build the single deterministic AI 코멘트 for an area. `topFactorLabel` is the
 * highest-contribution factor's label (from `topContribution(...)`); when it's
 * absent or the band is `low`, the sentence still reads naturally.
 */
export function areaComment(
  area: AreaId,
  score: number,
  topFactorLabel?: string,
): string {
  const band = riskBandOf(score);
  const template = AREA_COPY[area][band];
  if (!topFactorLabel || band === "low") {
    // Strip an unfilled "{top}…" clause down to the safe fallback by replacing
    // the placeholder with the area noun so the sentence never shows braces.
    return template.replace(/\{top\}/g, AREA_NOUN[area]);
  }
  return template.replace(/\{top\}/g, topFactorLabel);
}

/* ------------------------------------------------------------------ */
/*  Overview (p17) comment off the TOTAL risk score + worst area       */
/* ------------------------------------------------------------------ */

/**
 * One-liner for the p17 overview, framed on the TOTAL 위험점수 and the
 * highest-contributing area.
 */
export function overviewComment(
  totalRisk: number,
  worstAreaLabel?: string,
): string {
  const band = riskBandOf(totalRisk);
  if (band === "low") {
    return "전반적인 위험이 낮은 편이에요. 지금 보장만 잘 유지하면 든든해요.";
  }
  const area = worstAreaLabel ?? "위험";
  if (band === "medium") {
    return `전반적인 위험은 보통 수준이에요. ${area} 영역을 먼저 살펴보면 좋아요.`;
  }
  return `위험 신호가 높은 편이에요. ${area} 영역부터 점검하고 보장을 채워 보세요.`;
}

/* ------------------------------------------------------------------ */
/*  p16 summary blurb — framed on 보장 적합도 FIT (NOT risk)            */
/* ------------------------------------------------------------------ */

export interface SummaryBlurbInput {
  /** 보장 적합도 overall (0–100, higher = better). */
  fitScore: number;
  /** Coverage band id for the overall fit. */
  fitBand: CoverageBandId;
  /** Names of insufficient (부족) coverages, worst-first. */
  weakCoverages: string[];
  /** Names of caution (주의) coverages. */
  cautionCoverages: string[];
  /** Optional user name for a warmer opener. */
  name?: string;
}

/**
 * Deterministic 1-line summary for the p16 result screen. Always speaks in
 * terms of 보장 적합도 (FIT) and the biggest GAP — never a risk-score
 * "improvement" (polarity contract). Resolves instantly; no async report.
 */
export function buildSummaryBlurb(input: SummaryBlurbInput): string {
  const { fitScore, fitBand, weakCoverages, cautionCoverages } = input;
  const gapCount = weakCoverages.length;
  const firstGap = weakCoverages[0];
  const firstCaution = cautionCoverages[0];

  if (fitBand === "sufficient") {
    if (gapCount === 0 && cautionCoverages.length === 0) {
      return `보장 적합도가 ${fitScore}%로 탄탄해요. 지금 보장을 잘 유지하고 있어요.`;
    }
    return `보장 적합도 ${fitScore}%로 대체로 충분해요. ${firstCaution ?? firstGap}만 한 번 더 살펴보면 완성돼요.`;
  }

  if (fitBand === "insufficient") {
    if (firstGap) {
      return `보장 적합도가 ${fitScore}%예요. 특히 ${firstGap} 보장이 비어 있어 먼저 채우는 게 좋아요.`;
    }
    return `보장 적합도가 ${fitScore}%로 낮은 편이에요. 비어 있는 보장부터 채워 보세요.`;
  }

  // caution band
  if (gapCount > 0 && firstGap) {
    const more = gapCount > 1 ? ` 외 ${gapCount - 1}개` : "";
    return `보장 적합도 ${fitScore}%, 점검이 필요해요. ${firstGap}${more} 보장이 부족해 먼저 채우면 좋아요.`;
  }
  if (firstCaution) {
    return `보장 적합도 ${fitScore}%, 거의 다 왔어요. ${firstCaution} 보장만 조금 보강하면 충분해져요.`;
  }
  return `보장 적합도 ${fitScore}%예요. 몇 가지 보장을 점검하면 더 든든해져요.`;
}
