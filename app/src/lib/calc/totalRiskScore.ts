import scoringRules from '../../data/scoringRules.json'
import type { Insurance, RiskScore, UserProfileInput } from '../../types'
import { financialRisk } from './financialRisk'
import { healthRisk } from './healthRisk'
import { clampScore, riskBand } from './interpret'
import { jobRisk } from './jobRisk'
import { lifestyleRisk } from './lifestyleRisk'

export function totalRiskScore(
  profile: UserProfileInput = {},
  insurances: Insurance[] = [],
): RiskScore {
  const health = healthRisk(profile)
  const lifestyle = lifestyleRisk(profile)
  const job = jobRisk(profile)
  const finance = financialRisk(profile, insurances)
  const total = Math.round(
    health * scoringRules.weights.health +
      lifestyle * scoringRules.weights.lifestyle +
      job * scoringRules.weights.job +
      finance * scoringRules.weights.finance,
  )
  const band = riskBand(clampScore(total))

  return {
    total: clampScore(total),
    health,
    lifestyle,
    job,
    finance,
    band: band.id,
    bandLabel: band.label,
  }
}
