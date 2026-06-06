# Firebase MVP Schema

RiskFit MVP uses `localStorage` as the synchronous UI cache and mirrors the same
state to Firestore after Google login and consent.

## Final Contract

```txt
Auth: Google only
Cache: localStorage
Cloud DB: Firestore
Partition key: users/{uid}, where uid is Firebase Auth uid
Sync rule: mirror profile/insurance/checklist only after consent is true
```

The calculation pipeline must keep reading through `readProfile()` and
`readInsurances()`. Firestore stores the current wizard shape, not a separate
normalized calculation schema.

## Paths

```txt
users/{uid}
users/{uid}/profile/current
users/{uid}/insurances/{insuranceId}
users/{uid}/checklists/current
users/{uid}/reportRuns/{reportId}
```

## Documents

### `users/{uid}`

```ts
{
  schemaVersion: 1,
  authType: "google",
  consent: {
    accepted: boolean,
    version: "mvp-privacy-v1",
    acceptedAt?: Timestamp,
    updatedAt?: Timestamp
  },
  createdAt?: Timestamp,
  updatedAt?: Timestamp,
  lastActiveAt?: Timestamp
}
```

### `users/{uid}/profile/current`

```ts
{
  schemaVersion: 1,
  status?: "draft" | "complete",
  basic: {
    name?: string,
    age?: string | number,
    gender?: "female" | "male" | "other" | null,
    jobGroup?: "student" | "office" | "service" | "driving" | "field" | null,
    monthlyIncomeMan?: string | number,
    monthlyExpenseMan?: string | number,
    emergencyFundMan?: string | number,
    hasDependents?: boolean | null,
    housingType?: string
  },
  health: {
    heightCm?: string | number,
    weightKg?: string | number,
    checkupIssue?: boolean | null,
    currentDisease?: boolean | null,
    hospitalVisits?: "visits_1_2" | "visits_3_5" | "visits_6_plus" | null,
    smoking?: "no" | "yes" | null,
    drinking?: "rare" | "weekly_1_2" | "weekly_3_plus" | null,
    exercise?: "weekly_3_plus" | "weekly_2" | "weekly_1_or_less" | "rare" | null,
    sleep?: "hours_7_plus" | "hours_6_7" | "under_6" | null,
    stress?: "normal" | "high" | null,
    overtime?: "rare" | "weekly_1_2" | "weekly_3_plus" | null
  },
  familyHistory: string[],
  completedSteps?: string[],
  createdAt?: Timestamp,
  updatedAt?: Timestamp
}
```

### `users/{uid}/insurances/{insuranceId}`

```ts
{
  schemaVersion: 1,
  id: string,
  company?: string,
  productName?: string,
  coverageType: CoverageTypeId,
  coverageAmount?: number | null,
  amountUnit: AmountUnit,
  monthlyPremium?: number,
  joinedAt?: string | null,
  source?: "manual",
  createdAt?: Timestamp,
  updatedAt?: Timestamp
}
```

`coverageAmount: null` is meaningful and must be preserved. `undefined` fields
are stripped before Firestore writes.

### `users/{uid}/checklists/current`

```ts
{
  schemaVersion: 1,
  checkedIds: string[],
  updatedAt?: Timestamp
}
```

The local UI uses `Record<string, boolean>`. Firestore stores `checkedIds` to
avoid dotted-key map update issues.

### `users/{uid}/reportRuns/{reportId}`

```ts
{
  schemaVersion: 1,
  summary: ReportSummary,
  report: {
    source: "codex" | "template",
    text: string,
    errorReason?: string
  },
  createdAt?: Timestamp
}
```

Report history is optional for MVP.

## Sync Flow

1. User signs in with Google.
2. `RiskfitCloudSync` fetches remote user/profile/insurance/checklist docs.
3. Remote data hydrates localStorage before the router renders.
4. If local consent is true and remote data is empty, local data is uploaded.
5. Later `localStorage` writes emit `riskfit:storage-change`.
6. The sync layer debounces and mirrors consented local data to Firestore.
7. Result calculation continues to use local `readProfile()` and
   `readInsurances()`.

## Vercel Environment

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

All six values must be present. Vite embeds these at build time, so Vercel must
be redeployed after env changes.
