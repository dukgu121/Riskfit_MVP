/**
 * `lib/preview/sampleData.ts` — a realistic full sample for the ungated review
 * surface. Lets the whole migration be reviewed WITHOUT login or walking the
 * wizard: `seedPreview()` writes the sample profile slices + insurances to
 * localStorage and computes the analysis cache, so screens 16–29 have real data
 * to render.
 *
 * The sample is tuned to the gold-reference story (MIGRATION_PLAN, OD-11):
 * a 20s new worker whose 6 user-facing 보장 mix 충분 / 주의 / 미가입 so the
 * summary lands around the "주의" band with a couple of fixable gaps.
 *
 * IMPORTANT — slice shape: this writes to the SAME slice keys the wizard uses
 * (`riskfit.profile.basic` with `*Man` 만원 keys, `riskfit.profile.health`,
 * `riskfit.profile.familyHistory`), so `readProfile()` merges them identically
 * to a real run. `computeAndCacheAnalysis` then reads via the normal path.
 */

import { computeAndCacheAnalysis } from "../draft";
import {
  readInsurances,
  readProfile,
  remove,
  write,
  STORAGE_KEYS,
} from "../storage";
import type { Insurance, UserProfileInput } from "../../types";

/* ------------------------------------------------------------------ */
/*  Slice fixtures (wizard-shaped)                                     */
/* ------------------------------------------------------------------ */

/** Basic slice — note the `*Man` 만원 keys the wizard persists. */
const SAMPLE_BASIC = {
  name: "김리핏",
  age: 28,
  gender: "female",
  jobGroup: "office",
  monthlyIncomeMan: 320, // 320만원/월
  monthlyExpenseMan: 175,
  emergencyFundMan: 600, // 약 1.9개월치
  hasDependents: false,
  housingType: "rent",
} as const;

/** Health + lifestyle slice (lifestyle lives in the health slice on disk). */
const SAMPLE_HEALTH = {
  heightCm: 164,
  weightKg: 58,
  checkupIssue: false,
  currentDisease: false,
  hospitalVisits: "visits_1_2",
  smoking: "no",
  drinking: "weekly_1_2",
  exercise: "weekly_2",
  sleep: "hours_6_7",
  stress: "high",
  overtime: "weekly_1_2",
  // NEW p5/p6 fields exercised so the schema round-trips them.
  chronicConditions: ["none"],
  bloodPressure: "normal",
  bloodSugar: "caution",
  cholesterol: "normal",
  dietHabit: "irregular",
} as const;

/** Family history — 있음 for 암, the rest omitted/unknown. */
const SAMPLE_FAMILY = ["cancer"] as const;

/* ------------------------------------------------------------------ */
/*  Insurance fixtures (mix covered / under / missing)                */
/*  6 user-facing 보장:
 *    actual_medical            가입함        → 충분
 *    surgery                   가입함        → 충분
 *    cancer_diagnosis          3,600만원     → 권장 4,000만원 대비 주의~충분
 *    disease_hospitalization   40,000원/일   → 권장 50,000 대비 주의
 *    accident_hospitalization  미가입        → 부족
 *    income_interruption       미가입        → 부족
 * ------------------------------------------------------------------ */

const SAMPLE_INSURANCES: Insurance[] = [
  {
    id: "sample-actual-medical",
    company: "샘플손해보험",
    productName: "실손의료비",
    coverageType: "actual_medical",
    coverageAmount: 1, // presence — any positive value reads as 가입
    amountUnit: "presence",
    monthlyPremium: 13_000,
  },
  {
    id: "sample-surgery",
    company: "샘플생명",
    productName: "수술비 특약",
    coverageType: "surgery",
    coverageAmount: 1, // presence
    amountUnit: "presence",
    monthlyPremium: 7_500,
  },
  {
    id: "sample-cancer",
    company: "샘플생명",
    productName: "암진단비",
    coverageType: "cancer_diagnosis",
    coverageAmount: 36_000_000, // 3,600만원
    amountUnit: "krw_per_event",
    monthlyPremium: 22_000,
  },
  {
    id: "sample-disease-hosp",
    company: "샘플손해보험",
    productName: "질병입원일당",
    coverageType: "disease_hospitalization",
    coverageAmount: 40_000, // 40,000원/일
    amountUnit: "krw_per_day",
    monthlyPremium: 9_000,
  },
  // accident_hospitalization & income_interruption intentionally MISSING
  // (no row) so they read as 부족 gaps.
];

/* ------------------------------------------------------------------ */
/*  Public surface                                                     */
/* ------------------------------------------------------------------ */

/** The merged sample profile, as `readProfile` would return it. */
export function sampleProfile(): UserProfileInput {
  return {
    name: SAMPLE_BASIC.name,
    age: SAMPLE_BASIC.age,
    gender: "female",
    jobGroup: "office",
    monthlyIncome: SAMPLE_BASIC.monthlyIncomeMan * 10_000,
    monthlyExpense: SAMPLE_BASIC.monthlyExpenseMan * 10_000,
    emergencyFund: SAMPLE_BASIC.emergencyFundMan * 10_000,
    hasDependents: false,
    heightCm: SAMPLE_HEALTH.heightCm,
    weightKg: SAMPLE_HEALTH.weightKg,
    checkupIssue: false,
    currentDisease: false,
    hospitalVisits: "visits_1_2",
    familyHistory: ["cancer"],
    smoking: "no",
    drinking: "weekly_1_2",
    exercise: "weekly_2",
    sleep: "hours_6_7",
    stress: "high",
    overtime: "weekly_1_2",
    chronicConditions: ["none"],
    bloodPressure: "normal",
    bloodSugar: "caution",
    cholesterol: "normal",
    dietHabit: "irregular",
  };
}

/** The sample insurances list (a fresh copy each call). */
export function sampleInsurances(): Insurance[] {
  return SAMPLE_INSURANCES.map((row) => ({ ...row }));
}

/**
 * Seed localStorage with the sample profile slices + insurances and compute the
 * analysis cache. Idempotent: safe to call on every preview navigation.
 *
 * Writes the wizard-shaped slices so a later real wizard run reads them back
 * consistently, then calls `computeAndCacheAnalysis(readProfile(), readInsurances())`
 * — i.e. the exact production read path, not a shortcut — so the preview proves
 * the real pipeline end-to-end.
 */
export function seedPreview(): void {
  write(STORAGE_KEYS.profileBasic, SAMPLE_BASIC);
  write(STORAGE_KEYS.profileHealth, SAMPLE_HEALTH);
  write(STORAGE_KEYS.profileFamilyHistory, SAMPLE_FAMILY);
  write(STORAGE_KEYS.insurances, sampleInsurances());

  const profile = readProfile<UserProfileInput>();
  const insurances = readInsurances<Insurance>();
  computeAndCacheAnalysis(profile, insurances);
}

/**
 * Seed only if the analysis cache is missing, so a user mid-flow isn't
 * clobbered. Returns true when a seed was performed.
 */
export function seedPreviewIfEmpty(): boolean {
  const hasInsurances = readInsurances<Insurance>().length > 0;
  if (hasInsurances) return false;
  seedPreview();
  return true;
}

/**
 * Clear the user-input slices (profile + insurances + analysis cache) so the
 * INPUT/wizard preview screens render their true production state — empty fields
 * with transparent example placeholders — instead of pre-filled sample values.
 *
 * The result/premium preview screens still call `seedPreview()`; this is only
 * used by the input-side preview routes (see ProtoScreen / ProtoParam).
 */
export function clearPreviewInputs(): void {
  remove(STORAGE_KEYS.profileBasic);
  remove(STORAGE_KEYS.profileHealth);
  remove(STORAGE_KEYS.profileFamilyHistory);
  remove(STORAGE_KEYS.insurances);
  remove(STORAGE_KEYS.insurance);
  remove(STORAGE_KEYS.analysis);
}
