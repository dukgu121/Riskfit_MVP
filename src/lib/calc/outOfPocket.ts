import scoringRules from '../../data/scoringRules.json'
import type { Insurance, OutOfPocketResult, UserProfileInput } from '../../types'
import { nonNegativeNumber, normalizeProfile } from './defaults'
import { hasCoverage, sumCoverageAmount } from './coverageFit'

export function outOfPocket(
  input: UserProfileInput = {},
  insurances: Insurance[] = [],
): OutOfPocketResult {
  const profile = normalizeProfile(input)
  const scenario = scoringRules.outOfPocketScenario
  const incomeGap = Math.round(
    (profile.monthlyIncome / 30) * scenario.days,
  )
  const actualMedicalPayout = hasCoverage(insurances, 'actual_medical')
    ? scenario.actualMedicalPayoutIfPresent
    : 0
  const diseaseHospitalizationPayout =
    sumCoverageAmount(insurances, 'disease_hospitalization') * scenario.days
  const insurancePayout = actualMedicalPayout + diseaseHospitalizationPayout
  const total = Math.max(
    0,
    scenario.treatmentCost + incomeGap - insurancePayout,
  )
  const displayAmount = roundToNearest(total, 100_000)

  return {
    days: scenario.days,
    treatmentCost: scenario.treatmentCost,
    incomeGap,
    actualMedicalPayout,
    diseaseHospitalizationPayout,
    insurancePayout: nonNegativeNumber(insurancePayout),
    total,
    displayAmount,
    displayText: formatApproxKrw(displayAmount),
  }
}

export function roundToNearest(value: number, unit: number): number {
  if (!Number.isFinite(value)) return 0
  return Math.round(value / unit) * unit
}

export function formatApproxKrw(value: number): string {
  const manwon = Math.round(value / 10_000)
  return `약 ${manwon.toLocaleString('ko-KR')}만 원`
}
