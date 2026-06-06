param(
  [int]$Port = 47821
)

$ErrorActionPreference = "Stop"

function Resolve-Cloudflared {
  $cmd = Get-Command cloudflared -ErrorAction SilentlyContinue
  if ($cmd) {
    return $cmd.Source
  }

  $wingetPackageRoot = Join-Path $env:LOCALAPPDATA "Microsoft\WinGet\Packages"
  $installed = Get-ChildItem -Path $wingetPackageRoot -Recurse -Filter cloudflared.exe -ErrorAction SilentlyContinue |
    Select-Object -First 1 -ExpandProperty FullName

  if ($installed) {
    return $installed
  }

  throw "cloudflared was not found. Install it with: winget install --exact --id Cloudflare.cloudflared"
}

$cloudflared = Resolve-Cloudflared
$localUrl = "http://127.0.0.1:$Port"

Write-Host "Using cloudflared: $cloudflared"
Write-Host "Opening temporary tunnel to $localUrl"
Write-Host ""
Write-Host "Copy the generated https://*.trycloudflare.com URL into Vercel:"
Write-Host "  VITE_LLM_SIDECAR_URL=<generated-url>"
Write-Host ""

& $cloudflared tunnel --url $localUrl
