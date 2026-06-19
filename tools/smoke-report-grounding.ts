/**
 * Smoke test for the report number-grounding safety net
 * (`app/src/lib/report/llm.ts:isReportGrounded`).
 *
 * Run: npx tsx tools/smoke-report-grounding.ts
 *
 * Verifies the "느슨하게" policy (REPORT_AI_DESIGN.md §4.4):
 *   - grounded prose passes,
 *   - a hallucinated score / amount is rejected → template fallback,
 *   - natural surface variants of REAL numbers pass (Toss tone preserved),
 *   - incidental small numbers (7일·3회·28세) are ignored,
 *   - a per-coverage margin ("+11%p") is rejected (it is not a real number).
 */
import { isReportGrounded } from '../app/src/lib/report/grounding.ts'
import type { ReportSummary } from '../app/src/types/index.ts'

const summary = {
  profileSummary: {
    name: '김리핏',
    age: 28,
    jobGroup: 'office',
    userType: 'twenties_new_worker',
  },
  riskScore: {
    total: 36,
    health: 20,
    lifestyle: 40,
    job: 10,
    finance: 15,
    band: 'low',
    bandLabel: '낮음',
  },
  coverageFit: {
    overall: 72,
    items: [{ fit: 40 }, { fit: 100 }, { fit: 60 }],
    weakCoverages: ['암 진단비'],
    cautionCoverages: [],
    sufficientCoverages: [],
    excessiveCoverages: [],
  },
  weakCoverages: ['암 진단비'],
  cautionCoverages: [],
  expectedOutOfPocket: 2_700_000,
  expectedOutOfPocketText: '약 270만 원',
  completeness: 80,
  topRiskFactors: [
    { label: '음주', delta: 12, area: 'lifestyle', detail: '주 3회 이상' },
  ],
  improvement: {
    top: [{ label: '암 진단비', currentFit: 40 }],
    currentOverallFit: 72,
    projectedOverallFit: 90,
  },
} as unknown as ReportSummary

type Case = { name: string; text: string; expect: boolean }

const cases: Case[] = [
  {
    name: '근거 있는 리포트(모든 숫자 summary에 존재)',
    text: '음주 습관이 위험 점수를 가장 많이 올리고 있어요. 비어 있는 암 진단비를 채우면 적합도가 72%에서 90%까지 올라요. 질병으로 7일 입원하면 자기부담액은 약 270만 원이에요.',
    expect: true,
  },
  {
    name: '환각 점수(78%는 summary에 없음) → 거부',
    text: '보장 적합도는 78%로 충분한 편이에요.',
    expect: false,
  },
  {
    name: '자연스러운 변주(약 270만 원 가까이) → 통과',
    text: '자기부담액은 약 270만 원 가까이 될 수 있어요.',
    expect: true,
  },
  {
    name: '부수적 작은 숫자(7일·주 3회·28세)는 무시 → 통과',
    text: '28세 사무직이고 운동은 주 3회예요. 7일 입원 기준으로 보면 돼요.',
    expect: true,
  },
  {
    name: '환각 금액(900만 원은 summary에 없음) → 거부',
    text: '자기부담액은 약 900만 원이에요.',
    expect: false,
  },
  {
    name: '개별 보장 마진(+11%p) → %p 무조건 거부',
    text: '암 진단비를 채우면 적합도가 11%p 올라요.',
    expect: false,
  },
  {
    name: '개별 보장 마진(+40%p, 40은 실수치지만 %p라 거부)',
    text: '암 진단비를 채우면 40%p 올라요.',
    expect: false,
  },
  {
    name: 'raw 원 = 실값(2700000원 = 270만) → 통과',
    text: '자기부담액은 2700000원이에요.',
    expect: true,
  },
  {
    name: '환각 raw 원(9999999원 ≈ 1000만) → 거부',
    text: '자기부담액은 9999999원이에요.',
    expect: false,
  },
  {
    name: '환각 억 금액(1억 원) → 거부 (가입금액·규제)',
    text: '암 진단비를 1억 원으로 채우면 좋아요.',
    expect: false,
  },
  {
    name: '소수 % 변주(72.4% → 실값 72) → 통과',
    text: '보장 적합도는 72.4%예요.',
    expect: true,
  },
  {
    name: '환각 소수 %(31.5% → 31/32 없음) → 거부',
    text: '보장 적합도는 31.5%예요.',
    expect: false,
  },
  {
    name: '개수: 실제 항목 수 이하(3개) → 통과',
    text: '전체 3개 항목 중 1개가 비어 있어요.',
    expect: true,
  },
  {
    name: '환각 개수(12개 > 항목 수) → 거부',
    text: '비어 있는 보장이 12개예요.',
    expect: false,
  },
  {
    name: '개월(2개월)은 개수로 오인하지 않음 → 통과',
    text: '최근 2개월 동안의 기준이에요.',
    expect: true,
  },
]

let pass = 0
console.log('='.repeat(60))
console.log('리포트 숫자 그라운딩 안전망 검증 (느슨)')
console.log('='.repeat(60))
for (const c of cases) {
  const got = isReportGrounded(c.text, summary)
  const ok = got === c.expect
  if (ok) pass++
  console.log(`${ok ? '✅' : '❌'} ${c.name}  (기대=${c.expect}, 결과=${got})`)
}
console.log('-'.repeat(60))
console.log(`결과: ${pass}/${cases.length} 통과`)
process.exit(pass === cases.length ? 0 : 1)
