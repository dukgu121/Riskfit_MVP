# Collaboration Board

Last updated: 2026-06-06

## Active Lanes

| Lane | Owner | Goal | Files |
| --- | --- | --- | --- |
| firebase-mvp | Codex | Google-auth Firebase MVP schema, rules, runtime repository, local cache sync, and tests | `src/lib/firebase/*`, `firestore.rules`, `docs/FIREBASE_SCHEMA.md`, `tests/firebase-schema.test.ts`, `src/lib/storage.ts`, `src/main.tsx` |
| demo-tunnel | Codex | Temporary Cloudflare Tunnel setup for Vercel-to-local sidecar demos | `tools/start-demo-sidecar.ps1`, `tools/start-demo-tunnel.ps1`, `docs/DEMO_TUNNEL.md`, `README.md` |

## Decisions

- Firebase Auth `uid` is the partition key.
- MVP auth mode is Google sign-in only. Anonymous auth is intentionally not used.
- Keep `localStorage` as the synchronous UI cache so the wizard remains responsive.
- Mirror consented local data to Firestore after Firebase config + Google login + consent are present.
- Hydrate `profile`, `insurances`, and `checklist` from Firestore before rendering the router for a signed-in user.
- Store checklist as `checkedIds: string[]` in Firestore, then convert it back to the existing local `Record<string, boolean>` shape.
- Do not store Firebase Admin SDK keys or service account JSON in this repo.
- Local LLM sidecar stays on the demo PC; Vercel reaches it through a temporary Cloudflare Tunnel URL.

## Open Questions

- Should generated report history be persisted in MVP, or generated on demand only? Current implementation supports writing report runs but the UI still generates on demand.
- Firebase project values still need to be supplied by the user in `.env.local` and Vercel env vars.
- Firestore rules are ready but not deployed yet; this PC must run `npx firebase-tools login` first.

## Done

- Created shared workspace entry files for Claude/Codex compatibility.
- Added Firebase schema contract, conversion helpers, and Firestore rules aligned to Google-only auth.
- Added Firebase runtime init, Google auth provider, login button, repository, and cloud sync hydrator/mirror.
- Updated consent/disclaimer copy so it no longer claims data stays only in the browser after login.
- Added focused Firebase schema compatibility tests.
- Installed and documented temporary Cloudflare Tunnel demo scripts.
- Fixed existing React lint blockers in `InsuranceForm`, `DesktopOnlyGate`, `ReportTab`, `button`, `badge`, and `toast`.
- Verification passed on 2026-06-06: `npm test`, `npm run lint`, `npm run build`.
- Added `firebase.json` for Firestore rules deployment. Deploy attempt failed only because Firebase CLI has no authorized account on this PC.

## Handoff Format

Use `handoffs/YYYY-MM-DD-owner-topic.md` with:

- Goal
- Files changed
- Decisions made
- Tests run
- Remaining risks
