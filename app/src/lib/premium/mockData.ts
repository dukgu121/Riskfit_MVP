/**
 * `lib/premium/mockData.ts` — the ONLY place in the app that fabricates
 * lifecycle / premium projection numbers (MIGRATION_PLAN, OD-8). Everything
 * produced here is a DEMO ESTIMATE and is always surfaced with a "예측 추정치"
 * caption + a disclaimer banner in the UI. There is NO actuarial model behind
 * these curves — they are deterministic, plausible-looking shapes anchored to
 * the user's real `riskScore.total` + `profile.age` so the demo feels personal.
 *
 * Anchoring (so two users see different curves, but the same user is stable):
 *   - The baseline is today's real `riskScore.total` (0–100, higher = worse).
 *   - Risk drifts upward with age (a gentle convex curve), scaled by the
 *     baseline so a higher-risk user climbs faster.
 *   - Per-disease incidence rows are derived from the same baseline with fixed
 *     per-category multipliers; two are FABRICATED categories (호흡기 / 정신건강)
 *     clearly labelled so a reviewer knows they're illustrative, not scored.
 *
 * No React, no JSX — pure data so it's importable from any premium screen and
 * exercised by the typecheck.
 */

/* ------------------------------------------------------------------ */
/*  Labels                                                             */
/* ------------------------------------------------------------------ */

/** Universal "이건 추정치예요" caption reused across every premium surface. */
export const PREMIUM_ESTIMATE_CAPTION = "예측 추정치";

export const PREMIUM_DISCLAIMER =
  "생애주기 위험 예측은 입력 정보를 바탕으로 한 데모용 추정치예요. 실제 발병률·의료비·보험료와 다를 수 있어요.";

/* ------------------------------------------------------------------ */
/*  Age bands                                                          */
/* ------------------------------------------------------------------ */

export type AgeBandId = "20s" | "30s" | "40s" | "50s" | "60s";

export interface AgeBand {
  id: AgeBandId;
  label: string;
  /** Representative age used to evaluate the projection curve. */
  midAge: number;
}

export const AGE_BANDS: readonly AgeBand[] = [
  { id: "20s", label: "20대", midAge: 25 },
  { id: "30s", label: "30대", midAge: 35 },
  { id: "40s", label: "40대", midAge: 45 },
  { id: "50s", label: "50대", midAge: 55 },
  { id: "60s", label: "60대+", midAge: 65 },
] as const;

/** Map an actual age to the band it falls in (clamped to 20s–60s+). */
export function ageBandForAge(age: number): AgeBandId {
  if (age < 30) return "20s";
  if (age < 40) return "30s";
  if (age < 50) return "40s";
  if (age < 60) return "50s";
  return "60s";
}

/* ------------------------------------------------------------------ */
/*  Disease categories (incl. clearly-fabricated demo categories)     */
/* ------------------------------------------------------------------ */

export interface DiseaseCategory {
  id: string;
  label: string;
  /**
   * Per-category risk multiplier applied to the age-adjusted baseline. Higher =
   * this category drives more of the projected risk for this person.
   */
  weight: number;
  /**
   * `true` for categories that are NOT part of the real scoring engine and are
   * fabricated purely to enrich the demo (호흡기 / 정신건강). The UI labels these.
   */
  fabricated?: boolean;
}

export const DISEASE_CATEGORIES: readonly DiseaseCategory[] = [
  { id: "cancer", label: "암", weight: 1.15 },
  { id: "cardio", label: "심혈관 질환", weight: 1.0 },
  { id: "cerebro", label: "뇌혈관 질환", weight: 0.95 },
  { id: "metabolic", label: "대사 질환(당뇨·고혈압)", weight: 1.05 },
  { id: "respiratory", label: "호흡기 질환", weight: 0.8, fabricated: true },
  { id: "mental", label: "정신건강", weight: 0.7, fabricated: true },
] as const;

/* ------------------------------------------------------------------ */
/*  Curve math (deterministic, anchored to riskScore + age)           */
/* ------------------------------------------------------------------ */

const clamp = (n: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, n));

/**
 * Projected overall RISK (0–100, higher = worse) at a given age, anchored to the
 * user's current risk + current age. The curve rises convexly with age; a higher
 * baseline both raises the floor and steepens the climb.
 */
export function projectedRiskAt(
  baselineRisk: number,
  baselineAge: number,
  targetAge: number,
): number {
  const base = clamp(baselineRisk, 0, 100);
  const dYears = Math.max(0, targetAge - baselineAge);
  // Convex age pressure: ~0.55 pts/yr near baseline, accelerating with age.
  const agePressure = dYears * 0.55 + (dYears * dYears) * 0.012;
  // Scale the climb by how risky the person already is (0.6×–1.4×).
  const scale = 0.6 + (base / 100) * 0.8;
  return Math.round(clamp(base + agePressure * scale, 0, 100));
}

export interface RiskProjectionPoint {
  age: number;
  risk: number;
}

/**
 * The lifecycle line: projected RISK at the band mid-ages, anchored to the
 * user's real risk + age. Always monotonically non-decreasing.
 */
export function riskProjectionCurve(
  baselineRisk: number,
  baselineAge: number,
): RiskProjectionPoint[] {
  return AGE_BANDS.map((band) => ({
    age: band.midAge,
    risk: projectedRiskAt(baselineRisk, baselineAge, band.midAge),
  }));
}

export interface DiseaseRow {
  id: string;
  label: string;
  fabricated: boolean;
  /** Projected relative incidence index for this band (0–100). */
  incidence: number;
  /** Band id derived from the incidence (low/medium/high) for colour. */
  band: "low" | "medium" | "high";
  /** Demo-mock estimated annual medical cost if it occurs (원). */
  estCost: number;
}

function incidenceBand(value: number): DiseaseRow["band"] {
  if (value < 34) return "low";
  if (value < 67) return "medium";
  return "high";
}

/**
 * Per-disease projection rows for a SINGLE age band (NOT a full matrix — the UI
 * shows only the selected band's rows). `incidence` is the age-adjusted baseline
 * times the category weight; `estCost` is a fabricated per-event cost that grows
 * with the band age.
 */
export function diseaseRowsForBand(
  baselineRisk: number,
  baselineAge: number,
  bandId: AgeBandId,
): DiseaseRow[] {
  const band = AGE_BANDS.find((b) => b.id === bandId) ?? AGE_BANDS[0];
  const ageRisk = projectedRiskAt(baselineRisk, baselineAge, band.midAge);

  return DISEASE_CATEGORIES.map((cat) => {
    const incidence = Math.round(clamp(ageRisk * cat.weight, 0, 100));
    // Cost: 280만~1,400만 base by category weight, +20% per decade past 20s.
    const decadeFactor = 1 + (band.midAge - 25) / 50;
    const estCost = Math.round(
      (2_800_000 + cat.weight * 6_200_000) * decadeFactor,
    );
    return {
      id: cat.id,
      label: cat.label,
      fabricated: cat.fabricated === true,
      incidence,
      band: incidenceBand(incidence),
      estCost,
    };
  }).sort((a, b) => b.incidence - a.incidence);
}

/* ------------------------------------------------------------------ */
/*  Premium-report KPIs (현재 / 5년 후 / 10년 후)                       */
/* ------------------------------------------------------------------ */

export interface PremiumKpi {
  id: "now" | "in5" | "in10";
  label: string;
  /** Projected RISK at this horizon. */
  risk: number;
  /** Age at this horizon. */
  age: number;
}

export function premiumHorizonKpis(
  baselineRisk: number,
  baselineAge: number,
): PremiumKpi[] {
  return [
    { id: "now", label: "현재", risk: projectedRiskAt(baselineRisk, baselineAge, baselineAge), age: baselineAge },
    { id: "in5", label: "5년 후", risk: projectedRiskAt(baselineRisk, baselineAge, baselineAge + 5), age: baselineAge + 5 },
    { id: "in10", label: "10년 후", risk: projectedRiskAt(baselineRisk, baselineAge, baselineAge + 10), age: baselineAge + 10 },
  ];
}

/**
 * The 5-year lifecycle micro-curve used on the premium report (yearly points
 * from now → +5y), anchored the same way as the band curve.
 */
export function fiveYearProjection(
  baselineRisk: number,
  baselineAge: number,
): RiskProjectionPoint[] {
  return Array.from({ length: 6 }, (_, i) => ({
    age: baselineAge + i,
    risk: projectedRiskAt(baselineRisk, baselineAge, baselineAge + i),
  }));
}

/* ------------------------------------------------------------------ */
/*  Expected medical cost (demo-mock)                                  */
/* ------------------------------------------------------------------ */

export interface ExpectedMedicalCost {
  /** Projected annual expected medical cost 5 years out (원). */
  annual: number;
  /** Cumulative expected medical cost over the next 5 years (원). */
  fiveYearCumulative: number;
}

/**
 * Demo-mock expected medical cost, scaled by projected risk + age. Deliberately
 * coarse — it exists to give the premium report a money headline, always behind
 * the "예측 추정치" label.
 */
export function expectedMedicalCost(
  baselineRisk: number,
  baselineAge: number,
): ExpectedMedicalCost {
  const r5 = projectedRiskAt(baselineRisk, baselineAge, baselineAge + 5);
  // 80만~약 600만/년 across the risk range, ageing up gently.
  const annual = Math.round(
    (800_000 + (r5 / 100) * 5_200_000) * (1 + (baselineAge - 25) / 80),
  );
  // 5y cumulative ≈ average of now→+5y annuals (rising), ~5.5× the +5y annual.
  const fiveYearCumulative = Math.round(annual * 4.6);
  return { annual, fiveYearCumulative };
}

/* ------------------------------------------------------------------ */
/*  Static narrative (premium report)                                 */
/* ------------------------------------------------------------------ */

/**
 * Static, deterministic narrative for the premium report (p29). Toss tone, plain
 * statements, no greetings / sales push / personification. NOT LLM-generated —
 * this is the demo's fixed copy, parameterised by the projection numbers.
 */
export function premiumReportNarrative(args: {
  name?: string;
  baselineRisk: number;
  baselineAge: number;
}): string[] {
  const { name, baselineRisk, baselineAge } = args;
  const subject = name?.trim() ? `${name.trim()}님은 ` : "";
  const kpis = premiumHorizonKpis(baselineRisk, baselineAge);
  const now = kpis[0].risk;
  const in10 = kpis[2].risk;
  const delta = in10 - now;
  const cost = expectedMedicalCost(baselineRisk, baselineAge);
  const topBand = diseaseRowsForBand(baselineRisk, baselineAge, ageBandForAge(baselineAge + 10))[0];

  const paras: string[] = [];

  paras.push(
    `${subject}현재 위험점수가 ${now}점이에요. 같은 생활 패턴이 이어진다고 가정하면, 10년 뒤에는 약 ${in10}점까지 ${delta > 0 ? `${delta}점 높아질` : "비슷하게 유지될"} 것으로 보여요.`,
  );

  paras.push(
    `나이가 들수록 위험은 완만하게 올라가는 편이에요. 특히 ${topBand.label} 쪽 지표가 상대적으로 높게 추정돼, 관련 보장을 미리 살펴보면 도움이 돼요.`,
  );

  paras.push(
    `예상 의료비는 5년 후 기준 연 ${formatManwon(cost.annual)} 정도, 5년 누적으로는 ${formatManwon(cost.fiveYearCumulative)} 안팎으로 추정돼요. 실제 금액은 가입 상품과 건강 상태에 따라 달라질 수 있어요.`,
  );

  return paras;
}

/* ------------------------------------------------------------------ */
/*  Tiny formatter (local — display only)                             */
/* ------------------------------------------------------------------ */

/** "약 N만 원" style — keeps the narrative consistent with the calc layer. */
export function formatManwon(value: number): string {
  if (value >= 100_000_000) {
    const eok = value / 100_000_000;
    return `약 ${Number.isInteger(eok) ? eok : eok.toFixed(1)}억 원`;
  }
  const manwon = Math.round(value / 10_000);
  return `약 ${manwon.toLocaleString("ko-KR")}만 원`;
}
