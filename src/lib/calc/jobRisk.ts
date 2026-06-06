import scoringRules from '../../data/scoringRules.json'
import type { JobGroupId, UserProfileInput } from '../../types'
import { normalizeProfile } from './defaults'
import { clampScore } from './interpret'

export function jobRisk(input: UserProfileInput = {}): number {
  const profile = normalizeProfile(input)
  return clampScore(scoreJobGroup(profile.jobGroup))
}

export function scoreJobGroup(jobGroup: JobGroupId): number {
  return scoringRules.job[jobGroup]
}
