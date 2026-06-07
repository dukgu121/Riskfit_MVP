import scoringRules from '../../data/scoringRules.json'
import type { Band, CoverageBandId, RiskBandId } from '../../types'

const riskBands = scoringRules.bands.risk as Band<RiskBandId>[]
const coverageBands = scoringRules.bands.coverageFit as Band<CoverageBandId>[]

export function clampScore(value: number): number {
  if (!Number.isFinite(value)) return 0
  return Math.max(0, Math.min(100, value))
}

export function riskBand(score: number): Band<RiskBandId> {
  return findBand(riskBands, score)
}

export function coverageBand(score: number): Band<CoverageBandId> {
  return findBand(coverageBands, score)
}

function findBand<TId extends string>(
  bands: Band<TId>[],
  rawScore: number,
): Band<TId> {
  // Clamp the lower bound to 0 but NOT the upper: coverage fit can exceed 100%
  // (over-insurance) and we need that to reach the "excessive" / 과도 band. Risk
  // scores never exceed 100, so they're unaffected. Anything above the last
  // band's `max` falls back to the last band.
  const score = Math.max(0, Math.round(rawScore))
  const band = bands.find((item) => score >= item.min && score <= item.max)
  if (!band) return bands[bands.length - 1]
  return band
}
