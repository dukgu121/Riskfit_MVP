import { describe, expect, it } from 'vitest'
import { createApp, buildPrompt, extractText, readConfig } from '../tools/codex-server'
import { REPORT_DISCLAIMER } from '../src/lib/report/template'
import { buildKimMinjiSummary } from './fixtures'

describe('codex sidecar helpers', () => {
  it('builds a constrained prompt with the required disclaimer', () => {
    const prompt = buildPrompt(buildKimMinjiSummary())

    expect(prompt).toContain('특정 보험상품 추천')
    expect(prompt).toContain(REPORT_DISCLAIMER)
    expect(prompt).toContain('"total":36')
  })

  it('extracts text from JSONL and plain stdout', () => {
    expect(
      extractText(
        [
          '{"type":"start"}',
          '{"type":"message","message":{"content":[{"type":"output_text","text":"첫 후보"}]}}',
          '{"type":"result","result":"최종 후보"}',
        ].join('\n'),
      ),
    ).toBe('최종 후보')
    expect(extractText('plain text output')).toBe('plain text output')
  })

  it('enforces CORS and bearer token before report generation', async () => {
    const app = createApp({
      ...readConfig({
        ALLOWED_ORIGINS: 'https://riskfit.vercel.app',
        SIDECAR_TOKEN: 'secret',
      }),
      forceTemplate: true,
    })
    const server = app.listen(0)
    const address = server.address()
    if (!address || typeof address === 'string') {
      server.close()
      throw new Error('failed to bind test server')
    }

    const baseUrl = `http://127.0.0.1:${address.port}`
    const forbidden = await fetch(`${baseUrl}/api/report`, {
      method: 'POST',
      headers: {
        Origin: 'https://evil.example',
        'Content-Type': 'application/json',
      },
      body: '{}',
    })
    const unauthorized = await fetch(`${baseUrl}/api/report`, {
      method: 'POST',
      headers: {
        Origin: 'https://riskfit.vercel.app',
        'Content-Type': 'application/json',
      },
      body: '{}',
    })
    const forced = await fetch(`${baseUrl}/api/report`, {
      method: 'POST',
      headers: {
        Origin: 'https://riskfit.vercel.app',
        Authorization: 'Bearer secret',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(buildKimMinjiSummary()),
    })

    server.close()

    expect(forbidden.status).toBe(403)
    expect(unauthorized.status).toBe(401)
    expect(forced.status).toBe(503)
    expect(forced.headers.get('Access-Control-Allow-Origin')).toBe(
      'https://riskfit.vercel.app',
    )
  })
})
