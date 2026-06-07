const port = Number(process.env.PORT ?? process.env.RISKFIT_SIDECAR_PORT ?? 47821)
const host = process.env.HOST ?? process.env.RISKFIT_SIDECAR_HOST ?? '127.0.0.1'
const url = `http://${host}:${port}/health`

try {
  const response = await fetch(url)
  if (!response.ok) {
    console.error(`Sidecar health check failed: HTTP ${response.status}`)
    process.exit(1)
  }

  const body = await response.json()
  console.log(JSON.stringify(body, null, 2))
} catch (error) {
  const message = error instanceof Error ? error.message : 'unknown error'
  console.error(`Sidecar health check failed: ${message}`)
  process.exit(1)
}
