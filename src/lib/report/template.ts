import disclaimers from '../../data/disclaimers.json'
import type { ReportSummary } from '../../types'

export const REPORT_DISCLAIMER =
  disclaimers.find((item) => item.id === 'report_footer')?.text ??
  '본 결과는 특정 보험상품 추천이 아니라 현재 보장 상태를 이해하기 위한 참고 정보입니다.'

/**
 * Toss-tone fallback report. Plain statements, numbers as digits,
 * no personification, no greetings, no sales push. Short paragraphs
 * separated by a blank line — `ReportTab` splits on `\n\n`.
 *
 * Structure (per tone-guide spec):
 *   1. Risk score one-liner ("전체 리스크 점수는 N점")
 *   2. Strongest 1-2 risk-factor signals
 *   3. Coverage fit summary (with explicit "N개 중 M개" ratio when applicable)
 *   4. (optional) Expected out-of-pocket
 *   5. Mandatory disclaimer (verbatim last line)
 *
 * Wording polish notes (Critic U, P2-3):
 *   - "낮음 수준이에요" → "낮은 편이에요"  (more natural Korean)
 *   - "주의 수준이에요"  → "주의 단계예요"
 *   - "충분 수준"        → "충분한 편"
 *   - "부족 수준"        → "부족한 편"
 *   - "보통 수준"        → "보통이에요"
 *   - "입원할 경우"      → "입원하면"      (less formal)
 *   - Equal top factors are joined with "과/와" instead of repeated.
 */
export function buildTemplateReport(summary: ReportSummary): string {
  const { riskScore, coverageFit, expectedOutOfPocketText, expectedOutOfPocket } =
    summary
  const name = summary.profileSummary.name?.trim()

  const paragraphs: string[] = []

  // 1. Risk score — plain statement, digit number.
  const subject = name ? `${name}님의 ` : ''
  paragraphs.push(
    `${subject}전체 리스크 점수는 ${riskScore.total}점으로 ${naturalRiskLabel(riskScore.bandLabel)}이에요.`,
  )

  // 2. Top 1-2 risk-factor signals. When the top two values tie,
  //    join them with "과/와" so we don't repeat the same number twice.
  const factors = [
    { label: '건강 신호', value: riskScore.health },
    { label: '생활 습관', value: riskScore.lifestyle },
    { label: '직업 환경', value: riskScore.job },
    { label: '재정 안전', value: riskScore.finance },
  ].sort((a, b) => b.value - a.value)
  const top = factors[0]
  const second = factors[1]
  if (top.value > 0 && second && second.value === top.value) {
    paragraphs.push(
      `세부 영역 중 ${top.label}${joinParticle(top.label)} ${second.label}이 ${top.value}점으로 가장 높아요.`,
    )
  } else if (top.value > 0 && second && second.value > 0) {
    paragraphs.push(
      `세부 영역 중 ${top.label}이 ${top.value}점, ${second.label}이 ${second.value}점으로 가장 높아요.`,
    )
  } else if (top.value > 0) {
    paragraphs.push(`세부 영역 중 ${top.label}이 ${top.value}점으로 가장 높아요.`)
  }

  // 3. Coverage fit — keep "보장 적합도는 N%" prefix verbatim (used in tests).
  //    Surface explicit "전체 N개 항목 중 M개" ratio when a weakness exists,
  //    so the user sees the denominator rather than only a percentage.
  const weak = coverageFit.weakCoverages
  const caution = coverageFit.cautionCoverages
  const excessive = coverageFit.excessiveCoverages
  const totalItems = coverageFit.items.length
  const fitHead = `보장 적합도는 ${coverageFit.overall}%예요.`
  if (weak.length > 0) {
    paragraphs.push(
      `${fitHead} 전체 ${totalItems}개 항목 중 ${weak.length}개(${weak.join(', ')})가 표준보다 부족해요.`,
    )
  } else if (caution.length > 0) {
    paragraphs.push(
      `${fitHead} 표준과 가깝지만 한 번 점검이 필요한 항목은 ${caution.join(', ')}이에요.`,
    )
  } else {
    paragraphs.push(`${fitHead} ${totalItems}개 항목이 대체로 표준 수준이에요.`)
  }

  // 3b. Over-insured signal — surfaced independently of the gap above, since a
  //     user can be both under- and over-insured on different coverages.
  if (excessive.length > 0) {
    paragraphs.push(
      `${excessive.join(', ')}은 표준보다 많은 편이라, 보장이 겹치는지 한 번 살펴봐도 좋아요.`,
    )
  }

  // 4. Expected out-of-pocket. `expectedOutOfPocketText` already starts
  //    with "약 " — do not double-prefix.
  if (expectedOutOfPocket > 0) {
    paragraphs.push(
      `질병으로 7일 입원하면 자기부담액은 ${expectedOutOfPocketText} 정도예요.`,
    )
  }

  // 5. Mandatory disclaimer (verbatim).
  paragraphs.push(REPORT_DISCLAIMER)

  return paragraphs.join('\n\n')
}

/**
 * Map raw band labels ("낮음", "보통", "높음", "주의", "충분", "부족") to
 * a more natural ending. The raw labels are used inside the band data;
 * here we add `~한 편 / ~ 단계` so the prose doesn't read like a status code.
 */
function naturalRiskLabel(bandLabel: string): string {
  const map: Record<string, string> = {
    낮음: '낮은 편',
    보통: '보통',
    높음: '높은 편',
    주의: '주의 단계',
    충분: '충분한 편',
    부족: '부족한 편',
  }
  return map[bandLabel] ?? `${bandLabel} 수준`
}

/**
 * Pick the right Korean subject particle ("과" vs. "와") for the last
 * character of a label. Used when joining two equal top risk factors.
 */
function joinParticle(label: string): string {
  const lastChar = label.slice(-1)
  const code = lastChar.charCodeAt(0)
  // Hangul syllable block: 0xAC00 ~ 0xD7A3.
  if (code < 0xac00 || code > 0xd7a3) return '와'
  const jongseong = (code - 0xac00) % 28
  return jongseong === 0 ? '와' : '과'
}
