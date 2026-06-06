param(
  [Parameter(Mandatory = $true)]
  [string]$VercelOrigin,

  [string]$Token = $env:SIDECAR_TOKEN,
  [int]$Port = 47821
)

$ErrorActionPreference = "Stop"

if ([string]::IsNullOrWhiteSpace($Token)) {
  Write-Error "SIDECAR_TOKEN is required. Pass -Token or set `$env:SIDECAR_TOKEN first."
}

$env:SIDECAR_TOKEN = $Token
$env:ALLOWED_ORIGINS = $VercelOrigin
$env:RISKFIT_TUNNEL_MODE = "1"
$env:RISKFIT_SIDECAR_PORT = [string]$Port

Write-Host "Starting RiskFit sidecar on http://127.0.0.1:$Port"
Write-Host "Allowed origin: $VercelOrigin"
Write-Host "Tunnel mode: $env:RISKFIT_TUNNEL_MODE"

npm run codex
