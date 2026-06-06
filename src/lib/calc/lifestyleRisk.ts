import scoringRules from '../../data/scoringRules.json'
import type { UserProfileInput } from '../../types'
import { normalizeProfile } from './defaults'
import { clampScore } from './interpret'

export function lifestyleRisk(input: UserProfileInput = {}): number {
  const profile = normalizeProfile(input)
  const total =
    scoringRules.lifestyle.smoking[profile.smoking] +
    scoringRules.lifestyle.drinking[profile.drinking] +
    scoringRules.lifestyle.exercise[profile.exercise] +
    scoringRules.lifestyle.sleep[profile.sleep] +
    scoringRules.lifestyle.stress[profile.stress] +
    scoringRules.lifestyle.overtime[profile.overtime]

  return clampScore(Math.min(total, scoringRules.lifestyle.cap))
}
