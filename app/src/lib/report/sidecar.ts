/**
 * Resolve the base URL of the AI sidecar (the local codex-server).
 *
 * The sidecar runs on the same machine as the browser — in dev the Vite proxy
 * forwards `/api/*` to it, so a relative path is enough and we return ''.
 * A production build has no proxy, so the browser must call the loopback
 * address directly; the demo is always opened on the machine that hosts the
 * sidecar, so 127.0.0.1 resolves to the right process.
 *
 * `VITE_LLM_SIDECAR_URL` overrides this when present. We treat a blank value as
 * "unset" (|| rather than ??) so a stray empty env var on the host can't silently
 * disable AI — it falls through to the loopback default instead.
 */
const LOOPBACK_SIDECAR = 'http://127.0.0.1:47821'

export function resolveSidecarUrl(override?: string): string {
  const fromEnv = import.meta.env.VITE_LLM_SIDECAR_URL
  const fallback = import.meta.env.PROD ? LOOPBACK_SIDECAR : ''
  return (override || fromEnv || fallback).trim()
}
