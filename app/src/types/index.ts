export type UserTypeId =
  | 'twenties_new_worker'
  | 'thirties_worker'
  | 'has_dependents'

export type RiskBandId = 'low' | 'medium' | 'high'
export type CoverageBandId =
  | 'insufficient'
  | 'caution'
  | 'sufficient'
  | 'excessive'

export type Gender = 'female' | 'male' | 'other'
export type JobGroupId = 'student' | 'office' | 'service' | 'driving' | 'field'

export type HospitalVisits = 'visits_1_2' | 'visits_3_5' | 'visits_6_plus'
export type FamilyHistoryCondition =
  | 'cancer'
  | 'hypertension'
  | 'diabetes'
  | 'cardio'
  | 'cerebrovascular'
  | 'dementia'
  | 'none'
  | 'unknown'

export type SmokingStatus = 'no' | 'yes'
export type DrinkingFrequency = 'rare' | 'weekly_1_2' | 'weekly_3_plus'

/**
 * Chronic conditions captured on the 건강정보 screen. Multi-select with an
 * exclusive `none`. The risk engine consumes these via
 * `scoringRules.health.chronicConditions` (scoreChronicConditions in
 * healthRisk.ts); additive and optional. `other` is a catch-all for conditions
 * outside the listed set.
 */
export type ChronicCondition =
  | 'hypertension'
  | 'diabetes'
  | 'hyperlipidemia'
  | 'heart'
  | 'thyroid'
  | 'other'
  | 'none'

/**
 * Derived band for a vital sign (혈압/혈당/콜레스테롤). The 건강정보 screen lets
 * the user self-report the band; each band adds risk points to the weighted
 * health total (scoringRules.health.vital).
 */
export type VitalBand = 'normal' | 'caution' | 'high'

/** Diet habit captured on 생활습관. Feeds the weighted lifestyle total. */
export type DietHabit = 'balanced' | 'irregular' | 'high_sodium' | 'high_fat'
export type ExerciseFrequency =
  | 'weekly_3_plus'
  | 'weekly_2'
  | 'weekly_1_or_less'
  | 'rare'
export type SleepDuration = 'hours_7_plus' | 'hours_6_7' | 'under_6'
export type StressLevel = 'normal' | 'high'
export type OvertimeFrequency = 'rare' | 'weekly_1_2' | 'weekly_3_plus'

export type CoverageTypeId =
  | 'actual_medical'
  | 'cancer_diagnosis'
  | 'cerebrovascular_diagnosis'
  | 'cardiac_diagnosis'
  | 'disease_hospitalization'
  | 'accident_hospitalization'
  | 'surgery'
  | 'income_interruption'
  | 'death'
  | 'liability'
  | 'other'

export type AmountUnit =
  | 'presence'
  | 'krw'
  | 'krw_per_event'
  | 'krw_per_day'
  | 'krw_per_month'

export type CoverageValueKind = 'boolean' | 'money'
export type CoverageAggregation = 'any' | 'sum'
export type CoverageFitMode = 'presence' | 'ratio'

export interface UserProfile {
  name?: string
  age: number
  gender: Gender
  jobGroup: JobGroupId
  monthlyIncome: number
  monthlyExpense: number
  emergencyFund: number
  hasDependents: boolean
  housingType?: string
  heightCm: number
  weightKg: number
  checkupIssue: boolean
  currentDisease: boolean
  hospitalVisits: HospitalVisits
  familyHistory: FamilyHistoryCondition[]
  smoking: SmokingStatus
  drinking: DrinkingFrequency
  exercise: ExerciseFrequency
  sleep: SleepDuration
  stress: StressLevel
  overtime: OvertimeFrequency

  /* --- Health/lifestyle fields (all optional, backward compatible) ---
     The risk engine consumes these: chronicConditions + the three vital bands
     feed healthRisk (scoringRules.health.chronicConditions/vital); dietHabit
     feeds lifestyleRisk (scoringRules.lifestyle.dietHabit). Per-factor parity
     is verified by tools/smoke-health-fields.ts. */
  /** Multi-select chronic conditions (exclusive `none`). */
  chronicConditions?: ChronicCondition[]
  /** Self-reported blood-pressure band. */
  bloodPressure?: VitalBand
  /** Self-reported blood-sugar band. */
  bloodSugar?: VitalBand
  /** Self-reported cholesterol band. */
  cholesterol?: VitalBand
  /** Diet habit (생활습관). */
  dietHabit?: DietHabit
}

export type UserProfileInput = Partial<UserProfile>

export interface Insurance {
  id: string
  company?: string
  productName?: string
  coverageType: CoverageTypeId
  coverageAmount?: number | null
  amountUnit: AmountUnit
  monthlyPremium?: number
  joinedAt?: string
}

export interface CoverageType {
  id: CoverageTypeId
  label: string
  valueKind: CoverageValueKind
  unit: AmountUnit
  aggregation: CoverageAggregation
  includedInFit: boolean
  description: string
}

export interface StandardCoverage {
  userType: UserTypeId
  coverageType: CoverageTypeId
  required: boolean
  standardAmount: number | null
  unit: AmountUnit
  fitMode: CoverageFitMode
  sourceRef: string
}

export interface Band<TId extends string> {
  id: TId
  min: number
  max: number
  label: string
}

export interface RiskScore {
  total: number
  health: number
  lifestyle: number
  job: number
  finance: number
  band: RiskBandId
  bandLabel: string
}

export interface CoverageFitItem {
  type: CoverageTypeId
  label: string
  current: number | boolean
  standard: number | boolean | null
  unit: AmountUnit
  fit: number
  band: CoverageBandId
  bandLabel: string
}

export interface CoverageFit {
  userType: UserTypeId
  items: CoverageFitItem[]
  overall: number
  band: CoverageBandId
  bandLabel: string
  sufficientCoverages: string[]
  cautionCoverages: string[]
  weakCoverages: string[]
  excessiveCoverages: string[]
}

export interface OutOfPocketResult {
  days: number
  treatmentCost: number
  incomeGap: number
  actualMedicalPayout: number
  diseaseHospitalizationPayout: number
  insurancePayout: number
  total: number
  displayAmount: number
  displayText: string
}

export interface CompletenessResult {
  percent: number
  completed: number
  total: number
  missingFields: string[]
  imputedFields: string[]
}

export interface ReportSummary {
  profileSummary: {
    name?: string
    age?: number
    jobGroup?: JobGroupId
    userType?: UserTypeId
  }
  riskScore: RiskScore
  coverageFit: CoverageFit
  weakCoverages: string[]
  cautionCoverages: string[]
  expectedOutOfPocket: number
  expectedOutOfPocketText: string
  completeness: number

  /* --- Report-AI edge fields ------------------------------------------------
     Data the engine already computes but the report historically discarded.
     Injecting it lets the LLM write the one cross-domain causal sentence the
     template structurally cannot. MUST stay in sync with `reportSummarySchema`
     (.strict) — adding a field here without also adding it to schema.ts makes
     the sidecar reject the body and silently fall back to the template. */
  /** Top engine-REAL 위험 기여 요인 (demoMock 제외). 인과 헤드라인 근거. */
  topRiskFactors: Array<{
    /** 요인 라벨 (예: "음주"). */
    label: string
    /** 위험 점수 기여분 (≥0, 인용만). */
    delta: number
    /** 출처 영역 (lifestyle/health/family/job/financial). */
    area: string
    /** 선택한 옵션 설명 (예: "주 3회 이상"). */
    detail?: string
  }>
  /** 우선 점검 보장 + 개선 후 projected FIT. gapAmount(원금액)은 의도적으로 제외. */
  improvement: {
    /** 가장 비어 있는 보장 top3 (라벨 + 현재 적합도). */
    top: Array<{ label: string; currentFit: number }>
    /** 현재 전체 보장 적합도 FIT. */
    currentOverallFit: number
    /** 모든 빈 보장을 채웠을 때의 적합도 (실제 recompute, 인용 가능한 유일한 상승 수치). */
    projectedOverallFit: number
  }
}

export interface GeneratedReport {
  source: 'codex' | 'template'
  text: string
  errorReason?: string
}

/**
 * The five risk drill-down areas, keyed for the AI 영역별 코멘트 bundle. Mirrors
 * `lib/calc/riskContributions.ts:AreaId` (kept as a literal union here so the
 * shared types module needs no calc import).
 */
export type AiContentAreaId =
  | 'lifestyle'
  | 'health'
  | 'family'
  | 'job'
  | 'financial'

/**
 * One AI-written copy bundle covering every post-/analyzing screen's prose.
 * Generated once at `/analyzing` and cached, so the single busy-mutexed sidecar
 * is hit a single time per analysis instead of per screen. Each field is the
 * FINAL string the screen renders — already either the grounded AI sentence or
 * its deterministic template fallback — so screens read it directly
 * (`readAiContent()?.field`).
 *
 * NUMBERS ARE NEVER AUTHORED BY AI: every field is run through
 * `isReportGrounded` against the analysis whitelist; a field carrying a
 * hallucinated score/amount is replaced by its template, field by field. The
 * scoring engine owns all 점수·금액·% — AI only quotes/interprets them.
 *
 * Field → screen → template fallback:
 *   resultSummary → ResultSummary → buildSummaryBlurb
 *   riskOverview  → RiskDetail    → overviewComment
 *   areas.*       → AreaDetail    → areaComment(area, …)
 *   improveIntro  → Improve       → (the existing Improve intro copy)
 *   report        → Report        → buildTemplateReport (incl. 면책)
 */
export interface AiContentPackage {
  /** 요약 1줄 (보장 적합도 FIT 프레이밍). */
  resultSummary: string
  /** 위험 개요 코멘트 (총 위험점수 + 최다 기여 영역). */
  riskOverview: string
  /** 영역별 코멘트 (영역 점수 + 실제 기여 상위 기반). */
  areas: Record<AiContentAreaId, string>
  /** 인트로 문장 (지금 → 개선 후 적합도 프레이밍). */
  improveIntro: string
  /** 최종 리포트 줄글 (면책 마지막 줄 포함). */
  report: string
}

/**
 * Cache wrapper for {@link AiContentPackage}. `signature` is
 * `JSON.stringify(summary)` (the analysis-derived `ReportSummary`); a read whose
 * signature doesn't match the live analysis is stale and treated as `null`, so a
 * re-diagnosis can never show a previous run's copy. Persisted to
 * `STORAGE_KEYS.aiContent` (localStorage only — like the analysis cache, never
 * synced to Firestore) and cleared by `resetDiagnosis`.
 */
export interface AiContentCache {
  signature: string
  content: AiContentPackage
}

/**
 * The single analysis cache. `/analyzing` computes the full analysis ONCE and
 * writes it here (`riskfit.analysis`); every result/improve/report/premium
 * screen reads it READ-ONLY via `lib/draft.ts`. No screen recomputes
 * `totalRiskScore`/`coverageFit`/`outOfPocket` directly — that keeps headline
 * numbers from drifting across the flow.
 *
 * Polarity (frozen contract):
 *   - `coverageFit.overall` = 보장 적합도 FIT (higher = better) — restricted to
 *     the 6 user-facing coverage types.
 *   - `riskScore.total` = 위험점수 RISK (higher = worse).
 */
export interface AnalysisCache {
  /** 위험점수 (higher = worse). */
  riskScore: RiskScore
  /** 보장 적합도 (higher = better), 6 user-facing types only. */
  coverageFit: CoverageFit
  /** Expected uncovered medical cost for the standard scenario. */
  outOfPocket: OutOfPocketResult
  /** The user-type bucket the analysis was computed against. */
  userType: UserTypeId
  /** Epoch millis the cache was produced. */
  computedAt: number
  /** Cache shape version, so a stale-shape cache can be ignored. */
  version: number
}

/** Current analysis-cache shape version. Bump if `AnalysisCache` changes. */
export const ANALYSIS_CACHE_VERSION = 1

/**
 * Premium (demo paywall) state, persisted to `riskfit.premium` (localStorage
 * only — NOT synced to Firestore). `subscribed` flips when the user taps
 * 구독하기 on the paywall; it survives 재진단 (resetDiagnosis keeps it).
 */
export interface PremiumState {
  subscribed: boolean
  /** Epoch millis the subscription flag was last set. */
  updatedAt?: number
}
