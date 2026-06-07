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
}

export interface GeneratedReport {
  source: 'codex' | 'template'
  text: string
  errorReason?: string
}
