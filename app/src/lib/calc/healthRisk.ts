import scoringRules from '../../data/scoringRules.json'
import type {
  ChronicCondition,
  FamilyHistoryCondition,
  UserProfileInput,
  VitalBand,
} from '../../types'
import { clampScore } from './interpret'
import { normalizeProfile } from './defaults'

type BmiRule = {
  id: string
  minInclusive?: number
  maxExclusive?: number
  score: number
}

export function healthRisk(input: UserProfileInput = {}): number {
  const profile = normalizeProfile(input)
  const bmiScore = scoreBmi(calculateBmi(profile.heightCm, profile.weightKg))
  const familyHistoryScore = scoreFamilyHistory(profile.familyHistory)

  const total =
    bmiScore +
    (profile.checkupIssue
      ? scoringRules.health.checkupIssue.present
      : scoringRules.health.checkupIssue.none) +
    (profile.currentDisease
      ? scoringRules.health.currentDisease.present
      : scoringRules.health.currentDisease.none) +
    scoringRules.health.hospitalVisits[profile.hospitalVisits] +
    familyHistoryScore +
    scoreChronicConditions(profile.chronicConditions) +
    scoreVital(profile.bloodPressure) +
    scoreVital(profile.bloodSugar) +
    scoreVital(profile.cholesterol)

  return clampScore(Math.min(total, scoringRules.health.cap))
}

/** Sum of per-condition chronic-illness points, capped. `none` / unset → 0. */
export function scoreChronicConditions(
  conditions: ChronicCondition[] | undefined,
): number {
  if (!conditions || conditions.length === 0) return 0
  const per = scoringRules.health.chronicConditions.perCondition as Record<
    string,
    number
  >
  const sum = conditions
    .filter((c) => c !== 'none')
    .reduce((acc, c) => acc + (per[c] ?? 0), 0)
  return Math.min(sum, scoringRules.health.chronicConditions.max)
}

/** Self-reported vital band (혈압/혈당/콜레스테롤) → risk points. unset → normal(0). */
export function scoreVital(band: VitalBand | undefined): number {
  const v = scoringRules.health.vital as Record<VitalBand, number>
  return v[band ?? 'normal'] ?? 0
}

export function calculateBmi(heightCm: number, weightKg: number): number {
  const heightM = heightCm / 100
  if (heightM <= 0) return 0
  return weightKg / (heightM * heightM)
}

export function scoreBmi(bmi: number): number {
  const rules = scoringRules.health.bmi as BmiRule[]
  const rule = rules.find((item) => {
    const aboveMin =
      item.minInclusive === undefined || bmi >= item.minInclusive
    const belowMax =
      item.maxExclusive === undefined || bmi < item.maxExclusive
    return aboveMin && belowMax
  })
  return rule?.score ?? 10
}

export function scoreFamilyHistory(
  familyHistory: FamilyHistoryCondition[],
): number {
  const count = familyHistory.filter(
    (item) => item !== 'none' && item !== 'unknown',
  ).length

  if (count <= 0) return scoringRules.health.familyHistoryCount['0']
  if (count === 1) return scoringRules.health.familyHistoryCount['1']
  return scoringRules.health.familyHistoryCount['2_plus']
}
