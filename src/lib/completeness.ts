import type {
  CompletenessResult,
  Insurance,
  UserProfile,
  UserProfileInput,
} from '../types'

type CompletenessField = {
  key: keyof UserProfile | 'insurances'
  label: string
  hasValue: (profile: UserProfileInput, insurances: Insurance[]) => boolean
  defaultedByCalc: boolean
}

export const COMPLETENESS_SCHEMA_VERSION = 1

const fields: CompletenessField[] = [
  field('age', '나이', isPositiveNumber),
  field('gender', '성별', isNonEmptyString),
  field('jobGroup', '직업'),
  field('monthlyIncome', '월 소득', isPositiveNumber),
  field('monthlyExpense', '월 고정지출', isNonNegativeNumber),
  field('emergencyFund', '비상금', isNonNegativeNumber),
  field('hasDependents', '부양가족 여부', isBoolean),
  field('heightCm', '키', isPositiveNumber),
  field('weightKg', '몸무게', isPositiveNumber),
  field('checkupIssue', '건강검진 이상 여부', isBoolean),
  field('currentDisease', '현재 치료 중인 질병', isBoolean),
  field('hospitalVisits', '최근 1년 병원 방문 빈도'),
  {
    key: 'familyHistory',
    label: '가족력',
    defaultedByCalc: true,
    hasValue: (profile) =>
      Array.isArray(profile.familyHistory) && profile.familyHistory.length > 0,
  },
  field('smoking', '흡연 여부'),
  field('drinking', '음주 빈도'),
  field('exercise', '운동 빈도'),
  field('sleep', '평균 수면 시간'),
  field('stress', '스트레스 수준'),
  field('overtime', '야근 빈도'),
  {
    key: 'insurances',
    label: '가입 보험',
    defaultedByCalc: false,
    hasValue: (_profile, insurances) => insurances.length > 0,
  },
]

export function calculateCompleteness(
  profile: UserProfileInput = {},
  insurances: Insurance[] = [],
): CompletenessResult {
  const missingFields = fields
    .filter((item) => !item.hasValue(profile, insurances))
    .map((item) => item.label)
  const imputedFields = fields
    .filter((item) => item.defaultedByCalc && !item.hasValue(profile, insurances))
    .map((item) => item.label)
  const completed = fields.length - missingFields.length

  return {
    percent: Math.round((completed / fields.length) * 100),
    completed,
    total: fields.length,
    missingFields,
    imputedFields,
  }
}

function field(
  key: keyof UserProfile,
  label: string,
  predicate: (value: unknown) => boolean = isNonEmptyString,
): CompletenessField {
  return {
    key,
    label,
    defaultedByCalc: true,
    hasValue: (profile) => predicate(profile[key]),
  }
}

function isBoolean(value: unknown): boolean {
  return typeof value === 'boolean'
}

function isNonEmptyString(value: unknown): boolean {
  return typeof value === 'string' && value.length > 0
}

function isPositiveNumber(value: unknown): boolean {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
}

function isNonNegativeNumber(value: unknown): boolean {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0
}
