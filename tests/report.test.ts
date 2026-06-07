import { describe, expect, it, vi } from 'vitest'
import { generateReport, sanitizeReport } from '../src/lib/report/llm'
import { REPORT_DISCLAIMER, buildTemplateReport } from '../src/lib/report/template'
import { buildKimMinjiSummary } from './fixtures'

describe('report generation', () => {
  it('builds a deterministic template report with the required disclaimer', () => {
    const report = buildTemplateReport(buildKimMinjiSummary())

    expect(report).toContain('김민지님의 전체 리스크 점수는 36점')
    expect(report).toContain('보장 적합도는 31%')
    expect(report).toContain('전체 9개 항목 중 6개')
    expect(report.endsWith(REPORT_DISCLAIMER)).toBe(true)
  })

  it('uses natural Korean particles for caution and excessive coverage text', () => {
    const summary = buildKimMinjiSummary()
    const report = buildTemplateReport({
      ...summary,
      coverageFit: {
        ...summary.coverageFit,
        items: summary.coverageFit.items.slice(0, 1),
        overall: 75,
        weakCoverages: [],
        cautionCoverages: ['암 진단비'],
        excessiveCoverages: ['수술비'],
      },
      weakCoverages: [],
      cautionCoverages: ['암 진단비'],
      expectedOutOfPocket: 0,
    })

    expect(report).toContain('항목은 암 진단비예요.')
    expect(report).toContain('수술비는 표준보다')
    expect(report).not.toContain('암 진단비이에요')
    expect(report).not.toContain('수술비은')
  })

  it('returns codex text when the sidecar succeeds', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ source: 'codex', text: 'AI 리포트입니다.' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    )

    const report = await generateReport(buildKimMinjiSummary(), {
      sidecarUrl: 'https://riskfit.example.test',
      token: 'demo',
      fetchImpl,
      timeoutMs: 100,
    })

    expect(report).toEqual({ source: 'codex', text: 'AI 리포트입니다.' })
    expect(fetchImpl).toHaveBeenCalledWith(
      'https://riskfit.example.test/api/report',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ Authorization: 'Bearer demo' }),
      }),
    )
  })

  it('falls back to the template when the sidecar is missing or fails', async () => {
    const summary = buildKimMinjiSummary()
    const rejectedFetch = vi.fn().mockRejectedValue(new Error('offline'))
    const badFetch = vi.fn().mockResolvedValue(new Response('{}', { status: 500 }))

    // An empty sidecarUrl falls through to the Vite proxy (/api/report) by
    // design (llm.ts). When no sidecar is reachable behind that proxy we must
    // still degrade to the deterministic template.
    await expect(
      generateReport(summary, {
        sidecarUrl: '',
        fetchImpl: vi.fn().mockRejectedValue(new Error('no sidecar')),
        timeoutMs: 100,
      }),
    ).resolves.toMatchObject({ source: 'template' })
    await expect(
      generateReport(summary, {
        sidecarUrl: 'https://riskfit.example.test',
        fetchImpl: rejectedFetch,
        timeoutMs: 100,
      }),
    ).resolves.toMatchObject({ source: 'template', errorReason: 'Error' })
    await expect(
      generateReport(summary, {
        sidecarUrl: 'https://riskfit.example.test',
        fetchImpl: badFetch,
        timeoutMs: 100,
      }),
    ).resolves.toMatchObject({ source: 'template', errorReason: 'http_500' })
  })

  it('falls back to the template when sanitized codex text is empty', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ source: 'codex', text: '안녕하세요! 함께해요 ㅎㅎ 😊' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    )

    await expect(
      generateReport(buildKimMinjiSummary(), {
        sidecarUrl: 'https://riskfit.example.test',
        fetchImpl,
        timeoutMs: 100,
      }),
    ).resolves.toMatchObject({
      source: 'template',
      errorReason: 'empty_response',
    })
  })

  it('sanitizes greetings, emojis, and kaomoji from LLM output', () => {
    const cleaned = sanitizeReport(
      '안녕하세요! 함께해요 ㅎㅎ 점수는 36점입니다. ㅠㅠ',
    )
    expect(cleaned).not.toMatch(/안녕하세요/)
    expect(cleaned).not.toMatch(/함께해요/)
    expect(cleaned).not.toMatch(/ㅎㅎ|ㅠㅠ/)
    expect(cleaned).toContain('점수는 36점입니다.')
  })

  it('sanitizes self-references, hype adjectives, and de-duplicates an embedded disclaimer', () => {
    const noisy =
      `🚀 스마트한 분석이에요. 점수는 36점이에요.\n\n${REPORT_DISCLAIMER}\n\n${REPORT_DISCLAIMER}`
    const cleaned = sanitizeReport(noisy)
    expect(cleaned).not.toMatch(/🚀/u)
    expect(cleaned).not.toMatch(/스마트한/)
    expect(cleaned).toContain('점수는 36점이에요.')
    // Disclaimer appears exactly once and at the end.
    const occurrences = cleaned.split(REPORT_DISCLAIMER).length - 1
    expect(occurrences).toBe(1)
    expect(cleaned.endsWith(REPORT_DISCLAIMER)).toBe(true)
  })

  it('removes extended AI-flavor patterns (marketing adjectives, personification variants, encouragement, absolute promises)', () => {
    const dirty =
      '효과적인 분석을 안내해 드릴게요. 체계적인 점검이에요. 힘내세요! 반드시 점수가 오를 거예요. 위험 점수는 36점이에요.'
    const cleaned = sanitizeReport(dirty)
    expect(cleaned).not.toContain('효과적인')
    expect(cleaned).not.toContain('체계적인')
    expect(cleaned).not.toContain('안내해 드릴게요')
    expect(cleaned).not.toContain('힘내세요')
    expect(cleaned).not.toContain('반드시')
    expect(cleaned).toContain('위험 점수는 36점이에요.')
  })
})
