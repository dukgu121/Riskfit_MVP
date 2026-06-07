import { spawn } from 'node:child_process'
import { createHash, timingSafeEqual } from 'node:crypto'
import { pathToFileURL } from 'node:url'
import express, {
  type NextFunction,
  type Request,
  type Response,
} from 'express'
import { reportSummarySchema, type ReportSummarySchema } from '../app/src/lib/report/schema.ts'
import { REPORT_DISCLAIMER } from '../app/src/lib/report/template.ts'

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

  app.use((error: unknown, _req: Request, res: Response, next: NextFunction) => {
    void next
    const status = hasStatus(error) ? error.status : 400
    res.status(status).json({ error: 'bad_request', fallback: true })
  })

  return app
}

export async function runCodexReport(
  summary: ReportSummarySchema,
  options: CodexRunOptions,
): Promise<CodexRunResult> {
  const prompt = buildPrompt(summary)

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

      const text = normalizeReportText(extractText(stdout))
      if (!text) {
        reject(new Error('codex returned empty output'))
        return
      }
      resolve({ text })
    })
  })
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
    '4. STRUCTURE — 3~5개 짧은 문단, 문단 사이 빈 줄로 구분:',
    '   - 1문단: 위험 점수와 등급을 한 문장으로. 예) "전체 리스크 점수는 36점으로 낮음 수준이에요."',
    '   - 2문단: 위험 요인 중 가장 강한 1~2개 신호. 예) "생활 습관이 40점으로 가장 높아요."',
    '   - 3문단: 보장 적합도 요약. 입력 JSON의 coverageFit.overall, weakCoverages, cautionCoverages만 사용.',
    '   - 4문단(선택): 예상 자기부담액 한 문장.',
    `   - 마지막 줄(필수, 토씨 하나 바꾸지 말 것): "${REPORT_DISCLAIMER}"`,
    '5. WHAT TO AVOID:',
    '   - 불릿, 번호 매기기, 마크다운 헤딩 사용 금지.',
    '   - 입력 데이터에 없는 정량적 주장 금지.',
    '   - 특정 보험사명·상품명 언급 금지.',
    '   - 가입·해지 권유 금지.',
    '6. NUMBERS: 숫자는 아라비아 숫자로. "36점", "31%", "270만 원" 형태.',
    '7. LENGTH: 한국어 200~350자 내외. 간결할수록 좋다.',
    '',
    'Output ONLY the report text. No preface, no postface, no explanation, no JSON wrapper.',
    '',
    'INPUT (계산 결과 JSON):',
    JSON.stringify(summary),
  ].join('\n')
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
