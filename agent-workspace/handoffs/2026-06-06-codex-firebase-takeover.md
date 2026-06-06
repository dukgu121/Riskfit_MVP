# Codex Firebase Takeover

## Goal

Take over the blocked Claude lane and finish the Firebase MVP runtime/schema work with five-agent review support.

## Files Changed

- `src/lib/firebase/*`
- `src/lib/storage.ts`
- `src/main.tsx`
- `src/components/auth/LoginButton.tsx`
- `src/components/result/ChecklistTab.tsx`
- `src/components/result/ReportTab.tsx`
- `src/components/layout/DesktopOnlyGate.tsx`
- `src/components/insurance/InsuranceForm.tsx`
- `src/components/ui/*`
- `src/pages/*`
- `firestore.rules`
- `docs/FIREBASE_SCHEMA.md`
- `docs/DEMO_TUNNEL.md`
- `tools/start-demo-sidecar.ps1`
- `tools/start-demo-tunnel.ps1`
- `README.md`
- `firebase.json`
- `agent-workspace/BOARD.md`

## Decisions Made

- Use Google sign-in only for MVP Firebase Auth.
- Keep localStorage as the synchronous UI cache.
- Mirror data to Firestore only after Firebase config, Google login, and consent.
- Hydrate Firestore data before rendering the router for signed-in users.
- Use temporary Cloudflare Tunnel for Vercel-to-local-sidecar demos.

## Tests Run

- `npm test` - passed, 4 files / 23 tests
- `npm run lint` - passed
- `npm run build` - passed, with Vite large chunk warning only
- `npx firebase-tools deploy --only firestore:rules --project <env project>` - passed after Firebase CLI login

## Remaining Risks

- Firebase project env vars still need to be supplied locally and in Vercel.
- Report run persistence exists in the repository layer, but the current UI still generates reports on demand.
- Cloudflare Tunnel URL is temporary and must be copied into Vercel env for each demo session.
