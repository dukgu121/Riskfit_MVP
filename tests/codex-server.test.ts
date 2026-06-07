import type { Server } from 'node:http'
import { describe, expect, it } from 'vitest'
import {
  createApp,
  buildPrompt,
  extractText,
  normalizeReportText,
  readConfig,
} from '../tools/codex-server'
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

  it('validates tunnel config and normalizes allowed origins', () => {
    expect(() =>
      readConfig({
        RISKFIT_TUNNEL_MODE: '1',
        SIDECAR_TOKEN: 'secret',
      }),
    ).toThrow(/ALLOWED_ORIGINS/)
    expect(() =>
      readConfig({
        RISKFIT_TUNNEL_MODE: '1',
        ALLOWED_ORIGINS: 'https://riskfit.vercel.app',
      }),
    ).toThrow(/SIDECAR_TOKEN/)
    expect(() => readConfig({ PORT: 'not-a-port' })).toThrow(/PORT/)
    expect(() =>
      readConfig({ RISKFIT_API_TOKEN_HASH: 'not-a-sha256-hash' }),
    ).toThrow(/RISKFIT_API_TOKEN_HASH/)

    const config = readConfig({
      RISKFIT_TUNNEL_MODE: '1',
      ALLOWED_ORIGINS:
        'https://riskfit.vercel.app/, https://riskfit.vercel.app',
      SIDECAR_TOKEN: 'secret',
    })
    expect(config.allowedOrigins).toEqual(['https://riskfit.vercel.app'])
  })

  it('normalizes report text to one trailing disclaimer within the client limit', () => {
    const duplicated = normalizeReportText(
      `본문입니다.\n\n${REPORT_DISCLAIMER}\n\n${REPORT_DISCLAIMER}`,
    )
    expect(duplicated).toBe(`본문입니다.\n\n${REPORT_DISCLAIMER}`)

    const long = normalizeReportText('가'.repeat(4_000))
    expect(long.length).toBeLessThanOrEqual(3_000)
    expect(long.endsWith(REPORT_DISCLAIMER)).toBe(true)
  })

  it('enforces CORS and bearer token before report generation', async () => {
    const app = createApp({
      ...readConfig({
        ALLOWED_ORIGINS: 'https://riskfit.vercel.app',
        SIDECAR_TOKEN: 'secret',
      }),
      forceTemplate: true,
    })
    const { server, baseUrl } = await listenOnRandomPort(app)

    try {
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
          Authorization: 'bearer secret',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(buildKimMinjiSummary()),
      })

      await Promise.all([forbidden.text(), unauthorized.text(), forced.text()])

      expect(forbidden.status).toBe(403)
      expect(unauthorized.status).toBe(401)
      expect(forced.status).toBe(503)
      expect(forced.headers.get('Access-Control-Allow-Origin')).toBe(
        'https://riskfit.vercel.app',
      )
    } finally {
      await closeServer(server)
    }
  })
})

function listenOnRandomPort(app: ReturnType<typeof createApp>) {
  const server = app.listen(0)

  return new Promise<{ server: Server; baseUrl: string }>((resolve, reject) => {
    server.once('error', reject)
    server.once('listening', () => {
      const address = server.address()
      if (!address || typeof address === 'string') {
        reject(new Error('failed to bind test server'))
        return
      }
      resolve({ server, baseUrl: `http://127.0.0.1:${address.port}` })
    })
  })
}

function closeServer(server: Server) {
  return new Promise<void>((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error)
        return
      }
      resolve()
    })
  })
}
