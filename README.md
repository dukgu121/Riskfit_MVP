# RiskFit MVP

This project contains the RiskFit MVP frontend, Firebase client integration, deterministic scoring logic, and an optional local LLM sidecar for demo report generation.

Current demo architecture:

- Vercel hosts the frontend.
- Firebase Auth/Firestore stores consented user data for Google-signed-in users.
- The local demo PC runs the LLM sidecar.
- A temporary Cloudflare Tunnel exposes the sidecar to the Vercel frontend during the demo.

## Commands

```bash
npm run dev        # Vite only
npm run codex      # local Codex sidecar on 127.0.0.1:47821
npm run dev:all    # Vite + sidecar
npm run demo:check # sidecar health check
npm test
npm run lint
npm run build
```

## Firebase

Create `.env.local` locally and set the same `VITE_FIREBASE_*` values in Vercel:

```bash
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

Firestore schema and rules are documented in `docs/FIREBASE_SCHEMA.md`. Security rules live in `firestore.rules`.

Deploy Firestore rules after Firebase CLI login:

```bash
npx firebase-tools login
npx firebase-tools deploy --only firestore:rules --project <firebase-project-id>
```

## Local Sidecar

The sidecar exposes:

- `GET /health`
- `GET /api/health`
- `POST /api/report`

For a Vercel frontend calling a tunnel URL, start the sidecar with strict origin and token settings:

```bash
set SIDECAR_TOKEN=replace-with-demo-secret
set ALLOWED_ORIGINS=https://your-riskfit-app.vercel.app
set RISKFIT_TUNNEL_MODE=1
npm run codex
```

Then expose `http://127.0.0.1:47821` through Cloudflare Tunnel and point the frontend at that HTTPS URL.

The browser-side client reads:

```bash
VITE_LLM_SIDECAR_URL=https://your-tunnel-url
VITE_LLM_SIDECAR_TOKEN=replace-with-demo-secret
```

These browser environment values are suitable for a controlled demo only. They are not production-secret storage.

See `docs/DEMO_TUNNEL.md` for the PowerShell demo scripts.

## Golden Case

The calculation test fixture follows the MVP plan's Kim Minji case:

- total risk score: `36`
- coverage fit: `55%`
- expected out-of-pocket: raw `2,683,333`, display `약 270만 원`

The 20s accident hospitalization standard is set to `30,000/day` to preserve the MVP golden case, with the source note recorded in `src/data/standardCoverages.json`.
