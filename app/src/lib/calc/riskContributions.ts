/**
 * `lib/calc/riskContributions.ts` — PURE re-exposure of the per-factor
 * contributions the existing `*Risk()` functions compute internally but throw
 * away (verified: `healthRisk` / `lifestyleRisk` / `jobRisk` / `financialRisk`
 * return only a single capped total). The PDF drill-down screens (p18–p22) need
 * the breakdown, so we reproduce the exact same `scoringRules.json` lookups
 * here.
 *
 * ── PARITY CONTRACT (do not break) ───────────────────────────────────────────
 *   For every area, the SUM of the `real` factor deltas returned here must equal
 *   the un-capped pre-clamp total the matching `*Risk()` function produces from
 *   the same lookups. (The engine then applies `Math.min(total, cap)` +
 *   `clampScore`; the area gauge uses the engine's clamped value as `score`, so
 *   a capped-out area reads its true ≤100 hero while the factor list still shows
 *   the additive breakdown.) `demoMock` factors are NOT part of that sum — they
 *   are display-only estimates for PDF fidelity (job sub-splits, income
 *   stability, financial goal, per-disease 가족력), tagged "추정" in the UI.
 *   NOTE: 만성질환·혈압·혈당·콜레스테롤·식습관 are now REAL weighted engine factors.
 *
 * All deltas are `+N` (every `scoringRules` value ≥ 0) → good factors read LOW,
 * never negative; the band/colour conveys good vs bad, not the sign.
 *
 * 가족력 is a STANDALONE display area here (OD-3): the weighted total does NOT
 * gain a 5th area — family history is folded into `healthRisk` — so this module
 * exposes a demo-derived 가족력 score purely for the p20 screen and does not
 * change any headline number.
 *
 * No React, no JSX — trivially importable + exercised by the typecheck. Import
 * DIRECTLY (`../calc/riskContributions`), NOT via the `lib/calc/index.ts` barrel
 * (Agent A owns the barrel).
 */

import scoringRules from "../../data/scoringRules.json";
import type {
  ChronicCondition,
  DietHabit,
  FamilyHistoryCondition,
  JobGroupId,
  UserProfileInput,
  VitalBand,
} from "../../types";
import { normalizeProfile, nonNegativeNumber } from "./defaults";
import { calculateBmi, scoreChronicConditions, scoreVital } from "./healthRisk";
import { totalMonthlyPremium } from "./financialRisk";
import type { Insurance } from "../../types";

/* ------------------------------------------------------------------ */
/*  Shared shapes                                                      */
/* ------------------------------------------------------------------ */

export type AreaId = "lifestyle" | "health" | "family" | "job" | "financial";

/**
 * One contribution row. `delta` is always `≥ 0` (rendered `+N`). `kind`
 * distinguishes engine-real factors (counted in the parity sum) from
 * demo-mock estimates (display-only, "추정").
 */
export interface RiskContribution {
  /** Stable key for React lists. */
  id: string;
  /** UI label (Korean). */
  label: string;
  /** Contribution to the area score (≥ 0). Rendered `+N`. */
  delta: number;
  /** `real` = engine lookup (parity sum); `demoMock` = estimate ("추정"). */
  kind: "real" | "demoMock";
  /** A short human description of the chosen option (e.g. "주 3회 이상"). */
  detail?: string;
}

const r = scoringRules;

/* ------------------------------------------------------------------ */
/*  Threshold helper (mirrors financialRisk.scoreThreshold)            */
/* ------------------------------------------------------------------ */

type ThresholdRule = {
  minInclusive?: number;
  maxExclusive?: number;
  score: number;
};

function scoreThreshold(value: number, rules: ThresholdRule[]): number {
  const rule = rules.find((item) => {
    const aboveMin =
      item.minInclusive === undefined || value >= item.minInclusive;
    const belowMax =
      item.maxExclusive === undefined || value < item.maxExclusive;
    return aboveMin && belowMax;
  });
  return rule?.score ?? 0;
}

type BmiRule = {
  id: string;
  minInclusive?: number;
  maxExclusive?: number;
  score: number;
};

function scoreBmiLocal(bmi: number): number {
  const rules = r.health.bmi as BmiRule[];
  const rule = rules.find((item) => {
    const aboveMin =
      item.minInclusive === undefined || bmi >= item.minInclusive;
    const belowMax =
      item.maxExclusive === undefined || bmi < item.maxExclusive;
    return aboveMin && belowMax;
  });
  return rule?.score ?? 10;
}

/* ------------------------------------------------------------------ */
/*  생활습관 (p18) — ALL real (lifestyleRisk per-factor)               */
/* ------------------------------------------------------------------ */

const SMOKING_DETAIL: Record<string, string> = {
  no: "비흡연",
  yes: "흡연",
};
const DRINKING_DETAIL: Record<string, string> = {
  rare: "거의 안 함",
  weekly_1_2: "주 1~2회",
  weekly_3_plus: "주 3회 이상",
};
const EXERCISE_DETAIL: Record<string, string> = {
  weekly_3_plus: "주 3회 이상",
  weekly_2: "주 2회",
  weekly_1_or_less: "주 1회 이하",
  rare: "거의 안 함",
};
const SLEEP_DETAIL: Record<string, string> = {
  hours_7_plus: "7시간 이상",
  hours_6_7: "6~7시간",
  under_6: "6시간 미만",
};
const STRESS_DETAIL: Record<string, string> = {
  normal: "보통",
  high: "높음",
};
const OVERTIME_DETAIL: Record<string, string> = {
  rare: "거의 없음",
  weekly_1_2: "주 1~2회",
  weekly_3_plus: "주 3회 이상",
};
const DIET_DETAIL: Record<DietHabit, string> = {
  balanced: "균형 잡힘",
  irregular: "불규칙",
  high_sodium: "짠 음식 위주",
  high_fat: "기름진 음식 위주",
};

export function lifestyleContributions(
  input: UserProfileInput = {},
): RiskContribution[] {
  const p = normalizeProfile(input);
  return [
    {
      id: "smoking",
      label: "흡연",
      delta: r.lifestyle.smoking[p.smoking],
      kind: "real",
      detail: SMOKING_DETAIL[p.smoking],
    },
    {
      id: "drinking",
      label: "음주",
      delta: r.lifestyle.drinking[p.drinking],
      kind: "real",
      detail: DRINKING_DETAIL[p.drinking],
    },
    {
      id: "exercise",
      label: "운동",
      delta: r.lifestyle.exercise[p.exercise],
      kind: "real",
      detail: EXERCISE_DETAIL[p.exercise],
    },
    {
      id: "sleep",
      label: "수면",
      delta: r.lifestyle.sleep[p.sleep],
      kind: "real",
      detail: SLEEP_DETAIL[p.sleep],
    },
    {
      id: "stress",
      label: "스트레스",
      delta: r.lifestyle.stress[p.stress],
      kind: "real",
      detail: STRESS_DETAIL[p.stress],
    },
    {
      id: "overtime",
      label: "야근",
      delta: r.lifestyle.overtime[p.overtime],
      kind: "real",
      detail: OVERTIME_DETAIL[p.overtime],
    },
    {
      id: "diet",
      label: "식습관",
      delta: r.lifestyle.dietHabit[p.dietHabit ?? "balanced"],
      kind: "real",
      detail: DIET_DETAIL[p.dietHabit ?? "balanced"],
    },
  ];
}

/* ------------------------------------------------------------------ */
/*  건강 (p19) — BMI/검진/진료/가족력/만성질환/혈압/혈당/콜레스테롤 모두 real */
/* ------------------------------------------------------------------ */

const HOSPITAL_DETAIL: Record<string, string> = {
  visits_1_2: "연 1~2회",
  visits_3_5: "연 3~5회",
  visits_6_plus: "연 6회 이상",
};

const VITAL_DETAIL: Record<VitalBand, string> = {
  normal: "정상",
  caution: "주의",
  high: "높음",
};
const CHRONIC_LABEL: Record<string, string> = {
  hypertension: "고혈압",
  diabetes: "당뇨",
  hyperlipidemia: "고지혈증",
  heart: "심장질환",
  thyroid: "갑상선질환",
  other: "기타",
};
function chronicDetail(conditions: ChronicCondition[] | undefined): string {
  const list = (conditions ?? []).filter((c) => c !== "none");
  return list.length > 0
    ? list.map((c) => CHRONIC_LABEL[c] ?? c).join(", ")
    : "없음";
}

function bmiBandLabel(bmi: number): string {
  if (bmi < 23) return "정상";
  if (bmi < 25) return "과체중";
  return "비만";
}

export function healthContributions(
  input: UserProfileInput = {},
): RiskContribution[] {
  const p = normalizeProfile(input);
  const bmi = calculateBmi(p.heightCm, p.weightKg);

  const familyCount = (input.familyHistory ?? p.familyHistory).filter(
    (item) => item !== "none" && item !== "unknown",
  ).length;
  const familyDelta =
    familyCount <= 0
      ? r.health.familyHistoryCount["0"]
      : familyCount === 1
        ? r.health.familyHistoryCount["1"]
        : r.health.familyHistoryCount["2_plus"];

  const real: RiskContribution[] = [
    {
      id: "bmi",
      label: "체질량지수(BMI)",
      delta: scoreBmiLocal(bmi),
      kind: "real",
      detail: `${bmi > 0 ? bmi.toFixed(1) : "—"} · ${bmiBandLabel(bmi)}`,
    },
    {
      id: "checkup",
      label: "건강검진 이상소견",
      delta: p.checkupIssue
        ? r.health.checkupIssue.present
        : r.health.checkupIssue.none,
      kind: "real",
      detail: p.checkupIssue ? "있음" : "없음",
    },
    {
      id: "currentDisease",
      label: "현재 질환",
      delta: p.currentDisease
        ? r.health.currentDisease.present
        : r.health.currentDisease.none,
      kind: "real",
      detail: p.currentDisease ? "있음" : "없음",
    },
    {
      id: "hospitalVisits",
      label: "병원 방문",
      delta: r.health.hospitalVisits[p.hospitalVisits],
      kind: "real",
      detail: HOSPITAL_DETAIL[p.hospitalVisits],
    },
    {
      id: "familyHistory",
      label: "가족력",
      delta: familyDelta,
      kind: "real",
      detail: familyCount > 0 ? `${familyCount}개 항목` : "없음",
    },
    {
      id: "chronic",
      label: "만성질환",
      delta: scoreChronicConditions(p.chronicConditions),
      kind: "real",
      detail: chronicDetail(p.chronicConditions),
    },
    // Vitals are now part of the weighted health total (real, parity-counted),
    // scored via the same scoringRules.health.vital the engine uses.
    {
      id: "bloodPressure",
      label: "혈압",
      delta: scoreVital(p.bloodPressure),
      kind: "real",
      detail: VITAL_DETAIL[p.bloodPressure ?? "normal"],
    },
    {
      id: "bloodSugar",
      label: "혈당",
      delta: scoreVital(p.bloodSugar),
      kind: "real",
      detail: VITAL_DETAIL[p.bloodSugar ?? "normal"],
    },
    {
      id: "cholesterol",
      label: "콜레스테롤",
      delta: scoreVital(p.cholesterol),
      kind: "real",
      detail: VITAL_DETAIL[p.cholesterol ?? "normal"],
    },
  ];

  return real;
}

/* ------------------------------------------------------------------ */
/*  가족력 (p20) — STANDALONE demo area (OD-3, not a weighted total)   */
/* ------------------------------------------------------------------ */

const FAMILY_CONDITION_LABEL: Record<FamilyHistoryCondition, string> = {
  cancer: "암",
  hypertension: "고혈압",
  diabetes: "당뇨",
  cardio: "심장질환",
  cerebrovascular: "뇌혈관질환",
  dementia: "치매",
  none: "없음",
  unknown: "모름",
};

/**
 * Per-condition demo delta. The engine only counts the NUMBER of conditions
 * (`familyHistoryCount`), so per-disease weighting is a display estimate.
 */
const FAMILY_CONDITION_DELTA: Partial<Record<FamilyHistoryCondition, number>> = {
  cancer: 12,
  cardio: 10,
  cerebrovascular: 10,
  diabetes: 8,
  hypertension: 7,
  dementia: 6,
};

export function familyContributions(
  input: UserProfileInput = {},
): RiskContribution[] {
  const list = (input.familyHistory ?? normalizeProfile(input).familyHistory)
    .filter((item) => item !== "none" && item !== "unknown");
  return list.map((cond) => ({
    id: `family-${cond}`,
    label: FAMILY_CONDITION_LABEL[cond] ?? cond,
    delta: FAMILY_CONDITION_DELTA[cond] ?? 6,
    kind: "demoMock" as const,
    detail: "가족력 있음",
  }));
}

/**
 * Demo-derived standalone 가족력 score (0–100) for the p20 hero gauge ONLY.
 * Maps the engine's family-history-count bands to a presentable 0–100 score so
 * the gauge reads sensibly, without touching any weighted total (OD-3).
 */
export function familyAreaScore(input: UserProfileInput = {}): number {
  const count = (input.familyHistory ?? normalizeProfile(input).familyHistory)
    .filter((item) => item !== "none" && item !== "unknown").length;
  if (count <= 0) return 8;
  if (count === 1) return 42;
  if (count === 2) return 64;
  return 80;
}

/* ------------------------------------------------------------------ */
/*  직업 (p21) — demo-mock sub-factors that SUM to jobRisk(group)      */
/* ------------------------------------------------------------------ */

/**
 * Five PDF sub-factors as fixed FRACTIONS of the job-group score. The fractions
 * sum to 1.0, so the rounded parts sum back to the engine's `jobRisk` (the last
 * part absorbs any rounding remainder) — preserving the "추정 합 = jobRisk"
 * invariant. The split itself is demo-mock (`data/jobFactorWeights.json` was
 * not added; the weights live here as a frozen constant).
 */
const JOB_FACTOR_WEIGHTS: { id: string; label: string; weight: number }[] = [
  { id: "physicalLoad", label: "신체 부담", weight: 0.3 },
  { id: "accidentRisk", label: "사고 위험", weight: 0.25 },
  { id: "environment", label: "근무 환경", weight: 0.2 },
  { id: "commute", label: "출퇴근 위험", weight: 0.15 },
  { id: "irregularHours", label: "근무 시간 불규칙", weight: 0.1 },
];

const JOB_GROUP_DETAIL: Record<JobGroupId, string> = {
  student: "학생",
  office: "사무직",
  service: "서비스직",
  driving: "운전직",
  field: "현장직",
};

export function jobContributions(
  input: UserProfileInput = {},
): RiskContribution[] {
  const p = normalizeProfile(input);
  const total = r.job[p.jobGroup];
  const detail = JOB_GROUP_DETAIL[p.jobGroup];

  // Distribute `total` across the weights; the last factor takes the remainder
  // so the parts sum EXACTLY to `total`.
  let assigned = 0;
  return JOB_FACTOR_WEIGHTS.map((factor, i) => {
    const isLast = i === JOB_FACTOR_WEIGHTS.length - 1;
    const part = isLast
      ? total - assigned
      : Math.round(total * factor.weight);
    assigned += part;
    return {
      id: factor.id,
      label: factor.label,
      delta: Math.max(0, part),
      kind: "demoMock" as const,
      detail,
    };
  });
}

/* ------------------------------------------------------------------ */
/*  재무 (p22) — 저축/부채/보험보장 real; 소득안정성/재무목표 mock       */
/* ------------------------------------------------------------------ */

export function financialContributions(
  input: UserProfileInput = {},
  insurances: Insurance[] = [],
): RiskContribution[] {
  const p = normalizeProfile(input);

  const emergencyMonths =
    p.monthlyExpense > 0
      ? p.emergencyFund / p.monthlyExpense
      : Number.POSITIVE_INFINITY;
  const fixedExpenseRatio =
    p.monthlyIncome > 0 ? p.monthlyExpense / p.monthlyIncome : 1;
  const premiumIncomeRatio =
    p.monthlyIncome > 0
      ? totalMonthlyPremium(insurances) / p.monthlyIncome
      : 1;

  const savingsDelta = scoreThreshold(
    emergencyMonths,
    r.finance.emergencyFundMonths as ThresholdRule[],
  );
  // ⚠ Audit correction: 부채 ≈ fixedExpenseRatio is REAL (not mock); it
  // additionally folds the real hasDependents term so the real parts sum to
  // financialRisk's pre-cap total.
  const debtDelta =
    scoreThreshold(
      fixedExpenseRatio,
      r.finance.fixedExpenseRatio as ThresholdRule[],
    ) +
    (p.hasDependents
      ? r.finance.hasDependents.true
      : r.finance.hasDependents.false);
  const insuranceDelta = scoreThreshold(
    premiumIncomeRatio,
    r.finance.premiumIncomeRatio as ThresholdRule[],
  );

  const real: RiskContribution[] = [
    {
      id: "savings",
      label: "비상금 / 저축",
      delta: savingsDelta,
      kind: "real",
      detail:
        Number.isFinite(emergencyMonths)
          ? `약 ${emergencyMonths.toFixed(1)}개월치`
          : "충분",
    },
    {
      id: "debt",
      label: "고정지출 / 부채",
      delta: debtDelta,
      kind: "real",
      detail: `소득 대비 ${Math.round(fixedExpenseRatio * 100)}%`,
    },
    {
      id: "insuranceLoad",
      label: "보험 보장 비중",
      delta: insuranceDelta,
      kind: "real",
      detail: `보험료 비중 ${Math.round(premiumIncomeRatio * 100)}%`,
    },
  ];

  // Demo-mock: 소득 안정성 (calc has no input for it) + 재무 목표.
  const demo: RiskContribution[] = [
    {
      id: "incomeStability",
      label: "소득 안정성",
      delta: jobToIncomeStabilityDelta(p.jobGroup),
      kind: "demoMock",
      detail: JOB_GROUP_DETAIL[p.jobGroup],
    },
    {
      id: "financialGoal",
      label: "재무 목표 준비",
      delta: 5,
      kind: "demoMock",
      detail: "추정",
    },
  ];

  return [...real, ...demo];
}

/** Demo income-stability estimate anchored on job group (display-only). */
function jobToIncomeStabilityDelta(jobGroup: JobGroupId): number {
  switch (jobGroup) {
    case "office":
      return 3;
    case "student":
      return 6;
    case "service":
      return 8;
    case "driving":
      return 10;
    case "field":
      return 12;
    default:
      return 5;
  }
}

/* ------------------------------------------------------------------ */
/*  Dispatch + helpers                                                 */
/* ------------------------------------------------------------------ */

/** Resolve the contribution list for any area. */
export function contributionsForArea(
  area: AreaId,
  profile: UserProfileInput = {},
  insurances: Insurance[] = [],
): RiskContribution[] {
  switch (area) {
    case "lifestyle":
      return lifestyleContributions(profile);
    case "health":
      return healthContributions(profile);
    case "family":
      return familyContributions(profile);
    case "job":
      return jobContributions(profile);
    case "financial":
      return financialContributions(profile, insurances);
  }
}

/** Sum of only the `real` deltas — used by the parity check / sub-strips. */
export function realContributionTotal(rows: RiskContribution[]): number {
  return rows
    .filter((row) => row.kind === "real")
    .reduce((sum, row) => sum + nonNegativeNumber(row.delta), 0);
}

/** The single highest contribution (real or demo) — drives the AI comment. */
export function topContribution(
  rows: RiskContribution[],
): RiskContribution | null {
  if (rows.length === 0) return null;
  return rows.reduce((top, row) => (row.delta > top.delta ? row : top));
}

/** A `real` contribution tagged with its source area. */
export interface RealAreaContribution extends RiskContribution {
  kind: "real";
  area: AreaId;
}

/**
 * Top `n` ENGINE-REAL risk contributions across ALL areas, biggest 기여 first.
 *
 * `demoMock` rows are EXCLUDED structurally — they are display-only estimates
 * (PARITY CONTRACT, see header) and must NEVER be surfaced as an authoritative
 * cause (e.g. the report's causal headline). `topContribution` above ignores
 * `kind` and would leak the hard-coded family-history estimates (cancer +12 등);
 * use THIS function wherever a factor is stated as fact.
 */
export function topRealContributions(
  profile: UserProfileInput = {},
  insurances: Insurance[] = [],
  n = 2,
): RealAreaContribution[] {
  const areas: AreaId[] = ["lifestyle", "health", "family", "job", "financial"];
  const rows: RealAreaContribution[] = [];
  for (const area of areas) {
    for (const row of contributionsForArea(area, profile, insurances)) {
      if (row.kind === "real" && nonNegativeNumber(row.delta) > 0) {
        rows.push({ ...row, kind: "real", area });
      }
    }
  }
  rows.sort((a, b) => b.delta - a.delta);
  return rows.slice(0, Math.max(0, n));
}
