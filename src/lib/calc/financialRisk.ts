import scoringRules from '../../data/scoringRules.json'
import type { Insurance, UserProfileInput } from '../../types'
import { nonNegativeNumber, normalizeProfile } from './defaults'
import { clampScore } from './interpret'

type ThresholdRule = {
  minInclusive?: number
  maxExclusive?: number
  score: number
}

export function financialRisk(
  input: UserProfileInput = {},
  insurances: Insurance[] = [],
): number {
  const profile = normalizeProfile(input)
  const emergencyMonths =
    profile.monthlyExpense > 0
      ? profile.emergencyFund / profile.monthlyExpense
      : Number.POSITIVE_INFINITY
  const fixedExpenseRatio =
    profile.monthlyIncome > 0
      ? profile.monthlyExpense / profile.monthlyIncome
      : 1
  const premiumIncomeRatio =
    profile.monthlyIncome > 0
      ? totalMonthlyPremium(insurances) / profile.monthlyIncome
      : 1

  const total =
    scoreThreshold(
      emergencyMonths,
      scoringRules.finance.emergencyFundMonths as ThresholdRule[],
    ) +
    scoreThreshold(
      fixedExpenseRatio,
      scoringRules.finance.fixedExpenseRatio as ThresholdRule[],
    ) +
    (profile.hasDependents
      ? scoringRules.finance.hasDependents.true
      : scoringRules.finance.hasDependents.false) +
    scoreThreshold(
      premiumIncomeRatio,
      scoringRules.finance.premiumIncomeRatio as ThresholdRule[],
    )

  return clampScore(Math.min(total, scoringRules.finance.cap))
}

export function totalMonthlyPremium(insurances: Insurance[]): number {
  return insurances.reduce(
    (sum, item) => sum + nonNegativeNumber(item.monthlyPremium),
    0,
  )
}

export function scoreThreshold(value: number, rules: ThresholdRule[]): number {
  const rule = rules.find((item) => {
    const aboveMin =
      item.minInclusive === undefined || value >= item.minInclusive
    const belowMax =
      item.maxExclusive === undefined || value < item.maxExclusive
    return aboveMin && belowMax
  })
  return rule?.score ?? 0
}
