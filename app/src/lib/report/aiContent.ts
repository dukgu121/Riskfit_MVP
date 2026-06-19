/**
 * The single AI-copy layer for every post-/analyzing screen.
 *
 * ARCHITECTURE
 *   - `/analyzing` calls `generateAiContent(input)` ONCE (after
 *     `computeAndCacheAnalysis`) and `writeAiContent(pkg, signature)`. The single
 *     busy-mutexed sidecar (`POST /api/content`) is therefore hit a single time
 *     per analysis — never per screen (per-screen calls would 429 each other).
 *   - Every screen reads its field from the cache READ-ONLY via `readAiContent()`
 *     and NEVER calls the network.
 *
 * GUARANTEES (trust core)
 *   - Numbers are NEVER authored by AI. Each field is grounded with
 *     `isReportGrounded` against the analysis whitelist; any field carrying a
 *     hallucinated score/amount is replaced by its deterministic template,
 *     field-by-field. A total failure (sidecar down / timeout / bad body) yields
 *     an all-template package.
 *   - The package stored in the cache is always COMPLETE: every field is the
 *     final string a screen renders (grounded AI or template). Screens can still
 *     defend with `readAiContent()?.field ?? <template>` since the cache may be
 *     null (generation skipped / stale / cleared).
 *   - `generateAiContent` NEVER throws.
 *
 * The template fallbacks are the EXACT existing functions
 * (`buildSummaryBlurb` / `overviewComment` / `areaComment` /
 * `buildTemplateReport`) plus the Improve intro copy, so AI-off and AI-on render
 * identically except for wording.
 */

import type { AiContentAreaId, AiContentPackage, ReportSummary } from '../../types'
import { aiContentResponseSchema } from './schema'
import { isReportGrounded } from './grounding'
import { buildTemplateReport } from './template'
import {
  areaComment,
  buildSummaryBlurb,
  overviewComment,
  type SummaryBlurbInput,
} from './areaComments'
import { STORAGE_KEYS, read, write } from '../storage'

/* ------------------------------------------------------------------ */
/*  Input contract                                                     */
/* ------------------------------------------------------------------ */

const AREA_IDS: readonly AiContentAreaId[] = [
  'lifestyle',
  'health',
  'family',
  'job',
  'financial',
] as const

/** Per-area facts the 영역별 코멘트 needs (mirrors `areaComment` inputs). */
export interface AiContentAreaInput {
  /** 0–100 area risk score (gauge hero). */
  score: number
  /** Highest engine-REAL contributing factor label (demoMock excluded). */
  topFactorLabel?: string
}

/**
 * Everything `generateAiContent` needs to (a) prompt the model with rich,
 * per-screen context and (b) compute the matching deterministic fallback for
 * each field. `summary` doubles as the grounding whitelist AND the cache
 * signature source, so it must be the same `ReportSummary` the report screen
 * builds (analysis-derived).
 */
export interface AiContentInput {
  /** Analysis-derived summary — grounding whitelist + signature source. */
  summary: ReportSummary
  /** 요약 줄 fallback input (`buildSummaryBlurb`). */
  resultSummary: SummaryBlurbInput
  /** 위험 개요 fallback input (`overviewComment`). */
  riskOverview: { totalRisk: number; worstAreaLabel?: string }
  /** 영역별 fallback input (`areaComment`). */
  areas: Record<AiContentAreaId, AiContentAreaInput>
  /** 개선 인트로 fallback input (gain in %p; `allDone` when nothing to fill). */
  improveIntro: { gain: number; allDone: boolean }
}

/* ------------------------------------------------------------------ */
/*  Deterministic template fallbacks (one per field)                  */
/* ------------------------------------------------------------------ */

/** Improve intro — mirrors the existing copy in `pages/improve/Improve.tsx`. */
export function improveIntroTemplate(input: {
  gain: number
  allDone: boolean
}): string {
  if (input.allDone) {
    return '비어 있는 보장이 없어요. 현재 보장을 그대로 유지해도 좋아요.'
  }
  return `비어 있는 보장을 채우면 보장 적합도가 ${input.gain}%p 올라가요.`
}

/** Build the complete all-template package from the input (the safe baseline). */
export function buildTemplatePackage(input: AiContentInput): AiContentPackage {
  const areas = {} as Record<AiContentAreaId, string>
  for (const id of AREA_IDS) {
    const a = input.areas[id]
    areas[id] = areaComment(id, a.score, a.topFactorLabel)
  }
  return {
    resultSummary: buildSummaryBlurb(input.resultSummary),
    riskOverview: overviewComment(
      input.riskOverview.totalRisk,
      input.riskOverview.worstAreaLabel,
    ),
    areas,
    improveIntro: improveIntroTemplate(input.improveIntro),
    report: buildTemplateReport(input.summary),
  }
}

/* ------------------------------------------------------------------ */
/*  Generation (POST /api/content → ground → fallback)                */
/* ------------------------------------------------------------------ */

type GenerateOptions = {
  sidecarUrl?: string
  token?: string
  timeoutMs?: number
  fetchImpl?: typeof fetch
}

const DEFAULT_TIMEOUT_MS = 45_000

/**
 * Generate the AI copy bundle for all screens. Always resolves to a COMPLETE
 * package (grounded AI per field, template otherwise). Never throws — any error
 * collapses to the all-template package.
 */
export async function generateAiContent(
  input: AiContentInput,
  options: GenerateOptions = {},
): Promise<AiContentPackage> {
  const template = buildTemplatePackage(input)

  // Forced-off → straight template (matches `generateReport`'s VITE_LLM_DISABLED).
  if (import.meta.env.VITE_LLM_DISABLED === 'true') return template

  const sidecarUrl =
    options.sidecarUrl ?? import.meta.env.VITE_LLM_SIDECAR_URL ?? ''
  const token = options.token ?? import.meta.env.VITE_LLM_SIDECAR_TOKEN
  const fetchImpl = options.fetchImpl ?? fetch
  const endpoint = sidecarUrl
    ? `${sidecarUrl.replace(/\/$/, '')}/api/content`
    : '/api/content'

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
      body: JSON.stringify({
        summary: input.summary,
        areaScores: input.areas,
      }),
      signal: controller.signal,
    })

    if (!response.ok) return template

    const parsed = aiContentResponseSchema.safeParse(await response.json())
    if (!parsed.success) return template

    return mergeGroundedFields(parsed.data.fields, input, template)
  } catch {
    return template
  } finally {
    globalThis.clearTimeout(timeout)
  }
}

/**
 * For each field: keep the AI string ONLY when it is non-empty AND grounded
 * against the summary whitelist; otherwise use the template. This is what keeps
 * a hallucinated number from ever reaching a screen.
 */
function mergeGroundedFields(
  fields: {
    resultSummary?: string
    riskOverview?: string
    areas?: Partial<Record<string, string>>
    improveIntro?: string
    report?: string
  },
  input: AiContentInput,
  template: AiContentPackage,
): AiContentPackage {
  const summary = input.summary
  const pick = (ai: string | undefined, fallback: string): string => {
    const text = ai?.trim()
    if (!text) return fallback
    return isReportGrounded(text, summary) ? text : fallback
  }

  const areas = {} as Record<AiContentAreaId, string>
  for (const id of AREA_IDS) {
    areas[id] = pick(fields.areas?.[id], template.areas[id])
  }

  return {
    resultSummary: pick(fields.resultSummary, template.resultSummary),
    riskOverview: pick(fields.riskOverview, template.riskOverview),
    areas,
    improveIntro: pick(fields.improveIntro, template.improveIntro),
    report: pick(fields.report, template.report),
  }
}

/* ------------------------------------------------------------------ */
/*  Cache read / write (signature = JSON.stringify(summary))           */
/* ------------------------------------------------------------------ */

/** Canonical signature for an AI-content cache entry. */
export function aiContentSignature(summary: ReportSummary): string {
  return JSON.stringify(summary)
}

/**
 * Read the cached package, or `null` when missing / malformed / signed for a
 * different analysis. Screens treat `null` as "use my own template fallback".
 *
 * @param signature when provided, the cache is only returned if it matches
 *   (screens that hold the live summary pass `aiContentSignature(summary)` to
 *   guarantee freshness). Omitted → returns whatever signed package exists.
 */
export function readAiContent(signature?: string): AiContentPackage | null {
  const cached = read<unknown>(STORAGE_KEYS.aiContent, null)
  if (!cached || typeof cached !== 'object') return null
  const entry = cached as { signature?: unknown; content?: unknown }
  if (typeof entry.signature !== 'string' || !entry.content) return null
  if (signature !== undefined && entry.signature !== signature) return null
  const content = entry.content as Partial<AiContentPackage>
  // Shape guard: every field must be present (a complete package is always
  // written, so a partial one is corrupt → ignore).
  if (
    typeof content.resultSummary !== 'string' ||
    typeof content.riskOverview !== 'string' ||
    typeof content.improveIntro !== 'string' ||
    typeof content.report !== 'string' ||
    !content.areas ||
    typeof content.areas !== 'object'
  ) {
    return null
  }
  return content as AiContentPackage
}

/** Persist the package under its analysis signature. */
export function writeAiContent(
  content: AiContentPackage,
  signature: string,
): void {
  write(STORAGE_KEYS.aiContent, { signature, content })
}
