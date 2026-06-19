import { spawn } from 'node:child_process'
import { createHash, timingSafeEqual } from 'node:crypto'
import { pathToFileURL } from 'node:url'
import express, {
  type NextFunction,
  type Request,
  type Response,
} from 'express'
import { z } from 'zod'
import { reportSummarySchema, type ReportSummarySchema } from '../app/src/lib/report/schema.ts'
import { REPORT_DISCLAIMER } from '../app/src/lib/report/template.ts'

/**
 * `POST /api/content` body: the same `reportSummarySchema`-validated summary plus
 * an optional per-area context map (영역 점수 + 최다 real 기여 라벨) for the 영역별
 * 코멘트 fields. Kept nested under `summary`/`areaScores` so `reportSummarySchema`
 * (.strict) is reused unchanged.
 */
const contentAreaInputSchema = z
  .object({
    score: z.number().min(0).max(100),
    topFactorLabel: z.string().max(60).optional(),
  })
  .strict()

const contentRequestSchema = z
  .object({
    summary: reportSummarySchema,
    areaScores: z
      .object({
        lifestyle: contentAreaInputSchema.optional(),
        health: contentAreaInputSchema.optional(),
        family: contentAreaInputSchema.optional(),
        job: contentAreaInputSchema.optional(),
        financial: contentAreaInputSchema.optional(),
      })
      .partial()
      .optional(),
  })
  .strict()

const DEFAULT_ALLOWED_ORIGINS =
  'http://localhost:38215,http://127.0.0.1:38215'
const DEFAULT_PORT = 47821
const DEFAULT_CODEX_TIMEOUT_MS = 30_000
const DEFAULT_MAX_OUTPUT_BYTES = 256_000
const MAX_REPORT_TEXT_CHARS = 3000

type SidecarConfig = {
  port: number
  host: string
  allowedOrigins: string[]
  token?: string
  tokenHash?: string
  tunnelMode: boolean
  codexCommand: string
  codexTimeoutMs: number
  maxOutputBytes: number
  forceTemplate: boolean
}

type CodexRunOptions = Pick<
  SidecarConfig,
  'codexCommand' | 'codexTimeoutMs' | 'maxOutputBytes'
> & {
  cwd?: string
}

type CodexRunResult = {
  text: string
}

export function readConfig(env: NodeJS.ProcessEnv = process.env): SidecarConfig {
  const explicitAllowedOrigins = readEnv(
    env,
    'ALLOWED_ORIGINS',
    'RISKFIT_ALLOWED_ORIGINS',
  )
  const tunnelMode = readEnv(env, 'RISKFIT_TUNNEL_MODE') === '1'
  if (tunnelMode && !explicitAllowedOrigins) {
    throw new Error('Tunnel mode requires ALLOWED_ORIGINS')
  }

  const config: SidecarConfig = {
    port: readIntegerEnv(
      readEnv(env, 'PORT', 'RISKFIT_SIDECAR_PORT'),
      DEFAULT_PORT,
      'PORT/RISKFIT_SIDECAR_PORT',
      1,
      65_535,
    ),
    host: readEnv(env, 'HOST', 'RISKFIT_SIDECAR_HOST') ?? '127.0.0.1',
    allowedOrigins: parseAllowedOrigins(
      explicitAllowedOrigins ?? DEFAULT_ALLOWED_ORIGINS,
    ),
    token: readEnv(env, 'SIDECAR_TOKEN', 'RISKFIT_SIDECAR_TOKEN'),
    tokenHash: normalizeTokenHash(readEnv(env, 'RISKFIT_API_TOKEN_HASH')),
    tunnelMode,
    codexCommand: readEnv(env, 'CODEX_COMMAND') ?? 'codex',
    codexTimeoutMs: readIntegerEnv(
      readEnv(env, 'CODEX_TIMEOUT_MS'),
      DEFAULT_CODEX_TIMEOUT_MS,
      'CODEX_TIMEOUT_MS',
      1,
      Number.MAX_SAFE_INTEGER,
    ),
    maxOutputBytes: readIntegerEnv(
      readEnv(env, 'CODEX_MAX_OUTPUT_BYTES'),
      DEFAULT_MAX_OUTPUT_BYTES,
      'CODEX_MAX_OUTPUT_BYTES',
      1,
      Number.MAX_SAFE_INTEGER,
    ),
    forceTemplate: readEnv(env, 'DEMO_FORCE_TEMPLATE') === '1',
  }

  if (config.tunnelMode && !config.token && !config.tokenHash) {
    throw new Error('Tunnel mode requires SIDECAR_TOKEN or RISKFIT_API_TOKEN_HASH')
  }
  if (config.tunnelMode && config.allowedOrigins.length === 0) {
    throw new Error('Tunnel mode requires ALLOWED_ORIGINS')
  }

  return config
}

export function createApp(config: SidecarConfig = readConfig()) {
  const app = express()
  let busy = false

  app.use(corsMiddleware(config))

  app.get(['/health', '/api/health'], (_req, res) => {
    res.json({
      ok: true,
      service: 'riskfit-codex-sidecar',
      codexCommand: config.codexCommand,
      tokenConfigured: Boolean(config.token || config.tokenHash),
      tunnelMode: config.tunnelMode,
      forceTemplate: config.forceTemplate,
    })
  })

  app.post(
    '/api/report',
    requireAuth(config),
    requireJson,
    express.json({ limit: '32kb', strict: true }),
    async (req, res) => {
      if (config.forceTemplate) {
        return res.status(503).json({ error: 'template_forced', fallback: true })
      }
      if (busy) {
        return res.status(429).json({ error: 'codex_busy', fallback: true })
      }

      const parsed = reportSummarySchema.safeParse(req.body)
      if (!parsed.success) {
        return res.status(400).json({ error: 'bad_request', fallback: true })
      }

      busy = true
      const start = Date.now()
      try {
        const result = await runCodexReport(parsed.data, config)
        logRequest('POST /api/report', 200, Date.now() - start)
        return res.json({ source: 'codex', text: result.text })
      } catch (error) {
        const code = error instanceof CodexTimeoutError ? 504 : 502
        const reason =
          error instanceof CodexTimeoutError ? 'codex_timeout' : 'codex_failed'
        logRequest('POST /api/report', code, Date.now() - start, reason)
        return res.status(code).json({ error: reason, fallback: true })
      } finally {
        busy = false
      }
    },
  )

  app.post(
    '/api/content',
    requireAuth(config),
    requireJson,
    express.json({ limit: '32kb', strict: true }),
    async (req, res) => {
      if (config.forceTemplate) {
        return res.status(503).json({ error: 'template_forced', fallback: true })
      }
      if (busy) {
        return res.status(429).json({ error: 'codex_busy', fallback: true })
      }

      const parsed = contentRequestSchema.safeParse(req.body)
      if (!parsed.success) {
        return res.status(400).json({ error: 'bad_request', fallback: true })
      }

      busy = true
      const start = Date.now()
      try {
        const result = await runCodexContent(
          parsed.data.summary,
          parsed.data.areaScores ?? {},
          config,
        )
        logRequest('POST /api/content', 200, Date.now() - start)
        return res.json(result)
      } catch (error) {
        const code = error instanceof CodexTimeoutError ? 504 : 502
        const reason =
          error instanceof CodexTimeoutError ? 'codex_timeout' : 'codex_failed'
        logRequest('POST /api/content', code, Date.now() - start, reason)
        return res.status(code).json({ error: reason, fallback: true })
      } finally {
        busy = false
      }
    },
  )

  app.use((error: unknown, _req: Request, res: Response, next: NextFunction) => {
    void next
    const status = hasStatus(error) ? error.status : 400
    res.status(status).json({ error: 'bad_request', fallback: true })
  })

  return app
}

/**
 * Spawn `codex exec --json <prompt>` and resolve the scraped final text. Shared
 * by the report and content routes (same busy mutex / timeout / byte cap infra)
 * so the only difference between them is the prompt + post-processing.
 */
function runCodex(prompt: string, options: CodexRunOptions): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(options.codexCommand, ['exec', '--json', prompt], {
      cwd: options.cwd ?? process.cwd(),
      shell: false,
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    })

    let stdout = ''
    let stderr = ''
    let settled = false

    const timeout = setTimeout(() => {
      settled = true
      child.kill()
      reject(new CodexTimeoutError())
    }, options.codexTimeoutMs)

    child.stdout.on('data', (chunk: Buffer) => {
      stdout = appendWithCap(stdout, chunk, options.maxOutputBytes)
    })
    child.stderr.on('data', (chunk: Buffer) => {
      stderr = appendWithCap(stderr, chunk, options.maxOutputBytes)
    })
    child.on('error', (error) => {
      if (settled) return
      settled = true
      clearTimeout(timeout)
      reject(error)
    })
    child.on('close', (code) => {
      if (settled) return
      settled = true
      clearTimeout(timeout)
      if (code !== 0) {
        reject(new Error(`codex exited with code ${code}; stderr=${stderr.length}`))
        return
      }
      resolve(extractText(stdout))
    })
  })
}

export async function runCodexReport(
  summary: ReportSummarySchema,
  options: CodexRunOptions,
): Promise<CodexRunResult> {
  const raw = await runCodex(buildPrompt(summary), options)
  const text = normalizeReportText(raw)
  if (!text) throw new Error('codex returned empty output')
  return { text }
}

/**
 * Generate the full content bundle in one codex call and label-parse it. Returns
 * the parsed `fields` shape (`POST /api/content` response). Field-level grounding
 * + template fallback happen client-side (`lib/report/aiContent.ts`); the sidecar
 * only forces the report disclaimer when a `report` field is present.
 */
export async function runCodexContent(
  summary: ReportSummarySchema,
  areas: Record<string, ContentAreaInput>,
  options: CodexRunOptions,
): Promise<{ fields: ReturnType<typeof parseContentFields> }> {
  const raw = await runCodex(buildContentPrompt(summary, areas), options)
  if (!raw.trim()) throw new Error('codex returned empty output')
  const fields = parseContentFields(raw)
  // Keep the disclaimer guarantee for the long report field (the per-screen
  // blurbs carry no disclaimer); other fields pass through untouched.
  if (fields.report) {
    fields.report = normalizeReportText(fields.report)
  }
  return { fields }
}

export function buildPrompt(summary: ReportSummarySchema): string {
  return [
    'You are writing for a Korean fintech product called RiskFit (보험 보장 점검 MVP).',
    'Target audience: Korean users in their 20s-30s. Write in the tone of Toss (viva republica)',
    '— Korea\'s leading fintech, known for minimal, trustworthy, friendly-but-formal Korean.',
    '',
    'STRICT TONE RULES:',
    '1. Output language: Korean only.',
    '2. Tone: 격식 있되 친근. 평서문 위주. "~예요/이에요" 톤을 기본으로 하되 "~합니다"도 섞어 쓸 수 있다.',
    '3. FORBIDDEN phrases — do not use any of these:',
    '   - 인사: "안녕하세요", "안녕하십니까", "반갑습니다" 등 모든 인사말',
    '   - 의인화·약속: "도와드리겠습니다", "도와드릴게요", "지켜드릴게요", "함께해요", "함께 시작해요", "응원할게요"',
    '   - 의인화 변형: "안내해 드릴게요", "알려 드릴게요", "보여 드릴게요", "정리해 드릴게요", "말씀드릴게요"',
    '   - 격려: "힘내요", "힘내세요", "파이팅", "잘하고 있어요"',
    '   - 확정적 약속: "반드시 ~", "꼭 ~", "절대 ~" — 단정적·확정적 약속 금지',
    '   - 질문체 권유: "~할까요?", "~해볼까요?", "~해보실래요?"',
    '   - 과장 형용사: "스마트한", "혁신적인", "탁월한", "완벽한"',
    '   - 마케팅 형용사: "효과적인", "체계적인", "강력한", "매력적인", "확실한", "놀라운", "획기적인"',
    '   - 세일즈: "단 5분이면", "지금 바로", "무료로", "지금 가입하세요"',
    '   - 자기지칭: "저희 RiskFit은", "AI가 분석한", "저희가"',
    '   - 이모지: 🚀 💡 ✨ 🎉 😊 등 모든 이모지 금지',
    '   - 자모: "ㅎㅎ", "ㅠㅠ", "^^", ":)" 금지',
    '4. STRUCTURE — 3~5개 짧은 문단, 문단 사이 빈 줄로 구분. 각 문단은 입력 JSON의 값 하나를 옮긴다(근거 없는 문장 금지):',
    '   - 1문단: 위험 점수와 등급을 한 문장으로. riskScore.total/bandLabel 사용. 예) "전체 리스크 점수는 36점으로 낮은 편이에요."',
    '   - 2문단(인과): topRiskFactors[0]을 근거로 "무엇이 위험 점수를 가장 많이 올렸는지" 한 문장. label과 detail을 자연스럽게 쓰고 delta는 그대로 인용(산술 금지). 예) "음주 습관(주 3회 이상)이 위험 점수를 가장 많이 올리고 있어요." topRiskFactors가 비어 있으면 이 문단을 생략한다.',
    '   - 3문단(우선순위·처방): improvement.top[0]의 보장을 "가장 비어 있어 먼저 점검하면 좋다"고 한 문장으로 잇되, 2문단의 위험과 자연스럽게 연결한다. 상승 수치는 전체 improvement.projectedOverallFit "만" 인용한다(개별 보장의 "+N%p" 절대 금지). 예) "비어 있는 암 진단비를 채우면 적합도가 72%에서 90%까지 올라요." improvement.top이 비어 있으면(이미 충분) coverageFit.excessiveCoverages로 "겹치는 보장이 있는지 점검" 앵글로, 그것도 없으면 이 문단을 생략한다.',
    '   - 4문단(선택): 예상 자기부담액 한 문장. expectedOutOfPocketText 사용.',
    '   - 시그니처 줄(면책 직전, 가능하면 포함): "지금 딱 하나만 본다면, OOO이에요." 형식으로, OOO은 improvement.top[0].label을 그대로 넣는다. improvement.top이 비어 있으면 이 줄을 생략하거나 "지금은 새로 채우기보다 겹치는 보장을 점검해 보는 게 먼저예요."로 바꾼다.',
    `   - 마지막 줄(필수, 토씨 하나 바꾸지 말 것): "${REPORT_DISCLAIMER}"`,
    '5. WHAT TO AVOID:',
    '   - 불릿, 번호 매기기, 마크다운 헤딩 사용 금지.',
    '   - 입력 JSON에 없는 정량적 주장 금지. 제공된 숫자(riskScore, coverageFit.overall, topRiskFactors.delta, improvement.currentOverallFit/projectedOverallFit/top.currentFit, expectedOutOfPocket)만 인용하고 산술·평균·반올림·새 수치 생성 금지.',
    '   - 개별 보장의 마진 상승폭("이 보장 채우면 +N%p") 금지 — 상승 수치는 전체 projectedOverallFit만 쓴다.',
    '   - 특정 가입 금액·금액 목표 제시 금지(예: "암 4천만 원으로"). 보장은 라벨까지만 말한다.',
    '   - 특정 보험사명·상품명 언급 금지. 가입·해지 권유 금지 — 동사는 "점검/확인"으로만, "가입하세요/채우세요/올리세요" 금지.',
    '   - demoMock·추정값을 사실처럼 단정 금지(입력 JSON에 들어온 값만 사용).',
    '6. NUMBERS: 숫자는 아라비아 숫자로. "36점", "31%", "270만 원" 형태. 입력 JSON 값을 그대로(반올림·재계산 금지).',
    '7. LENGTH: 한국어 200~350자 내외, 각 문단은 계산 근거 1개. 짧을수록 좋다.',
    '',
    'Output ONLY the report text. No preface, no postface, no explanation, no JSON wrapper.',
    '',
    'INPUT (계산 결과 JSON):',
    JSON.stringify(summary),
  ].join('\n')
}

/**
 * Per-area context for the 영역별 코멘트 fields. Mirrors the data the
 * deterministic `areaComment(area, score, topFactorLabel)` template consumes
 * (영역 점수 + 최다 real 기여 라벨) so the AI and the fallback see the same facts.
 * Lives on the request body next to `reportSummarySchema`-validated fields.
 */
type ContentAreaInput = {
  /** 0–100 area risk score (the gauge hero). */
  score: number
  /** Highest engine-REAL contributing factor label (demoMock excluded). */
  topFactorLabel?: string
}

/** The label/order the prompt presents the 5 areas in. */
const CONTENT_AREA_LABELS: Record<string, string> = {
  lifestyle: '생활습관',
  health: '건강',
  family: '가족력',
  job: '직업',
  financial: '재무',
}
const CONTENT_AREA_ORDER = [
  'lifestyle',
  'health',
  'family',
  'job',
  'financial',
] as const

/**
 * Build the ONE prompt that produces every post-/analyzing screen's prose in a
 * single codex call. Reuses `buildPrompt`'s tone/forbidden/면책/숫자-인용-only
 * rules verbatim, but asks for LABEL-DELIMITED fields (robust to codex mixing in
 * prose/markdown — far more forgiving than strict JSON given the heuristic
 * `extractText` scraper). Each field is emitted between
 * `<<<FIELD:name>>>` … `<<<END>>>`; the per-area block uses `<<<AREA:lifestyle>>>`.
 *
 * The `report` field keeps `buildPrompt`'s causal/priority/signature structure
 * and the verbatim disclaimer line; the blurb fields are single Toss-tone
 * sentences echoing the same numbers (no new figures, no 가입 권유).
 */
export function buildContentPrompt(
  summary: ReportSummarySchema,
  areas: Record<string, ContentAreaInput> = {},
): string {
  const areaLines = CONTENT_AREA_ORDER.map((id) => {
    const a = areas[id]
    const label = CONTENT_AREA_LABELS[id]
    const score = a ? a.score : '?'
    const top = a?.topFactorLabel ? ` · 최다 기여 요인: ${a.topFactorLabel}` : ''
    return `   - ${id}(${label}): 위험점수 ${score}점${top}`
  }).join('\n')

  return [
    'You are writing for a Korean fintech product called RiskFit (보험 보장 점검 MVP).',
    'Target audience: Korean users in their 20s-30s. Write in the tone of Toss (viva republica)',
    "— Korea's leading fintech, known for minimal, trustworthy, friendly-but-formal Korean.",
    '',
    'You write the COPY shown across several result screens — all from the SAME analysis JSON',
    '— in ONE response. Numbers are computed by the engine: quote them, never invent or recompute.',
    '',
    'STRICT TONE RULES (모든 필드 공통):',
    '1. Output language: Korean only.',
    '2. Tone: 격식 있되 친근. 평서문 위주. "~예요/이에요" 톤을 기본으로 하되 "~합니다"도 섞어 쓸 수 있다.',
    '3. FORBIDDEN phrases — do not use any of these:',
    '   - 인사: "안녕하세요", "안녕하십니까", "반갑습니다" 등 모든 인사말',
    '   - 의인화·약속: "도와드리겠습니다", "도와드릴게요", "지켜드릴게요", "함께해요", "함께 시작해요", "응원할게요"',
    '   - 의인화 변형: "안내해 드릴게요", "알려 드릴게요", "보여 드릴게요", "정리해 드릴게요", "말씀드릴게요"',
    '   - 격려: "힘내요", "힘내세요", "파이팅", "잘하고 있어요"',
    '   - 확정적 약속: "반드시 ~", "꼭 ~", "절대 ~" — 단정적·확정적 약속 금지',
    '   - 질문체 권유: "~할까요?", "~해볼까요?", "~해보실래요?"',
    '   - 과장 형용사: "스마트한", "혁신적인", "탁월한", "완벽한"',
    '   - 마케팅 형용사: "효과적인", "체계적인", "강력한", "매력적인", "확실한", "놀라운", "획기적인"',
    '   - 세일즈: "단 5분이면", "지금 바로", "무료로", "지금 가입하세요"',
    '   - 자기지칭: "저희 RiskFit은", "AI가 분석한", "저희가"',
    '   - 이모지: 🚀 💡 ✨ 🎉 😊 등 모든 이모지 금지',
    '   - 자모: "ㅎㅎ", "ㅠㅠ", "^^", ":)" 금지',
    '4. NUMBERS: 입력 JSON에 있는 숫자만 아라비아 숫자로 그대로 인용(반올림·평균·산술·새 수치 생성 금지).',
    '   허용 수치 = riskScore(total/health/lifestyle/job/finance), coverageFit.overall + item.fit,',
    '   weak/caution 개수, expectedOutOfPocket(Text), completeness, topRiskFactors.delta,',
    '   improvement.currentOverallFit/projectedOverallFit/top.currentFit, 그리고 아래 영역별 위험점수.',
    '   개별 보장의 "+N%p" 절대 금지(상승 수치는 전체 projectedOverallFit만).',
    '5. 특정 가입 금액·금액 목표·보험사명·상품명 금지. 가입·해지 권유 금지 — 동사는 "점검/확인"만,',
    '   "가입하세요/채우세요/올리세요" 금지. 불릿·번호·마크다운 헤딩 금지.',
    '',
    'OUTPUT FORMAT — 아래 라벨을 "정확히" 그대로 출력하고, 각 라벨 사이에만 해당 문구를 넣는다.',
    '라벨 밖에는 아무 것도 쓰지 않는다(머리말/꼬리말/설명/JSON 래퍼 금지).',
    '',
    '<<<FIELD:resultSummary>>>',
    '보장 적합도 FIT(coverageFit.overall) 기준 1문장 요약. 가장 비어 있는 보장(weakCoverages[0])이',
    '있으면 그걸 언급. 위험점수가 아니라 보장 적합도(%)를 주어로. 1~2문장, 80자 내외.',
    '<<<END>>>',
    '',
    '<<<FIELD:riskOverview>>>',
    '총 위험점수(riskScore.total)와 등급(riskScore.bandLabel)을 한 문장으로 짚고, 가장 위험이 큰 영역을',
    '먼저 보라고 한 문장. topRiskFactors[0]이 있으면 그 요인을 근거로 자연스럽게. 1~2문장, 90자 내외.',
    '<<<END>>>',
    '',
    '<<<FIELD:areas>>>',
    '아래 5개 영역 각각에 대해 그 영역의 위험점수와 최다 기여 요인을 근거로 한 코멘트 1문장씩.',
    '점수가 낮으면 "안정적/낮은 편", 높으면 그 요인을 "점검"하라는 앵글. 각 1문장, 70자 내외.',
    '영역 데이터:',
    areaLines,
    '형식(각 영역을 라벨로 감쌈):',
    '<<<AREA:lifestyle>>> …생활습관 코멘트… <<<END>>>',
    '<<<AREA:health>>> …건강 코멘트… <<<END>>>',
    '<<<AREA:family>>> …가족력 코멘트… <<<END>>>',
    '<<<AREA:job>>> …직업 코멘트… <<<END>>>',
    '<<<AREA:financial>>> …재무 코멘트… <<<END>>>',
    '<<<END>>>',
    '',
    '<<<FIELD:improveIntro>>>',
    '개선 화면 인트로. 비어 있는 보장을 채우면 보장 적합도가 improvement.currentOverallFit에서',
    'improvement.projectedOverallFit까지 오른다는 취지를 1문장(상승 수치는 projectedOverallFit/현재값만).',
    '비어 있는 보장이 없으면(improvement.top 비어 있음) "지금도 잘 갖춰져 있다"는 앵글. 1~2문장, 90자 내외.',
    '<<<END>>>',
    '',
    '<<<FIELD:report>>>',
    '최종 리포트 줄글. 3~5개 짧은 문단, 문단 사이 빈 줄. 각 문단은 입력 JSON 값 하나를 옮긴다:',
    '   - 1문단: riskScore.total/bandLabel 한 문장. 예) "전체 리스크 점수는 36점으로 낮은 편이에요."',
    '   - 2문단(인과): topRiskFactors[0]을 근거로 "무엇이 위험을 가장 올렸는지" 한 문장(label/detail, delta는 그대로 인용). 없으면 생략.',
    '   - 3문단(우선순위): improvement.top[0] 보장을 "가장 비어 있어 먼저 점검하면 좋다"고, 2문단과 자연스럽게 잇기. 상승 수치는 projectedOverallFit만. top이 비면 excessiveCoverages 점검 앵글, 그것도 없으면 생략.',
    '   - 4문단(선택): expectedOutOfPocketText 한 문장.',
    '   - 시그니처(면책 직전, 가능하면): "지금 딱 하나만 본다면, OOO이에요." OOO=improvement.top[0].label 그대로. top이 비면 생략하거나 "지금은 새로 채우기보다 겹치는 보장을 점검해 보는 게 먼저예요."',
    `   - 마지막 줄(필수, 토씨 하나 바꾸지 말 것): "${REPORT_DISCLAIMER}"`,
    '   한국어 200~350자 내외.',
    '<<<END>>>',
    '',
    'INPUT (계산 결과 JSON):',
    JSON.stringify({ ...summary, _areaScores: areas }),
  ].join('\n')
}

/**
 * Parse the label-delimited content output back into named fields. Tolerates
 * codex inserting prose/markdown outside the labels (everything outside a
 * `<<<FIELD:…>>> … <<<END>>>` block is ignored). Per-area blocks are pulled from
 * inside the `areas` field's `<<<AREA:id>>> … <<<END>>>` markers. Returns only
 * the fields that were actually present and non-empty; the caller grounds and
 * template-fills the rest.
 */
export function parseContentFields(text: string): {
  resultSummary?: string
  riskOverview?: string
  improveIntro?: string
  report?: string
  areas?: Record<string, string>
} {
  const out: {
    resultSummary?: string
    riskOverview?: string
    improveIntro?: string
    report?: string
    areas?: Record<string, string>
  } = {}

  const field = (name: string): string | undefined => {
    const re = new RegExp(
      `<<<FIELD:${name}>>>([\\s\\S]*?)<<<END>>>`,
      'i',
    )
    const m = text.match(re)
    const value = m?.[1]?.trim()
    return value ? value : undefined
  }

  out.resultSummary = field('resultSummary')
  out.riskOverview = field('riskOverview')
  out.improveIntro = field('improveIntro')
  out.report = field('report')

  // Per-area blocks live inside the `areas` field (or anywhere in the text — we
  // scan globally to survive codex dropping the outer FIELD wrapper).
  const areas: Record<string, string> = {}
  for (const match of text.matchAll(
    /<<<AREA:([a-z]+)>>>([\s\S]*?)<<<END>>>/gi,
  )) {
    const id = match[1].toLowerCase()
    const value = match[2]?.trim()
    if (value) areas[id] = value
  }
  if (Object.keys(areas).length > 0) out.areas = areas

  return out
}

export function extractText(stdout: string): string {
  const lines = stdout
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
  const candidates: string[] = []

  for (const line of lines) {
    try {
      const parsed = JSON.parse(line) as unknown
      const candidate = findTextCandidate(parsed)
      if (candidate) candidates.push(candidate)
    } catch {
      if (!line.startsWith('{')) candidates.push(line)
    }
  }

  return candidates.at(-1)?.trim() ?? ''
}

export function normalizeReportText(text: string): string {
  const trimmed = text.trim()
  if (!trimmed) return ''
  const body = trimmed.includes(REPORT_DISCLAIMER)
    ? trimmed.split(REPORT_DISCLAIMER).join('').trim()
    : trimmed
  return appendReportDisclaimer(body)
}

function findTextCandidate(value: unknown): string | undefined {
  if (!value || typeof value !== 'object') return undefined
  if (Array.isArray(value)) {
    return value.map(findTextCandidate).find(Boolean)
  }

  const record = value as Record<string, unknown>
  for (const key of ['result', 'output', 'text', 'content']) {
    const candidate = record[key]
    if (typeof candidate === 'string' && candidate.trim()) {
      return candidate
    }
    if (Array.isArray(candidate)) {
      const nested = candidate.map(findTextCandidate).find(Boolean)
      if (nested) return nested
    }
  }

  for (const key of ['message', 'item', 'response']) {
    const nested = findTextCandidate(record[key])
    if (nested) return nested
  }

  return undefined
}

function corsMiddleware(config: SidecarConfig) {
  return (req: Request, res: Response, next: NextFunction) => {
    const origin = req.header('Origin')
    if (origin && !config.allowedOrigins.includes(origin)) {
      return res.status(403).json({ error: 'origin_forbidden', fallback: true })
    }

    if (origin) {
      res.setHeader('Access-Control-Allow-Origin', origin)
      res.setHeader('Vary', 'Origin')
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    res.setHeader('Access-Control-Allow-Private-Network', 'true')

    if (req.method === 'OPTIONS') return res.sendStatus(204)
    return next()
  }
}

function requireJson(req: Request, res: Response, next: NextFunction) {
  if (!req.is('application/json')) {
    return res.status(415).json({ error: 'unsupported_media_type', fallback: true })
  }
  return next()
}

function requireAuth(config: SidecarConfig) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!config.token && !config.tokenHash) return next()

    const auth = req.header('Authorization') ?? ''
    const token = auth.match(/^Bearer\s+(.+)$/i)?.[1]?.trim() ?? ''
    if (!token || !isValidToken(token, config)) {
      return res.status(401).json({ error: 'unauthorized', fallback: true })
    }
    return next()
  }
}

function isValidToken(token: string, config: SidecarConfig): boolean {
  const expectedHash =
    config.tokenHash ?? (config.token ? sha256(config.token) : undefined)
  if (!expectedHash) return true
  const actualHash = sha256(token)
  const expectedBuffer = Buffer.from(expectedHash, 'hex')
  const actualBuffer = Buffer.from(actualHash, 'hex')
  if (expectedBuffer.length !== actualBuffer.length) return false
  return timingSafeEqual(expectedBuffer, actualBuffer)
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

function splitCsv(value: string): string[] {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function appendWithCap(current: string, chunk: Buffer, maxBytes: number): string {
  const next = current + chunk.toString('utf8')
  if (Buffer.byteLength(next, 'utf8') <= maxBytes) return next
  return truncateUtf8(next, maxBytes)
}

function appendReportDisclaimer(body: string): string {
  const separator = body ? '\n\n' : ''
  const bodyLimit = Math.max(
    0,
    MAX_REPORT_TEXT_CHARS - separator.length - REPORT_DISCLAIMER.length,
  )
  const clippedBody =
    body.length > bodyLimit ? body.slice(0, bodyLimit).trim() : body

  return clippedBody
    ? `${clippedBody}${separator}${REPORT_DISCLAIMER}`
    : REPORT_DISCLAIMER
}

function readEnv(
  env: NodeJS.ProcessEnv,
  ...names: string[]
): string | undefined {
  for (const name of names) {
    const value = env[name]?.trim()
    if (value) return value
  }
  return undefined
}

function readIntegerEnv(
  value: string | undefined,
  fallback: number,
  label: string,
  min: number,
  max: number,
): number {
  if (!value) return fallback
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
    throw new Error(`${label} must be an integer between ${min} and ${max}`)
  }
  return parsed
}

function parseAllowedOrigins(value: string): string[] {
  const origins = splitCsv(value).map(normalizeOrigin)
  if (origins.length === 0) {
    throw new Error('ALLOWED_ORIGINS must include at least one origin')
  }
  return [...new Set(origins)]
}

function normalizeOrigin(value: string): string {
  try {
    const url = new URL(value)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      throw new Error('unsupported protocol')
    }
    return url.origin
  } catch {
    throw new Error(`Invalid allowed origin: ${value}`)
  }
}

function normalizeTokenHash(value: string | undefined): string | undefined {
  if (!value) return undefined
  const normalized = value.toLowerCase()
  if (!/^[a-f0-9]{64}$/.test(normalized)) {
    throw new Error('RISKFIT_API_TOKEN_HASH must be a SHA-256 hex digest')
  }
  return normalized
}

function truncateUtf8(value: string, maxBytes: number): string {
  let bytes = 0
  let end = 0
  for (const char of value) {
    const size = Buffer.byteLength(char, 'utf8')
    if (bytes + size > maxBytes) break
    bytes += size
    end += char.length
  }
  return value.slice(0, end)
}

function logRequest(
  route: string,
  status: number,
  durationMs: number,
  errorClass?: string,
) {
  const meta = {
    timestamp: new Date().toISOString(),
    route,
    status,
    durationMs,
    ...(errorClass ? { errorClass } : {}),
  }
  console.info(JSON.stringify(meta))
}

function hasStatus(error: unknown): error is { status: number } {
  return Boolean(
    error &&
      typeof error === 'object' &&
      'status' in error &&
      typeof (error as { status?: unknown }).status === 'number',
  )
}

class CodexTimeoutError extends Error {
  constructor() {
    super('codex timed out')
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const config = readConfig()
  const app = createApp(config)
  app.listen(config.port, config.host, () => {
    console.log(
      `riskfit codex sidecar listening on http://${config.host}:${config.port}`,
    )
  })
}
