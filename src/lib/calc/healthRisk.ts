import scoringRules from '../../data/scoringRules.json'
import type { FamilyHistoryCondition, UserProfileInput } from '../../types'
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
    familyHistoryScore

  return clampScore(Math.min(total, scoringRules.health.cap))
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
