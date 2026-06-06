# Demo Tunnel Runbook

This demo setup keeps the RiskFit sidecar on the local PC and exposes it to the
Vercel-hosted frontend through a temporary Cloudflare Tunnel.

## One-Time Setup

`cloudflared` is installed through winget:

```powershell
winget install --exact --id Cloudflare.cloudflared --accept-package-agreements --accept-source-agreements
```

After installing, restart the terminal if `cloudflared --version` is not found
from PATH. The helper script also searches the winget install directory.

## Demo Day Steps

Open two PowerShell terminals in the repo root.

### Terminal 1: sidecar

```powershell
$env:SIDECAR_TOKEN="replace-with-demo-token"
.\tools\start-demo-sidecar.ps1 `
  -VercelOrigin "https://your-riskfit-app.vercel.app"
```

The sidecar listens on `http://127.0.0.1:47821`.

### Terminal 2: Cloudflare Tunnel

```powershell
.\tools\start-demo-tunnel.ps1
```

Copy the generated `https://*.trycloudflare.com` URL.

## Vercel Environment Variables

Set these on the Vercel project and redeploy:

```env
VITE_LLM_SIDECAR_URL=https://generated-trycloudflare-url
VITE_LLM_SIDECAR_TOKEN=replace-with-demo-token
```

The token must match `SIDECAR_TOKEN` from Terminal 1.

## Verification

After redeploying Vercel, open the app from the presentation PC and generate a
report. The expected path is:

```txt
presentation PC -> Vercel frontend -> trycloudflare URL -> local sidecar
```

If the report falls back to the template, check:

- the sidecar terminal is still running
- the tunnel terminal is still running
- Vercel was redeployed after changing `VITE_LLM_SIDECAR_URL`
- `ALLOWED_ORIGINS` matches the Vercel production domain exactly
- `VITE_LLM_SIDECAR_TOKEN` matches `SIDECAR_TOKEN`
