/**
 * Resolve where the AI sidecar (the local codex-server) lives, plus its auth
 * token. There are a few deployment shapes; we pick the first that applies:
 *
 *   1. An explicit override from the caller (used by tests).
 *   2. A runtime value in localStorage — set once by opening the app with
 *      `?sidecar=<url>&token=<tok>` (see `bootstrapSidecarFromQuery`). This is
 *      how the DEPLOYED demo reaches the operator's machine: the local sidecar
 *      is exposed over a public HTTPS tunnel (cloudflared) and the rotating
 *      tunnel URL is pasted in at runtime, so no rebuild is needed when it
 *      changes.
 *   3. A build-time `VITE_LLM_SIDECAR_URL` — handy for a stable named tunnel.
 *   4. In a production build with none of the above set, the loopback sidecar on
 *      the same machine. That only works when the page is opened where the
 *      sidecar runs; a remote browser hitting its own 127.0.0.1 is blocked by
 *      the browser's Local Network Access gate, so the tunnel path above is what
 *      a real deployment uses.
 *
 * In dev we deliberately return '' so the request stays relative and the Vite
 * proxy forwards `/api/*` to 127.0.0.1:47821.
 */
const LOOPBACK_SIDECAR = 'http://127.0.0.1:47821'

export const SIDECAR_URL_KEY = 'riskfit.sidecarUrl'
export const SIDECAR_TOKEN_KEY = 'riskfit.sidecarToken'

function fromLocalStorage(key: string): string {
  if (typeof window === 'undefined') return ''
  try {
    return window.localStorage.getItem(key)?.trim() ?? ''
  } catch {
    return ''
  }
}

export function resolveSidecarUrl(override?: string): string {
  const fallback = import.meta.env.PROD ? LOOPBACK_SIDECAR : ''
  return (
    override ||
    fromLocalStorage(SIDECAR_URL_KEY) ||
    import.meta.env.VITE_LLM_SIDECAR_URL ||
    fallback
  ).trim()
}

export function resolveSidecarToken(override?: string): string | undefined {
  const token =
    override ||
    fromLocalStorage(SIDECAR_TOKEN_KEY) ||
    import.meta.env.VITE_LLM_SIDECAR_TOKEN ||
    ''
  return token || undefined
}

/**
 * One-time bootstrap: if the app is opened with `?sidecar=<url>&token=<tok>`,
 * persist those to localStorage and strip them from the address bar. Lets the
 * operator hand out a single link that wires every visitor's browser to the
 * current tunnel. Call once at startup, before anything reads the sidecar.
 */
export function bootstrapSidecarFromQuery(): void {
  if (typeof window === 'undefined') return
  const params = new URLSearchParams(window.location.search)
  const url = params.get('sidecar')
  const token = params.get('token')
  if (!url && !token) return

  try {
    if (url) window.localStorage.setItem(SIDECAR_URL_KEY, url.trim())
    if (token) window.localStorage.setItem(SIDECAR_TOKEN_KEY, token.trim())
  } catch {
    // localStorage blocked (private mode / quota) — leave the query in place so
    // it can still be read this load; nothing else to do.
    return
  }

  params.delete('sidecar')
  params.delete('token')
  const qs = params.toString()
  const next =
    window.location.pathname + (qs ? `?${qs}` : '') + window.location.hash
  window.history.replaceState({}, '', next)
}
