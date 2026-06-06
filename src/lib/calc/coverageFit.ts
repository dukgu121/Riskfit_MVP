import coverageTypesData from '../../data/coverageTypes.json'
import standardCoveragesData from '../../data/standardCoverages.json'
import type {
  CoverageFit,
  CoverageFitItem,
  CoverageType,
  CoverageTypeId,
  Insurance,
  StandardCoverage,
  UserProfileInput,
  UserTypeId,
} from '../../types'
import { nonNegativeNumber, normalizeProfile } from './defaults'
import { coverageBand } from './interpret'

/**
 * Canonical display + scoring order. `other` is intentionally excluded — it's a
 * catch-all bucket with no standard to compare against.
 *
 * Which of these actually gets scored for a given user is *data-driven*: a type
 * is scored only when `standardCoverages` marks it `required: true` for that
 * user type. That's how 사망보장 is scored for 부양가족 있는 사용자 only, without a
 * special case here — and adding a new coverage is just a data edit.
 */
export const COVERAGE_SCORING_ORDER: CoverageTypeId[] = [
  'actual_medical',
  'cancer_diagnosis',
  'cerebrovascular_diagnosis',
  'cardiac_diagnosis',
  'disease_hospitalization',
  'accident_hospitalization',
  'surgery',
  'income_interruption',
  'death',
  'liability',
]

const coverageTypes = coverageTypesData as CoverageType[]
const standardCoverages = standardCoveragesData as StandardCoverage[]

export function coverageFit(
  insurances: Insurance[] = [],
  profileOrUserType: UserProfileInput | UserTypeId = {},
): CoverageFit {
  const userType =
    typeof profileOrUserType === 'string'
      ? profileOrUserType
      : selectUserType(profileOrUserType)
  const scoredTypes = COVERAGE_SCORING_ORDER.filter((coverageType) =>
    isRequiredFor(userType, coverageType),
  )
  const items = scoredTypes.map((coverageType) =>
    buildCoverageFitItem(coverageType, userType, insurances),
  )
  const overall = items.length
    ? Math.round(items.reduce((sum, item) => sum + item.fit, 0) / items.length)
    : 0
  const band = coverageBand(overall)

  return {
    userType,
    items,
    overall,
    band: band.id,
    bandLabel: band.label,
    sufficientCoverages: items
      .filter((item) => item.band === 'sufficient')
      .map((item) => item.label),
    cautionCoverages: items
      .filter((item) => item.band === 'caution')
      .map((item) => item.label),
    weakCoverages: items
      .filter((item) => item.band === 'insufficient')
      .map((item) => item.label),
    excessiveCoverages: items
      .filter((item) => item.band === 'excessive')
      .map((item) => item.label),
  }
}

export function selectUserType(input: UserProfileInput = {}): UserTypeId {
  const profile = normalizeProfile(input)
  if (profile.hasDependents) return 'has_dependents'
  if (profile.age < 30) return 'twenties_new_worker'
  return 'thirties_worker'
}

export function sumCoverageAmount(
  insurances: Insurance[],
  coverageType: CoverageTypeId,
): number {
  return insurances
    .filter((item) => item.coverageType === coverageType)
    .reduce((sum, item) => sum + nonNegativeNumber(item.coverageAmount), 0)
}

export function hasCoverage(
  insurances: Insurance[],
  coverageType: CoverageTypeId,
): boolean {
  // A row exists for this type, but the user may have explicitly recorded
  // "없음" (stored as coverageAmount null) or a zero amount. Those must NOT
  // count as coverage — otherwise declining 실손 would still read as 충분.
  return insurances.some(
    (item) =>
      item.coverageType === coverageType &&
      item.coverageAmount != null &&
      item.coverageAmount !== 0,
  )
}

function isRequiredFor(
  userType: UserTypeId,
  coverageType: CoverageTypeId,
): boolean {
  const standard = standardCoverages.find(
    (item) => item.userType === userType && item.coverageType === coverageType,
  )
  return standard?.required === true
}

function buildCoverageFitItem(
  coverageType: CoverageTypeId,
  userType: UserTypeId,
  insurances: Insurance[],
): CoverageFitItem {
  const standard = findStandardCoverage(userType, coverageType)
  const meta = findCoverageType(coverageType)
  const current =
    standard.fitMode === 'presence'
      ? hasCoverage(insurances, coverageType)
      : sumCoverageAmount(insurances, coverageType)
  // Uncapped ratio (can exceed 100) — this drives the *band* so over-insurance
  // can reach the "과도" band. `fit` below stays capped at 100 because it feeds
  // the bar + the overall average, where extra coverage shouldn't inflate the
  // protection score.
  const ratioScore =
    standard.fitMode === 'presence'
      ? current
        ? 100
        : 0
      : ratioScoreOf(current as number, standard.standardAmount)
  const fit = Math.min(100, ratioScore)
  const band = coverageBand(ratioScore)

  return {
    type: coverageType,
    label: meta.label,
    current,
    standard:
      standard.fitMode === 'presence' ? standard.required : standard.standardAmount,
    unit: standard.unit,
    fit,
    band: band.id,
    bandLabel: band.label,
  }
}

function ratioScoreOf(current: number, standardAmount: number | null): number {
  if (!standardAmount || standardAmount <= 0) return 0
  return Math.round((current / standardAmount) * 100)
}

function findStandardCoverage(
  userType: UserTypeId,
  coverageType: CoverageTypeId,
): StandardCoverage {
  const standard = standardCoverages.find(
    (item) => item.userType === userType && item.coverageType === coverageType,
  )
  if (!standard) {
    throw new Error(`Missing standard coverage: ${userType}/${coverageType}`)
  }
  return standard
}

function findCoverageType(coverageType: CoverageTypeId): CoverageType {
  const meta = coverageTypes.find((item) => item.id === coverageType)
  if (!meta) throw new Error(`Missing coverage type: ${coverageType}`)
  return meta
}
