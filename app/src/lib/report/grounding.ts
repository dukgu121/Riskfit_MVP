import type { ReportSummary } from '../../types'

/** Korean money units → 원. `천만` must precede `만`/`천` in the alternation. */
const UNIT_TO_WON: Record<string, number> = {
  억: 100_000_000,
  천만: 10_000_000,
  만: 10_000,
  천: 1_000,
  원: 1,
}

/**
 * Number-grounding safety net.
 *
 * `sanitizeReport` strips banned PHRASES but never checks numbers, so nothing
 * stops the model from inventing a figure — and one hallucinated "78%" (or a
 * fabricated 가입 금액) in an insurance report is a trust / regulatory hazard.
 * This pure, zero-call check pulls the "claim" numbers out of the prose and
 * returns false if any does NOT correspond to a value in the summary; the
 * caller (`generateReport`) then falls back to the (already correct) template.
 *
 * Checked claim classes:
 *   - 점 / % scores (0–100, decimal-aware) → must be a summary score.
 *   - amounts in 억/천만/만/천/원 (≥1만원) → must be a summary amount (±1만).
 *   - 개 counts → must be ≤ item count / a band-list length.
 *   - "+N%p" per-coverage margins → ALWAYS rejected; the only sanctioned uplift
 *     is the full current→projected fit, e.g. "72%에서 90%까지".
 *
 * Deliberately lenient: incidental small numbers (7일, 3회, 28세, <1만원) are
 * ignored and ±1 rounding + surface variants ("약 270만 원 가까이") pass, so the
 * Toss tone survives. It only catches NEW, ungrounded score/amount/count claims
 * and the forbidden %p margin — not natural phrasing.
 *
 * Kept in its own module (no `import.meta.env`) so it stays trivially importable
 * by both the browser client and the `tools/` smoke test.
 */
export function isReportGrounded(text: string, summary: ReportSummary): boolean {
  // (0) Per-coverage margin "+N%p" is forbidden outright — reject any digit-%-p.
  if (/\d\s*[%％]\s*[pP]/.test(text)) return false

  // (1) Allowed 0–100 scores (floor/round/ceil → tolerate display rounding).
  const scores = new Set<number>()
  const addScore = (n: unknown) => {
    if (typeof n === 'number' && Number.isFinite(n)) {
      scores.add(Math.floor(n))
      scores.add(Math.round(n))
      scores.add(Math.ceil(n))
    }
  }
  const rs = summary.riskScore
  ;[rs.total, rs.health, rs.lifestyle, rs.job, rs.finance].forEach(addScore)
  addScore(summary.coverageFit.overall)
  summary.coverageFit.items.forEach((item) => addScore(item.fit))
  addScore(summary.completeness)
  summary.topRiskFactors?.forEach((factor) => addScore(factor.delta))
  const imp = summary.improvement
  if (imp) {
    addScore(imp.currentOverallFit)
    addScore(imp.projectedOverallFit)
    imp.top.forEach((entry) => addScore(entry.currentFit))
  }

  // (2) Allowed amounts, normalized to 만-units (±1만 tolerance).
  const manAmounts = new Set<number>()
  const addMan = (man: number) => {
    if (!Number.isFinite(man)) return
    manAmounts.add(Math.floor(man))
    manAmounts.add(Math.round(man))
    manAmounts.add(Math.ceil(man))
  }
  if (Number.isFinite(summary.expectedOutOfPocket)) {
    addMan(summary.expectedOutOfPocket / 10_000)
  }
  const textMan = parseAmountToMan(summary.expectedOutOfPocketText)
  if (textMan != null) addMan(textMan)

  // (3) Allowed 개 counts: 0..item-count plus each band-list length.
  const counts = new Set<number>()
  const itemCount = summary.coverageFit.items.length
  for (let i = 0; i <= itemCount; i++) counts.add(i)
  for (const arr of [
    summary.weakCoverages,
    summary.cautionCoverages,
    summary.coverageFit.sufficientCoverages,
    summary.coverageFit.excessiveCoverages,
  ]) {
    if (Array.isArray(arr)) counts.add(arr.length)
  }

  // Percentages / 점 scores (decimal-aware).
  for (const match of text.matchAll(/(\d+(?:\.\d+)?)\s*(?:%|％|점)/g)) {
    const value = Number.parseFloat(match[1])
    if (![Math.floor(value), Math.round(value), Math.ceil(value)].some((x) => scores.has(x))) {
      return false
    }
  }

  // Amounts: a number + optional 억/천만/만/천 unit, but ONLY when it ends in 원
  // (skip incidental <1만원). Requiring the trailing 원 avoids false-matching the
  // 만/천/억 syllables inside ordinary words — "12만큼"(=12 as much as), "수천",
  // "기억" — which would otherwise wrongly fall back a perfectly grounded report.
  for (const match of text.matchAll(/([\d,]+(?:\.\d+)?)\s*(억|천만|만|천)?\s*원/g)) {
    const raw = Number.parseFloat(match[1].replace(/,/g, ''))
    if (!Number.isFinite(raw)) continue
    const won = raw * UNIT_TO_WON[match[2] ?? '원']
    if (won < 10_000) continue
    const man = won / 10_000
    if (![Math.floor(man), Math.round(man), Math.ceil(man)].some((x) => manAmounts.has(x))) {
      return false
    }
  }

  // 개 counts (exclude 개월 month-unit).
  for (const match of text.matchAll(/(\d+)\s*개(?!월)/g)) {
    if (!counts.has(Number.parseInt(match[1], 10))) return false
  }

  return true
}

function parseAmountToMan(text: string | undefined): number | null {
  if (!text) return null
  const match = text.match(/([\d,]+(?:\.\d+)?)\s*(억|천만|만|천)?\s*원/)
  if (!match) return null
  const raw = Number.parseFloat(match[1].replace(/,/g, ''))
  if (!Number.isFinite(raw)) return null
  return (raw * UNIT_TO_WON[match[2] ?? '원']) / 10_000
}
