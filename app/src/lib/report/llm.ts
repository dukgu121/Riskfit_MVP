import type { GeneratedReport, ReportSummary } from '../../types'
import { codexReportResponseSchema } from './schema'
import { isReportGrounded } from './grounding'
import { REPORT_DISCLAIMER, buildTemplateReport } from './template'

type GenerateReportOptions = {
  sidecarUrl?: string
  token?: string
  timeoutMs?: number
  fetchImpl?: typeof fetch
}

const DEFAULT_TIMEOUT_MS = 30_000

export async function generateReport(
  summary: ReportSummary,
  options: GenerateReportOptions = {},
): Promise<GeneratedReport> {
  const sidecarUrl =
    options.sidecarUrl ?? import.meta.env.VITE_LLM_SIDECAR_URL ?? ''
  const token = options.token ?? import.meta.env.VITE_LLM_SIDECAR_TOKEN
  const fetchImpl = options.fetchImpl ?? fetch

  // Empty string → use Vite proxy at /api/report (forwarded to sidecar).
  // Set VITE_LLM_DISABLED=true to force template fallback.
  if (import.meta.env.VITE_LLM_DISABLED === 'true') {
    return templateFallback(summary, 'disabled')
  }

  const endpoint = sidecarUrl
    ? `${sidecarUrl.replace(/\/$/, '')}/api/report`
    : '/api/report'

  const controller = new AbortController()
  const timeout = globalThis.setTimeout(
    () => controller.abort(),
    options.timeoutMs ?? DEFAULT_TIMEOUT_MS,
  )

  try {
    const response = await fetchImpl(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(summary),
      signal: controller.signal,
    })

    if (!response.ok) {
      return templateFallback(summary, `http_${response.status}`)
    }

    const parsed = codexReportResponseSchema.safeParse(await response.json())
    if (!parsed.success) {
      return templateFallback(summary, 'bad_response')
    }

    const text = sanitizeReport(parsed.data.text)
    if (!text) {
      return templateFallback(summary, 'empty_response')
    }
    // Number-grounding safety net: a hallucinated score/amount → safe template.
    if (!isReportGrounded(text, summary)) {
      return templateFallback(summary, 'ungrounded_number')
    }

    return {
      source: 'codex',
      text,
    }
  } catch (error) {
    const reason = error instanceof Error ? error.name : 'fetch_failed'
    return templateFallback(summary, reason)
  } finally {
    globalThis.clearTimeout(timeout)
  }
}

function templateFallback(
  summary: ReportSummary,
  errorReason: string,
): GeneratedReport {
  return {
    source: 'template',
    text: buildTemplateReport(summary),
    errorReason,
  }
}

/**
 * AI-flavor sanitizer.
 *
 * LLMs love greetings, emojis, sales-speak, and self-references. Even
 * with a strict system prompt, the model occasionally slips. This
 * function strips the worst offenders and is safe to call on either
 * codex output or the deterministic template.
 *
 * It is intentionally conservative: we only delete content that is
 * clearly off-tone (greetings, promises, emojis, kaomoji, self-promo).
 * We do not rewrite tone (e.g. `~할까요?` → `~합니다`) because that
 * risks losing information.
 *
 * Note: the canonical disclaimer is guaranteed by the consumer
 * (`ReportTab.withDisclaimer()` and the codex-server's
 * `normalizeReportText()`). This sanitizer only ensures that if a
 * disclaimer is already present in the text, it's the last line and
 * not duplicated.
 */
const FORBIDDEN_PATTERNS: ReadonlyArray<readonly [RegExp, string]> = [
  // Greetings
  [/안녕하세요[!.,~\s]*/g, ''],
  [/안녕하십니까[!.,~\s]*/g, ''],
  [/반갑습니다[!.,~\s]*/g, ''],
  // Promises / personification
  [/도와드리겠습니다[.!~\s]*/g, ''],
  [/도와드릴게요[.!~\s]*/g, ''],
  [/지켜드릴게요[.!~\s]*/g, ''],
  [/지켜드리겠습니다[.!~\s]*/g, ''],
  [/응원할게요[.!~\s]*/g, ''],
  [/응원합니다[.!~\s]*/g, ''],
  [/함께해요[.!~\s]*/g, ''],
  [/함께 시작해요[.!~\s]*/g, ''],
  [/함께 시작해 봐요[.!~\s]*/g, ''],
  // Personification variants — "안내해 드릴게요" style (P2-4)
  [/안내해 드릴게요[.!~\s]*/g, ''],
  [/안내해드릴게요[.!~\s]*/g, ''],
  [/알려 드릴게요[.!~\s]*/g, ''],
  [/알려드릴게요[.!~\s]*/g, ''],
  [/보여 드릴게요[.!~\s]*/g, ''],
  [/보여드릴게요[.!~\s]*/g, ''],
  [/정리해 드릴게요[.!~\s]*/g, ''],
  [/정리해드릴게요[.!~\s]*/g, ''],
  [/말씀드릴게요[.!~\s]*/g, ''],
  // Encouragement (P2-4)
  [/힘내요[.!~\s]*/g, ''],
  [/힘내세요[.!~\s]*/g, ''],
  [/파이팅[!.,~\s]*/g, ''],
  [/화이팅[!.,~\s]*/g, ''],
  [/잘하고 있어요[.!~\s]*/g, ''],
  [/잘하고 계세요[.!~\s]*/g, ''],
  // Absolute promises (P2-4) — strip the whole sentence so the
  // resulting prose doesn't make a guarantee we can't keep.
  [/반드시[^.!?]*[.!?]/g, ''],
  [/꼭[^.!?]*[.!?]/g, ''],
  [/절대[^.!?]*[.!?]/g, ''],
  // Sales push
  [/단 5분이면[^.!?]*[.!?]/g, ''],
  [/지금 바로[^.!?]*[.!?]/g, ''],
  [/지금 가입하세요[.!~\s]*/g, ''],
  [/무료로[^.!?]*[.!?]/g, ''],
  // Self-reference / hype adjectives
  [/저희 RiskFit은[^.!?]*[.!?]/g, ''],
  [/저희가[^.!?]*[.!?]/g, ''],
  [/AI가 분석한[^.!?]*[.!?]/g, ''],
  [/스마트한 /g, ''],
  [/혁신적인 /g, ''],
  [/탁월한 /g, ''],
  [/완벽한 /g, ''],
  // Marketing adjectives (P2-4)
  [/효과적인\s*/g, ''],
  [/체계적인\s*/g, ''],
  [/강력한\s*/g, ''],
  [/매력적인\s*/g, ''],
  [/확실한\s*/g, ''],
  [/놀라운\s*/g, ''],
  [/획기적인\s*/g, ''],
  // Emoji (broad Unicode ranges) + common pictographs
  [/[\u{1F300}-\u{1FAFF}]/gu, ''],
  [/[\u{2600}-\u{27BF}]/gu, ''],
  [/[\u{1F000}-\u{1F2FF}]/gu, ''],
  // Kaomoji
  [/ㅎㅎ+/g, ''],
  [/ㅠㅠ+/g, ''],
  [/ㅜㅜ+/g, ''],
  [/\^_?\^/g, ''],
  [/:\)/g, ''],
  [/:\(/g, ''],
  [/;\)/g, ''],
  [/<3/g, ''],
]

export function sanitizeReport(text: string): string {
  let result = text.trim()

  for (const [pattern, replacement] of FORBIDDEN_PATTERNS) {
    result = result.replace(pattern, replacement)
  }

  // Collapse runs of whitespace, but keep paragraph breaks (\n\n).
  result = result
    .replace(/[ \t]+/g, ' ')
    .replace(/[ \t]*\n[ \t]*/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/^[\s.,!?~]+/g, '')
    .trim()

  // De-duplicate the disclaimer if the LLM repeated it. We do not
  // append one here — that's the consumer's responsibility.
  if (result.includes(REPORT_DISCLAIMER)) {
    const parts = result.split(REPORT_DISCLAIMER)
    const body = parts.join('').trim()
    result = body
      ? `${body}\n\n${REPORT_DISCLAIMER}`
      : REPORT_DISCLAIMER
  }

  return result
}
