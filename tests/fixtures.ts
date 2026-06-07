import type { Insurance, ReportSummary, UserProfile } from '../src/types'
import { calculateCompleteness } from '../src/lib/completeness'
import { coverageFit } from '../src/lib/calc/coverageFit'
import { outOfPocket } from '../src/lib/calc/outOfPocket'
import { totalRiskScore } from '../src/lib/calc/totalRiskScore'

// Synthetic golden-case fixture for deterministic regression tests.
// This is not real user data.
export const kimMinjiProfile: UserProfile = {
  name: '김민지',
  age: 27,
  gender: 'female',
  jobGroup: 'office',
  monthlyIncome: 2_500_000,
  monthlyExpense: 1_400_000,
  emergencyFund: 3_000_000,
  hasDependents: false,
  heightCm: 163,
  weightKg: 55,
  checkupIssue: false,
  currentDisease: false,
  hospitalVisits: 'visits_1_2',
  familyHistory: ['cancer', 'hypertension'],
  smoking: 'no',
  drinking: 'weekly_1_2',
  exercise: 'weekly_1_or_less',
  sleep: 'hours_6_7',
  stress: 'high',
  overtime: 'weekly_1_2',
}

export const kimMinjiInsurances: Insurance[] = [
  {
    id: 'actual-medical',
    company: 'DB손해보험',
    productName: '실손보험',
    coverageType: 'actual_medical',
    // Presence-type coverage marked as held. The wizard (InsuranceForm)
    // stores "있음" as coverageAmount: 1 and "없음" as null, so a held 실손
    // must be 1 here — null now correctly reads as "not covered".
    coverageAmount: 1,
    amountUnit: 'presence',
    monthlyPremium: 30_000,
  },
  {
    id: 'cancer',
    company: 'DB손해보험',
    productName: '암진단비보험',
    coverageType: 'cancer_diagnosis',
    coverageAmount: 30_000_000,
    amountUnit: 'krw_per_event',
    monthlyPremium: 32_000,
  },
  {
    id: 'accident-hospital',
    company: '현대해상',
    productName: '상해입원보험',
    coverageType: 'accident_hospitalization',
    coverageAmount: 30_000,
    amountUnit: 'krw_per_day',
    monthlyPremium: 0,
  },
]

export function buildKimMinjiSummary(): ReportSummary {
  const riskScore = totalRiskScore(kimMinjiProfile, kimMinjiInsurances)
  const fit = coverageFit(kimMinjiInsurances, kimMinjiProfile)
  const oop = outOfPocket(kimMinjiProfile, kimMinjiInsurances)
  const completeness = calculateCompleteness(
    kimMinjiProfile,
    kimMinjiInsurances,
  )

  return {
    profileSummary: {
      name: kimMinjiProfile.name,
      age: kimMinjiProfile.age,
      jobGroup: kimMinjiProfile.jobGroup,
      userType: fit.userType,
    },
    riskScore,
    coverageFit: fit,
    weakCoverages: fit.weakCoverages,
    cautionCoverages: fit.cautionCoverages,
    expectedOutOfPocket: oop.total,
    expectedOutOfPocketText: oop.displayText,
    completeness: completeness.percent,
  }
}
