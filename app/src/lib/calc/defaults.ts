import type { UserProfile, UserProfileInput } from '../../types'

export const DEFAULT_PROFILE: UserProfile = {
  age: 27,
  gender: 'other',
  jobGroup: 'office',
  monthlyIncome: 2_500_000,
  monthlyExpense: 1_250_000,
  emergencyFund: 2_500_000,
  hasDependents: false,
  heightCm: 170,
  weightKg: 65,
  checkupIssue: false,
  currentDisease: false,
  hospitalVisits: 'visits_1_2',
  familyHistory: ['none'],
  smoking: 'no',
  drinking: 'rare',
  exercise: 'weekly_2',
  sleep: 'hours_7_plus',
  stress: 'normal',
  overtime: 'rare',
  chronicConditions: ['none'],
  bloodPressure: 'normal',
  bloodSugar: 'normal',
  cholesterol: 'normal',
  dietHabit: 'balanced',
}

export function normalizeProfile(input: UserProfileInput = {}): UserProfile {
  return {
    ...DEFAULT_PROFILE,
    ...input,
    age: positiveNumber(input.age, DEFAULT_PROFILE.age),
    monthlyIncome: positiveNumber(
      input.monthlyIncome,
      DEFAULT_PROFILE.monthlyIncome,
    ),
    monthlyExpense: nonNegativeNumber(
      input.monthlyExpense,
      DEFAULT_PROFILE.monthlyExpense,
    ),
    emergencyFund: nonNegativeNumber(
      input.emergencyFund,
      DEFAULT_PROFILE.emergencyFund,
    ),
    heightCm: positiveNumber(input.heightCm, DEFAULT_PROFILE.heightCm),
    weightKg: positiveNumber(input.weightKg, DEFAULT_PROFILE.weightKg),
    familyHistory:
      input.familyHistory && input.familyHistory.length > 0
        ? normalizeFamilyHistory(input.familyHistory)
        : DEFAULT_PROFILE.familyHistory,
  }
}

export function nonNegativeNumber(value: unknown, fallback = 0): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback
  return Math.max(0, value)
}

export function positiveNumber(value: unknown, fallback: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
    return fallback
  }
  return value
}

function normalizeFamilyHistory(
  values: UserProfile['familyHistory'],
): UserProfile['familyHistory'] {
  const knownConditions = values.filter(
    (item) => item !== 'none' && item !== 'unknown',
  )
  if (knownConditions.length > 0) {
    return knownConditions
  }
  if (values.includes('unknown')) {
    return ['unknown']
  }
  if (values.includes('none')) {
    return ['none']
  }
  return values
}
