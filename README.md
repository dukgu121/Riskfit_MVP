# RiskFit

> 사용자의 **기본정보 · 건강 · 생활습관 · 가족력 · 보유 보험**을 입력받아
> 보험 리스크를 점수화하고, 영역별 드릴다운 · 개선안 · AI 리포트를 제공하는
> **PC-first 보험 분석 웹앱** (데모).

React + Vite SPA로 만든 프론트엔드와, **AI 코멘트를 생성하는 로컬 CLI 사이드카**로
구성된다. 프론트엔드는 Vercel에 정적 배포되고, AI는 운영자 PC에서 도는 로컬
`codex` CLI를 사이드카가 호출해 처리한다(자세한 내용은 [AI 구현 방식](#ai-구현-방식)).

> ⚠️ **데모 프로젝트입니다.** 일부 수치(Premium 생애주기·예상 의료비 등)는 실제
> 보험요율이 아닌 **데모 추정치**이며, 1024px 미만 화면을 막는 PC 전용 게이트도
> 의도된 데모 결정입니다. 본 결과는 특정 보험상품 추천이 아닙니다.

---

## 핵심 기능 (개략)

입력 위저드 → 분석 → 결과/드릴다운 → 개선 → 리포트 → Premium의 단방향 흐름.

| 단계 | 화면(개략) | 하는 일 |
|---|---|---|
| **온보딩** | `/onboarding/*` | Google 로그인 후 진입, 약관 동의 캡처 |
| **입력 위저드** | `/input/{basic,health,lifestyle,family,insurance}` | 기본·건강·생활습관·가족력·보유보험 입력 (보험은 보장유형별 세부 입력) |
| **분석** | `/analyzing` | 계산 엔진을 **1회** 실행해 분석 결과 + AI 카피를 생성·캐시 |
| **결과/드릴다운** | `/result`, `/result/detail/:area` | 위험점수(RISK)·보장적합도(FIT) 요약과 영역별 상세 |
| **개선** | `/improve/*` | 비어 있는 보장을 표준까지 채웠을 때의 적합도 시뮬레이션 |
| **리포트** | `/report` | AI가 작성한 맞춤 리포트(실패 시 결정론적 템플릿) |
| **Premium** | `/premium/*` | (데모 유료) 생애주기·예상 의료비 리포트 |

- **두 가지 지표(극성 반대)** — `RISK`(위험점수, 높을수록 나쁨)와 `FIT`(보장 적합도,
  높을수록 좋음)를 분리해 다룬다. 보험 가입은 위험점수를 거의 바꾸지 못하므로 개선
  시뮬레이션은 **FIT만** 보여준다.
- **단일 캐시로 수치 drift 차단** — 모든 계산은 `/analyzing`에서 한 번만 수행되어
  `localStorage`에 캐시되고, 이후 모든 화면은 이를 read-only로 읽는다.
- **프로토타입 미리보기** — `/proto/*`는 로그인·위저드 없이 샘플 데이터를 시드해
  실제 화면을 둘러볼 수 있는 ungated 경로(배포 전 제거 대상).

---

## 기술 스택

- **언어/런타임** — TypeScript(ESM), React 19
- **빌드/번들** — Vite 8 (`tsc -b` 타입체크 후 `vite build`)
- **라우팅** — react-router-dom 7 (`createBrowserRouter`, lazy 라우트)
- **스타일** — Tailwind CSS v4 (CSS-first `@theme` 토큰), Pretendard, 토스 스타일
  (브랜드 `#3182F6`), Radix UI 프리미티브, lucide-react, motion
- **폼/검증** — react-hook-form + zod
- **차트** — chart.js + react-chartjs-2
- **인증/저장** — Firebase Auth(Google) + Firestore (미설정 시 localStorage-only로 동작)
- **AI 사이드카** — Node.js + Express (`tools/codex-server.ts`), 로컬 `codex` CLI 호출

---

## AI 구현 방식

RiskFit의 AI는 **외부 LLM API를 직접 부르지 않는다.** 대신 운영자 PC에서 도는
**로컬 CLI(`codex`)를 작은 Express "사이드카"가 감싸서** 앱의 요청을 처리한다.
프론트엔드는 LLM을 전혀 모르고, 사이드카에게 HTTP로 요청만 보낸다.

### 왜 사이드카인가

배포된 정적 프론트엔드(`riskfit.vercel.app`)가 AI를 쓰려면 운영자 PC의 로컬 CLI에
닿아야 한다. 하지만 최신 Chrome의 **Local Network Access(LNA)** 정책이 "공개
HTTPS 페이지 → loopback(127.0.0.1)" 호출을 기본 차단한다. 그래서 로컬 사이드카를
**cloudflared 터널로 공개 HTTPS에 노출**하고, 브라우저는 "공개 HTTPS → 공개 HTTPS"만
보게 만든다.

### 요청 흐름

```
[브라우저 / Vercel 정적 SPA]
        │  POST /api/content  (또는 /api/report)
        │  Authorization: Bearer <token>
        ▼
[cloudflared 터널]  ← 공개 HTTPS, 배포 시에만
        ▼
[로컬 사이드카  tools/codex-server.ts  (Express, :47821)]
        │  • CORS origin allowlist + Bearer 토큰 검증(sha256/timingSafeEqual)
        │  • zod 스키마로 요청 본문 검증
        │  • spawn('codex', ['exec', '--json', prompt])   ← 로컬 CLI를 서브프로세스로 실행
        ▼
[로컬 codex CLI]  → stdout(JSON 스트림)
        │  • extractText()로 최종 텍스트 스크레이프
        ▼
   { source: 'codex', text } 응답  (실패 시 fallback:true → 클라이언트가 템플릿 사용)
```

> 개발 모드에서는 터널 없이 Vite dev 서버(`:38215`)가 `/api`·`/health`를
> `127.0.0.1:47821` 사이드카로 프록시한다.

### 사이드카 (`tools/codex-server.ts`)

- **엔드포인트**
  - `GET /health`, `GET /api/health` — 상태(`tunnelMode`, `tokenConfigured`, `codexCommand` 등)
  - `POST /api/report` — 리포트 본문 1건 생성 → `{ source: 'codex', text }`
  - `POST /api/content` — **결과 전 화면용 AI 카피를 한 번에** 생성(요약/위험개요/영역별
    코멘트/개선 인트로/리포트/Premium). `/analyzing`에서 1회 호출되어 캐시된다.
- **AI 호출** — `spawn(CODEX_COMMAND, ['exec', '--json', prompt])`로 로컬 CLI를
  서브프로세스 실행(기본 명령 `codex`, env로 교체 가능). 타임아웃·출력 바이트 캡 적용,
  `busy` 단일 뮤텍스로 동시 호출은 `429`(그래서 화면별 호출 대신 `/analyzing` 1회 생성).
- **검증/보안** — 요청 본문은 zod(`reportSummarySchema` 등) `.strict()` 검증.
  CORS는 `ALLOWED_ORIGINS` allowlist(+ Chrome LNA 우회용 `Access-Control-Allow-Private-Network`),
  토큰은 `Authorization: Bearer`를 sha256 + `timingSafeEqual`로 상수시간 비교.
- **상태 없음** — 사이드카는 요청-응답만 하고 아무것도 저장하지 않는다.

### 프론트엔드 연동 (`app/src/lib/report/`)

- `resolveSidecarUrl` / `resolveSidecarToken` — 사이드카 위치/토큰을
  **localStorage → `VITE_LLM_*` 빌드타임 env → (PROD) loopback** 순으로 해석.
- `bootstrapSidecarFromQuery()`(앱 시작 시 1회) — 배포판은 `?sidecar=<터널URL>&token=<토큰>`
  쿼리를 localStorage에 저장하고 주소창에서 제거한다. 즉 **링크 하나로 방문자 브라우저를
  현재 터널에 연결**한다(터널 URL이 바뀌어도 리빌드 불필요).

### "AI가 숫자를 지어내지 못하게" — grounding & 폴백

AI는 **톤 입힌 설명자**일 뿐, 수치의 생성자가 아니다.

- **데이터 주입(grounding)** — 이미 계산해 둔 per-factor 위험 기여도(`riskContributions`,
  검증된 `real` 항목만)와 개선 우선순위(`improvementPlan`, `projectedOverallFit`)를
  요약(summary)에 실어 프롬프트로 넘긴다. 덕분에 템플릿이 못 쓰는 **교차 인과 한 문장**
  ("○○ 습관이 위험을 가장 올렸고, 비어 있는 △△ 보장을 채우면 적합도가 가장 크게 오른다")이
  가능해진다.
- **숫자 안전망(`isReportGrounded`)** — 생성된 산문에서 숫자를 추출해 summary의 허용
  수치 화이트리스트와 대조한다. summary에 없는 새 수치가 나오면 환각으로 보고 **결정론적
  템플릿으로 폴백**.
- **항상 렌더된다** — 타임아웃 / `busy`(429) / codex 실패 / ungrounded 등 어떤 실패든
  클라이언트가 결정론적 템플릿(`lib/report/template.ts`)으로 대체하므로 화면이 비지 않는다.
- **면책·금칙어** — 면책 문구(`REPORT_DISCLAIMER`)는 코드가 항상 마지막 줄로 강제하며
  AI 재작성 금지. 인사말·이모지·세일즈 표현·특정 상품/가입 권유는 정규식으로 제거된다.

---

## 리스크 계산 엔진 (`app/src/lib/calc/`)

순수 함수로 구성된 결정론적 엔진. 룰 데이터는 `app/src/data/*.json`.

- **RISK** = 건강(0.35) + 생활습관(0.25) + 직업(0.20) + 재무(0.20) 가중합(0~100, 밴드 낮음/보통/높음).
- **FIT** = 사용자 유형에 필요한 보장들의 적합도(현재/표준) 평균(부족/주의/충분/과도 밴드).
- **per-factor 기여도** — 드릴다운용 항목별 분해. 검증된 `real` 항목의 합 = 영역 점수
  (parity), 추정 항목은 `demoMock`으로 격리해 "추정치"로 표기.
- **개선 시뮬레이션** — 빈 보장을 표준까지 채워 `coverageFit`을 **실제로 재계산**한 값
  (`projectedOverallFit`)으로 FIT 상승폭만 제시.

---

## 데이터 · 인증 · 게이트

- **저장** — `consent · profile · insurances · checklist`는 Firebase가 설정되면
  Firestore(`users/{uid}/…`, owner-only 규칙)로 동기화되고, 미설정이면 localStorage로만
  동작한다. **분석/AI 카피 캐시 · Premium 플래그 · 온보딩 플래그는 로컬 전용**(미동기).
- **인증** — Firebase Auth Google 로그인. 자격증명 미설정 시 게이트를 끄고 localStorage 모드로 동작.
- **게이트** — `DesktopOnlyGate`(PC 전용) → `AuthGate`(로그인) → `ConsentGate`(동의)
  → `PremiumGate`(데모 페이월) 순으로 라우트를 보호.

---

## 로컬 실행

```bash
npm install

# Vite dev 서버 + AI 사이드카 동시 기동 (권장)
npm run dev:all
#  - 앱:     http://localhost:38215
#  - 사이드카: http://127.0.0.1:47821  (/api/* 는 Vite가 프록시)

# 개별 실행
npm run dev      # Vite 만
npm run codex    # AI 사이드카 만 (로컬에 `codex` CLI 필요)
```

- **사이드카에는 로컬 `codex` CLI가 PATH에 있어야** AI 생성이 동작한다(없으면 템플릿 폴백).
- 로컬 dev에서는 토큰이 필요 없다.
- Firebase 로그인/동기화를 쓰려면 레포 루트 `.env.local`에 `VITE_FIREBASE_*` 키를 채운다
  (없으면 localStorage 모드).

### 주요 환경변수

| 영역 | 변수 | 비고 |
|---|---|---|
| 프론트(Firebase) | `VITE_FIREBASE_API_KEY`, `…_AUTH_DOMAIN`, `…_PROJECT_ID`, `…_STORAGE_BUCKET`, `…_MESSAGING_SENDER_ID`, `…_APP_ID` | 미설정 시 localStorage 모드 |
| 프론트(AI) | `VITE_LLM_SIDECAR_URL`, `VITE_LLM_SIDECAR_TOKEN`, `VITE_LLM_DISABLED` | 빌드타임(선택) |
| 사이드카 | `RISKFIT_SIDECAR_PORT`(기본 47821), `ALLOWED_ORIGINS`, `SIDECAR_TOKEN`, `RISKFIT_TUNNEL_MODE`, `CODEX_COMMAND`(기본 `codex`), `DEMO_FORCE_TEMPLATE` | 런타임 |

---

## 빌드 / 배포

```bash
npm run build    # tsc -b 후 vite build → dist/
npm run preview  # 빌드 결과 미리보기
```

- **프론트엔드** — Vercel 정적 SPA(`vercel.json`: 모든 경로를 `/index.html`로 rewrite).
- **AI(배포 데모)** — 운영자 PC의 사이드카를 터널 모드로 띄우고 cloudflared로 노출한 뒤,
  `?sidecar=…&token=…` 부트스트랩 링크로 배포판 브라우저를 연결한다.
  (Windows 헬퍼: `tools/start-demo-sidecar.ps1`, `tools/start-demo-tunnel.ps1`)

  ```bash
  # 사이드카(터널 모드: origin + 토큰 강제)
  RISKFIT_TUNNEL_MODE=1 ALLOWED_ORIGINS="https://riskfit.vercel.app" \
    SIDECAR_TOKEN=<토큰> npm run codex
  # 터널
  cloudflared tunnel --url http://127.0.0.1:47821
  # → https://riskfit.vercel.app/?sidecar=<터널URL>&token=<토큰>
  ```

---

## 프로젝트 구조

```
app/
  index.html
  src/
    main.tsx            # 부트스트랩(?sidecar=&token= → localStorage) 후 렌더
    App.tsx             # AuthProvider > RiskfitCloudSync > RouterProvider
    router.tsx          # 전 라우트 + 게이트 합성
    pages/              # 화면 (onboarding/input/result/improve/report/premium/proto)
    components/         # 레이아웃·게이트·UI 프리미티브
    lib/
      calc/             # 리스크 계산 엔진(순수 함수)
      report/           # AI 사이드카 연동 + grounding + 템플릿 폴백
      firebase/         # Auth + Firestore 동기화
      storage.ts        # localStorage 래퍼
    data/               # 점수/표준보장/면책 등 룰 JSON
config/                 # vite / tsconfig / eslint
tools/
  codex-server.ts       # AI 사이드카 (Express + 로컬 codex CLI)
vercel.json
```

---

## 면책

본 프로젝트는 데모/포트폴리오 목적입니다. 산출 결과는 특정 보험상품의 추천이 아니라
현재 보장 상태를 이해하기 위한 참고 정보이며, 일부 수치는 실제 요율이 아닌 추정치입니다.
