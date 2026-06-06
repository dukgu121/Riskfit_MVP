# Iteration 1 — 토스 디자인 비평 보고서

> 비평자: Critic Agent F (토스 출신 시니어 디자이너 시점)
> 비평 대상: RiskFit Iteration 1 (Landing.tsx 1개 + UI 프리미티브 13개 + Layout 4개)
> 기준서: `docs/TOSS_DESIGN_AUDIT.md` (18-point + 5원칙)
> 작성일: 2026-05-27

---

## 1. 종합 평가 (Executive Summary)

### 점수: **58 / 100** (시장 진입 기준 미달)

- **시장 진입 가능 여부**: **NO** — 현재 상태로 토스 출신 PM이 보면 "이건 토스 클론을 의도했는데 토스가 안 된" 사례라고 코멘트할 것이다. 토큰은 깔렸지만 컴포넌트와 페이지가 토큰을 배반한다.
- 다행: 컬러·타이포·radius 토큰 자체는 **거의 정확**하다 (`src/index.css:13-117`). Pretendard도 깔렸다.
- 불행: 그 토큰을 쓰는 **컴포넌트와 Landing 페이지가 토스 패턴을 무시**한다. 카드 radius 한 단계 위(`rounded-2xl`), 버튼 높이 한 단계 위(`h-14`/`h-16`), 그림자 한 등급 위, **Landing은 max-width 480px가 아니라 1280px의 마케팅 랜딩**으로 자라났다.

### 가장 치명적인 3가지 문제

1. **Landing.tsx가 토스가 아니라 Stripe/Linear의 마케팅 페이지를 표방한다.** 토스 가이드(§9.1)는 "max-width 480px, 모바일 폭 시뮬레이션, h1 32px, CTA 1개, 마케팅 배너 금지"인데, `Landing.tsx:46`은 `max-w-[1280px]`, `Landing.tsx:96`은 `text-6xl`(64px), `Landing.tsx:243`은 페르소나 카드 박스, `Landing.tsx:286-326`은 3-grid 결과 미리보기. **이건 토스 랜딩이 아니라 SaaS 마케팅이다.**
2. **카드 radius·padding·shadow가 일제히 토스 한 등급 위.** 토스 카드는 `rounded-lg`(16px) + `p-6`(24px) + `shadow-card`(거의 안 보임) 이지만, `src/components/ui/card.tsx:14`은 **`rounded-2xl`(32px)** 로 기본값을 박았다. 한 픽셀의 토스 위반이 모든 카드에 전이된다. Dialog도 `rounded-3xl`(48px) (`dialog.tsx:44`). Select Content도 `rounded-2xl` (`select.tsx:83`). **이 한 줄을 고치지 않으면 어떤 화면도 토스가 될 수 없다.**
3. **18-point 체크리스트 #3·#7·#8·#15가 명백히 위반된다.** 버튼 height 56px 미만 변형(`button.tsx:32`의 `sm: h-10`) 존재 → CTA 보조에서 #3 위반 위험. spacing에 `pt-[18px]`·`size-3.5`·`gap-1.5`·`mt-0.5`·`py-2.5` 같은 **4의 배수 아님** 다수 (#7 위반). `bg-success-50`·`text-warn-700`·`bg-danger-50` 같은 **토큰에 정의되지 않은 색**을 Badge가 참조(#8 위반). Tabs 액티브 표시가 **brand-500 언더라인**(#15 위반, 가이드 §8.4는 흑백 대비 강제).

### 정량 채점

| 영역 | 점수 | 비고 |
|---|---|---|
| 디자인 토큰 정의 | 85 | 컬러/타이포/radius/shadow 거의 토스. 시맨틱 색만 약간 표준 다름. |
| 컴포넌트 충실도 | 55 | 카드 radius·shadow, 버튼 height, Badge·Toast 토큰 누락 등 다수. |
| Landing 토스 부합 | 35 | **방향이 잘못됨**. 토스 §9.1과 완전 다른 SaaS 마케팅 페이지. |
| 마이크로카피 톤 | 70 | 헤드라인은 합격, 면책·동의·CTA 보조는 90% 합격, 빈 상태·에러 메시지 누락. |
| 모션·접근성 | 75 | `prefers-reduced-motion` 처리 우수. duration은 320ms+로 살짝 길다. |
| **합산** | **58** | |

---

## 2. 18-Point Anti-Pattern Audit

| # | 검사 항목 | 판정 | 근거 |
|---|---|---|---|
| 1 | 한 화면에 Primary CTA가 2개 이상 | **PASS** | `Landing.tsx:139-149`에 Primary CTA "시작하기" 1개. TopNav에 추가 CTA 없음. |
| 2 | 라벨 폰트(13px) ≥ 입력 폰트(17px+) | **PASS** | `input.tsx:26` 입력 `text-lg`(18px), `label.tsx:17` 라벨 `text-sm`(14px). 비율 적정. (다만 토스 표준은 라벨 13px이고, 14px은 살짝 큼.) |
| 3 | 버튼 height 56px 미만 | **CONDITIONAL FAIL** | `button.tsx:32` `sm: h-10`(40px) 변형은 56px 미만. 가이드 §8.1은 풀 와이드 CTA만 56px 강제하나, 변형 존재는 잠재 위험. 또한 `button.tsx:33` `default: h-14`(56px)은 PASS, `lg: h-16`(64px) PASS. 단, `Landing.tsx:146`이 `size="lg"`에 추가로 `h-16`을 또 박는 이중지정은 코드 스멜. |
| 4 | 버튼이 pill 형태(radius 9999px) — 칩 제외 | **PASS** | `button.tsx:11` `rounded-xl`(16px). pill 없음. 단, Badge는 `rounded-full`(`badge.tsx:11`)인데 이건 칩이므로 §8.4(B) 허용. |
| 5 | 카드 그림자 `rgba(0,0,0,0.1)` 이상 진하다 | **PASS (margin)** | `src/index.css:100-101` `shadow-card: 0 1px 2px rgba(0,0,0,0.04), 0 1px 12px rgba(17,24,28,0.04)`. 토스 기준 통과. 단 `shadow-card-hover`는 `0 4px 12px rgba(0,0,0,0.06)`로 가이드 `elev-2`와 동일 — OK. |
| 6 | 숫자 디스플레이에 그라데이션·컬러 | **PASS** | `StatNumber.tsx:61` 값은 `text-neutral-900` 고정. `Landing.tsx:347` `<span className="text-score text-neutral-900">72</span>` 역시 검정. |
| 7 | 4의 배수가 아닌 spacing | **FAIL (다중 위반)** | 아래 [세부 인용] 참고. |
| 8 | 정의되지 않은 색(보라/분홍 등) | **PARTIAL FAIL** | 보라·분홍은 없음. 그러나 **존재하지 않는 토큰 참조 다수**: `badge.tsx:16-18` `bg-success-50`·`bg-warn-50`·`bg-danger-50`, `button.tsx:28-29` `bg-danger-500`·`bg-danger-600`, `input.tsx:16-17` `border-danger-500`·`border-success-500`, `toast.tsx:44-45` `border-success-200`·`border-danger-200`. **이 토큰은 `index.css`에 없음** — 토큰은 `--color-semantic-success: #00C896` 하나만 존재. Tailwind 빌드시 무시되거나 fallback 처리되어 색이 안 나옴. |
| 9 | 검정(#000)/흰 위에 흰 | **PASS** | `bg-black/40`이 dialog overlay(`dialog.tsx:19`)에서만 사용. 텍스트는 모두 `neutral-900`. |
| 10 | placeholder를 라벨 대신 사용 | **N/A** | Input 컴포넌트는 placeholder 토큰만 정의(`input.tsx:27` `placeholder:text-neutral-400`). 실제 사용 화면(InputBasic)은 placeholder. Landing의 입력은 Checkbox 1개라 N/A. **Iteration 2에서 InputBasic 구현 시 PASS 강제 필요.** |
| 11 | 단위가 placeholder에만 있고 입력 후 사라짐 | **N/A** | InputBasic 미구현. 그러나 `input.tsx`에 **단위 슬롯(우측 고정 텍스트) 자체가 설계되지 않음**. 가이드 §8.2 "단위는 입력칸 오른쪽 고정 텍스트"를 만족시킬 슬롯 부재. **Iteration 2 우선 추가 필요.** |
| 12 | 마이크로카피가 명령형("확인"·"제출"·"취소") | **PASS** | `Landing.tsx:148` "시작하기" PASS (가이드 §7 "분석 시작하기"보다 짧으나 친근). `Landing.tsx:444-447` 면책 톤도 정중. |
| 13 | 한 카드에 정보가 2개 이상의 사실 | **FAIL** | `Landing.tsx:243-278` 페르소나 카드는 **아바타·이름·나이·메타·인용·3-grid 메타데이터** 6개 사실. `Landing.tsx:343-370` PreviewDashboard도 **점수·등급·진행바·breakdown 3행** 4개 사실. 가이드 §8.3 "한 카드 = 한 사실" 위반. |
| 14 | 모션 duration 100ms 미만 또는 400ms 초과 | **PARTIAL FAIL** | `Landing.tsx:85,95,99,106,113,182,210,237,318` 등 `transition={{ duration: 0.5 ~ 0.6 }}` (500~600ms). 가이드 §6은 페이지 전환 300ms, 카드 등장 240ms 상한. **0.5~0.6초는 답답함 유발 영역.** `motion.ts:35` `slower: 0.48`(480ms)도 가이드 상한 초과. |
| 15 | 탭 액티브에 파랑/언더라인 두께 4px+ | **FAIL** | `tabs.tsx:40` `data-[state=active]:after:bg-brand-500` — **파랑 언더라인 사용**. 가이드 §8.4 "탭에 컬러 쓰는 것은 토스 위반, 액티브는 흑백 대비"를 정면 위반. 토스 탭 active는 `--gray-900` 텍스트 + 24px wide 흑색 indicator. |
| 16 | `tabular-nums`가 숫자 디스플레이에 빠짐 | **PASS** | `index.css:124` html에 `font-feature-settings: "tnum" 1`. `input.tsx:31` 입력에도 `tabular-nums`. `StatNumber.tsx:61` 값에 `tabular-nums`. `.text-score` 유틸도 강제. |
| 17 | 콘텐츠 폭 480px 초과 (데스크탑) | **CRITICAL FAIL** | `Landing.tsx:46` `max-w-[1280px]`, `Landing.tsx:83` `max-w-[960px]` (Hero), `Landing.tsx:171,207,296,444` `max-w-[1280px]` (다른 섹션). 가이드 §4 "데스크탑/태블릿: 콘텐츠 max-width 480px (모바일 폭 시뮬레이션)". **이건 1.7~2.7배 폭 초과.** 토스 진입 차단 사유. |
| 18 | 위험·경고 색이 점수 숫자 자체에 적용 | **PASS** | `StatNumber.tsx:61` 값은 `text-neutral-900` 고정. `Landing.tsx:347` 72점도 검정. trend는 hint에만 적용(`StatNumber.tsx:82`). |

**합계: PASS 9 / CONDITIONAL 2 / FAIL 5 / N/A 2 — 0건 위반 기준 미달.**

### #7 세부 인용 (4의 배수 아닌 spacing)

| 파일:줄 | 위반 클래스 | 환산 |
|---|---|---|
| `Landing.tsx:48` | `gap-1.5` | 6px |
| `Landing.tsx:52` | `h-1.5 w-1.5` | 6px × 6px |
| `Landing.tsx:75` | `top-[18%]` | 백분율(허용)이나 픽셀 환산 18%는 비표준 |
| `Landing.tsx:76` | `right-[-120px]` | OK (4 배수) |
| `Landing.tsx:86` | `gap-1.5 px-3.5 py-1` | 6/14/4 — 14px·6px가 비표준 |
| `Landing.tsx:87` | `size-3.5` | 14px |
| `Landing.tsx:96` | `mt-7` | 28px — OK (4 배수) |
| `Landing.tsx:131` | `mt-0.5` | 2px — 4 배수 아님 |
| `Landing.tsx:193` | `mt-1.5` | 6px |
| `Landing.tsx:218` | `mt-3` | 12px — OK |
| `Landing.tsx:332` | `text-[13px]` | 임의값(허용) |
| `Landing.tsx:413` | `mt-0.5` | 2px |
| `tabs.tsx:34` | `py-2.5` | 10px |
| `tabs.tsx:39` | `after:-bottom-px` | 1px hack |
| `card.tsx:31` | `gap-1.5 mb-4` | 6px |
| `select.tsx:88` | `data-[side=bottom]:translate-y-1` | 4px OK, but `-translate-y-1` 패턴 다수 |
| `dialog.tsx:65` | `right-4 top-4 h-8 w-8` | OK |

→ Landing.tsx에서만 `gap-1.5`·`mt-0.5`·`size-3.5`·`mt-1.5`·`px-3.5` **5종 이상의 4 배수 아닌 spacing** 사용. 가이드 §4 정면 위반.

---

## 3. 5대 원칙 별 평가

### 원칙 1: 한 화면, 한 생각 (One Screen, One Job)

**평가: D (Hero는 합격, 페이지 전체는 실패)**

- Hero 섹션 단독으로 보면 "동의하고 시작" 단일 의사결정으로 합격(`Landing.tsx:115-153`).
- 그러나 **랜딩 페이지 전체가 4개 섹션(Hero, Trust, Persona, Preview)** — 사용자는 스크롤하면서 4번 다른 "생각"을 요구받는다. 토스 랜딩(§9.1)은 한 화면 = Hero + CTA 1개로 끝. Trust/Persona/Preview는 별도 진입로(예: 마케팅 사이트)로 분리하거나, **랜딩에서 제거**해야 한다.
- 특히 `Landing.tsx:286-326` Preview 섹션 3-grid는 "결과 미리보기를 보면서 동시에 진단을 시작할지 결정"하는 dual job을 강요. 토스는 결과를 미리 보여주지 않는다 — 보여주는 순간 진단 동기가 약해진다.
- 권고: Iteration 2에서 TrustSection·PersonaSection·PreviewSection을 **별도 라우트(`/about`·`/why`)로 분리**하거나, 전부 제거. Landing은 Hero + CTA로 끝.

### 원칙 2: 여백이 콘텐츠다 (Whitespace as Content)

**평가: C+ (토큰은 통과, 적용은 압축)**

- `Landing.tsx:171` `py-24`(96px)는 §4 기준(48px 페이지 패딩) **2배**로 오히려 과함. 그러나 토스도 영웅 영역엔 64px 허용(§4 `space-16`).
- 가까스로 합격: Hero 내부 `mt-7`·`mt-6`·`mt-12`·`gap-5` 등 16~48px 리듬은 적정.
- **압축 위반**: `Landing.tsx:188` Trust 카드 내부 `p-6` (24px). 토스 §8.3은 24px 표준이라 OK. 그런데 카드 자체 `gap-6`(24px)으로 빽빽함. 4컬럼이면 카드 간 32px 권장.
- **압축 위반**: `Landing.tsx:266` 페르소나 카드의 3-grid metadata 내부 `gap-3`(12px) + `p-4`(16px). 사실 3개를 12px 갭으로 묶으면 한 사실로 인식이 안 됨 — 가이드 §8.3 "한 카드 = 한 사실" + 가이드 §4 "카드 내부 섹션 분리 20px"이 둘 다 위반.
- 카드와 카드 사이 16~32px 갭은 합격(`Landing.tsx:175,312` `gap-6`).
- 종합: 페이지 외곽 여백은 토스보다 헐겁고, 카드 내부 여백은 토스보다 빽빽함. 정확히 거꾸로.

### 원칙 3: 숫자가 주인공 (Numbers Are the Hero)

**평가: B-**

- StatNumber 컴포넌트(`StatNumber.tsx:31-92`) 설계 자체는 토스 패턴에 가장 가깝다. `text-5xl`(48px), `font-bold`, `tabular-nums`, `tracking-tight`, `neutral-900` — 가이드 §3·§8.5와 모두 부합.
- 그러나 **font-weight가 700(Bold)인데 가이드는 800(Extrabold)**: `StatNumber.tsx:61` `font-bold`. 가이드 §3 "Extrabold 800은 큰 숫자(48px 이상)에만 쓴다." 48px 점수는 **반드시 800**.
- `index.css:166-173` `.text-score` 유틸도 `font-weight: 700`. 같은 문제.
- Landing의 `Landing.tsx:347` `<span className="text-score text-neutral-900">72</span>` 옆에 `<span className="pb-2 text-sm font-semibold text-neutral-500">/ 100</span>` — 토스는 "/ 100"이 아니라 "점" 또는 단위만(`StatNumber`는 unit prop). **`/ 100` 표기는 결과지 미감이 아니라 시험지 미감.**
- 권고: `index.css:168` `.text-score`의 `font-weight: 700`을 `800`으로. `StatNumber.tsx:61` `font-bold`를 `font-extrabold`로.

### 원칙 4: 친근하지만 격식 있다 (Casual but Trustworthy)

**평가: B**

- 헤드라인 우수: `Landing.tsx:98-100` "복잡한 보험, / 5분이면 정리돼요." — 가이드 §7 "분 단위로 시간 약속"과 친근체 `~돼요`. 합격.
- 면책 우수: `Landing.tsx:445-447` "본 서비스는 보험상품 추천·중개·자문이 아닌 정보제공 서비스이며, 결과의 정확성·완전성을 보증하지 않습니다." — 그러나 가이드 §7 "이 결과는 참고용이에요. 의료적 진단은 의사 선생님과 상의해 주세요."에 비하면 **약관체로 후퇴**. "참고용이에요"로 갈 것.
- 트러스트 섹션 톤 우수: `Landing.tsx:162-164` "가입 X / 서버 X / 광고 X" + "회원가입 없이 게스트로 바로 시작" — 친구체이면서 단호함. 토스적.
- 동의 카피 우수: `Landing.tsx:132-136` "입력하는 건강·재무 정보는 이 브라우저에만 저장돼요. / 외부로 전송되지 않아요." — 가이드 §7 "시작하기 전에 두 가지만 동의해 주세요." 패턴 부합.
- 페르소나 인용은 모호: `Landing.tsx:261-263` "실손이랑 암보험만 있고 나머지는 잘 몰라요. / 입원하면 얼마 부담할지 모르겠어요." — 자연스러우나 **27세 김민지님 + 사회 3년차 + 예시 페르소나** 메타 표기가 마치 광고지 같은 톤. 토스는 가공 페르소나를 거의 안 쓴다. 자신감 결여 시그널.
- **빠진 카피**: 빈 상태 메시지, 에러 메시지, 분석 중 메시지. 가이드 §9.6 "잠시만요, 분석하고 있어요" 등이 모두 placeholder TBD(`Analyzing.tsx:11`).

### 원칙 5: 마찰을 줄여라 (Reduce Friction Relentlessly)

**평가: C**

- 동의 체크박스 + CTA가 같은 화면에 묶인 패턴(`Landing.tsx:117-153`)은 마찰 감소에 합격.
- 그러나 **체크박스를 클릭해야만 CTA가 활성화되는 구조**(`Landing.tsx:143` `disabled={!consent}`)는 마찰 추가다. 토스는 동의를 별도 화면이 아니라 **CTA 직전에 라디오 한 줄**로 노출하거나, **시작하기 누르면 자동 동의 간주**. 현재는 두 행동을 요구.
- 라우터 가드(`ConsentGate.tsx:25-43`)는 합격: 동의 없이 deeplink로 들어와도 `/`로 리다이렉트. UX 안전망 OK.
- **DesktopOnlyGate**는 토스 위반: 토스는 무조건 모바일 가능. 가이드 §4도 "모바일: 좌우 padding 20px 고정"으로 모바일을 우선. 그런데 `DesktopOnlyGate.tsx:32-80`은 **1024px 미만이면 차단**. 모바일 친화성 0. "PC에서 이용해 주세요"는 사용자 마찰의 극단.
- **단위 슬롯 부재**: `input.tsx`에 우측 고정 단위 슬롯이 없음. 가이드 §8.2 "단위는 입력칸 오른쪽 고정 텍스트"를 구현할 길이 막혀 있다. Iteration 2 InputBasic 제작 시 즉시 부딪힐 문제.

---

## 4. 컴포넌트별 비평

### 4.1 Button (`src/components/ui/button.tsx`)

**점수: 70 / 100**

- 합격: `button.tsx:11` `rounded-xl`(16px) — 가이드 §8.1 radius 12px보다는 한 단계 위지만 토스 신형 디자인은 12~16 둘 다 허용. 통과.
- 합격: `button.tsx:33` `default: h-14`(56px) + `px-6`(24px) — 가이드 §8.1 height 56px 정확.
- 합격: `button.tsx:13` `active:scale-[0.98]` — 가이드 §8.1 pressed `scale(0.98)` 정확.
- 합격: `button.tsx:11` `transition-...duration-150` — 가이드 §8.1 150ms 정확.
- 의문: `button.tsx:33` `lg: h-16`(64px)은 가이드에 없음. 56px이 풀 와이드 표준인데 +8px 더 큰 변형이 왜 필요한가? Landing에서 `h-16`(`Landing.tsx:146`)를 또 강제하는데, 이는 **풀 와이드 CTA를 더 강조하려는 시도**로 보이나 가이드를 벗어남. lg 변형 삭제 또는 56px 통일 권고.
- 위반: `button.tsx:28-29` `bg-danger-500 ... hover:bg-danger-600 active:bg-danger-700` — **`danger-500/600/700` 토큰이 `index.css`에 없음**. `--color-semantic-danger`만 존재. Tailwind는 unknown class를 무시 → destructive 버튼 색이 빨강으로 안 나옴. 빌드 시 워닝 없이 silent fail. **버그 수준의 위반.**
- 의문: `button.tsx:27` `outline` variant 존재 — 가이드 §8.1 "토스에는 outlined 버튼이 거의 없다 — 보더 있는 버튼은 약해 보이기 때문이다." 변형 자체를 두는 건 위반 아니나 사용 시 토스 위반. 삭제 권고.
- 권고: lg 삭제 또는 `h-14`로 통일. destructive를 `bg-semantic-danger`로 교체. outline 삭제 또는 `aria-only` 변형으로 격하.

### 4.2 Input (`src/components/ui/input.tsx`)

**점수: 55 / 100**

- 합격: `input.tsx:26` `h-14`(56px), `rounded-xl`(16px), `text-lg`(18px). 가이드 §8.2 정확.
- 합격: `input.tsx:27` `placeholder:text-neutral-400`. 가이드 §8.2 placeholder gray-600 살짝 다르지만 허용.
- 위반: `input.tsx:14` `focus:border-brand-500` — 가이드 §8.2 "Focus 보더 **2px solid `--blue-500`** (120ms 전환)". 현재 `border`는 기본 1px. 포커스 시 색만 바뀌고 **두께가 안 늘어남**. 토스의 포커스 시그널 가시성 부족.
- 위반: `input.tsx:16-17` `border-danger-500`·`border-success-500`·`focus:border-danger-500` — **존재하지 않는 토큰**.
- **결정적 누락**: 단위 슬롯(suffix text) 부재. 가이드 §8.2 "단위 표시 — 입력칸 오른쪽 고정 텍스트". InputBasic의 키(cm)·체중(kg)·연령(세)를 구현할 슬롯이 없다. Input 컴포넌트가 children/suffix prop을 받지 않음.
- 권고: `state` prop을 `bg-semantic-danger`로 매핑. focus 시 `border-2 border-brand-500 px-[15px]` 패턴(두께 변화 시 padding 보정)으로 토스 포커스 재현. suffix 슬롯 추가:
  ```tsx
  <Input suffix="kg" /> // 우측에 고정 텍스트
  ```

### 4.3 Card (`src/components/ui/card.tsx`)

**점수: 45 / 100 (가장 큰 문제 컴포넌트)**

- **위반 #1**: `card.tsx:14` `rounded-2xl` — Tailwind 토큰상 `rounded-2xl`은 24px(`index.css:94`). 가이드 §8.3 "Radius **16px**". 현재 8px 초과. **이 한 줄이 모든 카드의 미감을 토스에서 벗어나게 한다.**
- **위반 #2**: `card.tsx:14` `shadow-card` 자체는 토스적이나, Landing에서 카드들이 흰색 배경 위 그림자만으로 떠 있어 **카드 경계가 보더 없이 그림자만으로 표현**. 가이드 §8.3 "보더 `1px solid --gray-200` (또는 무 보더)" — 보더+그림자 조합이 토스적인데 현재는 그림자만. Trust 섹션처럼 카드 3개가 흰 배경 위에 흰 카드라면 그림자만으로는 약해 보임.
- 위반 #3: `card.tsx:14` `p-6` 합격(24px). 그러나 가이드 §9.7 대시보드 카드는 32px padding 권고. `Landing.tsx:243` 페르소나 카드는 `p-8`(32px)으로 OK이나 표준화 안 됨.
- 위반 #4: CardHeader/Footer 마진이 자기 멋대로: `card.tsx:31` `mb-4`(16px), `card.tsx:78` `mt-6`(24px). 가이드 §4 "카드 내부 섹션 분리: margin-bottom: 20px" — 16/24 둘 다 어긋남.
- 권고: **`rounded-2xl` → `rounded-lg`**(16px). 기본 `border border-border` 추가. `mb-4` → `mb-5`(20px), `mt-6` → `mt-5`(20px).

### 4.4 Badge (`src/components/ui/badge.tsx`)

**점수: 50 / 100**

- 합격: `badge.tsx:11` `rounded-full` — 가이드 §8.4(B) 칩 패턴 부합.
- 합격: `badge.tsx:23` `sm: h-5 px-2 text-[11px]` — caption 토큰 사용 일관.
- 위반: `badge.tsx:16-18` `bg-success-50 text-success-700`·`bg-warn-50 text-warn-700`·`bg-danger-50 text-danger-700` — **모두 미정의 토큰**. semantic은 `--color-semantic-success`/`warn`/`danger` 단일 색만. 50·700 변형이 없으니 빌드 시 색 빠짐.
- 위반: `badge.tsx:24` `h-6`(24px) default — 가이드 §8.4(B) "Height: 36px". 36px이 토스 칩 표준. 현재 너무 작음.
- 위반: `badge.tsx:24` `px-2.5`(10px) — 4 배수 아님. 가이드 §8.4(B) "Padding `0 14px`" 14px는 4 배수 아니지만 가이드가 명시. 현재 10px은 그것조차 못 미침.
- 권고: variant 색을 `bg-semantic-success/10`·`text-semantic-success` 같이 alpha 변형으로. 또는 `--color-success-bg`·`--color-success-fg` 토큰을 `index.css`에 신설. height 24px → 28px(sm)/36px(default)로 확대.

### 4.5 Tabs (`src/components/ui/tabs.tsx`)

**점수: 30 / 100 (가이드 §8.4 정면 위반)**

- **위반 #1**: `tabs.tsx:40` `data-[state=active]:after:bg-brand-500` — **brand-500(파랑) 언더라인**. 가이드 §8.4 "탭 자체에 컬러(파랑)를 쓰는 것은 토스 위반. 액티브는 **흑백 대비**로 표현한다." → 액티브는 `--gray-900` 텍스트 + `--gray-900` indicator여야 함.
- 위반 #2: `tabs.tsx:39` `after:h-0.5`(2px) — 가이드 §8.4 "**2px / 24px wide**". 두께는 OK, 그러나 폭이 트리거 전체로 깔림(`after:left-0 after:right-0`). 가이드는 **글자 폭(24px)에 맞춘 indicator**. 현재는 텍스트 폭과 무관하게 전 너비 → 토스 미감 아님.
- 위반 #3: `tabs.tsx:15` `h-12`(48px) — 가이드 §8.4(B) chip은 36px, (A) 텍스트 탭은 명시 없으나 가이드 §3 line-height와 padding 고려하면 44~48px 적정. h-12는 OK이지만 다른 위반과 함께 보면 토스 미감 거리감.
- 위반 #4: `tabs.tsx:34` `py-2.5`(10px) — 4 배수 아님.
- 위반 #5: `tabs.tsx:19` `overflow-x-auto scrollbar-none` — 가이드 §9.7 "상단 Sticky 탭바" 4개 탭이 스크롤될 일은 없음. 데스크탑 480px에서 4개 탭은 fit. overflow-x-auto는 과도한 안전망.
- 권고: indicator를 `text-active` 트리거 텍스트 폭에 맞춰 underlining (CSS `:has` 또는 width transition). 색을 `bg-neutral-900`. `py-2.5` → `py-3`(12px).

### 4.6 Progress (`src/components/ui/progress.tsx`)

**점수: 80 / 100**

- 합격: `progress.tsx:21` `h-2` (8px) — 가이드 §9.2 "얇은 2px"보다 굵으나, 결과 화면 진행률 바로는 8px 적정.
- 합격: `progress.tsx:28` `transition-transform duration-300 ease-out` — 가이드 §6 "진행률 바 채워짐 **600ms** ease-out" 보다 빠르나 OK 범위.
- 합격: `progress.tsx:15` value 클램핑 0~100. 견고.
- 의문: `progress.tsx:28` `bg-brand-500` 고정 — 가이드는 등급별 색(success/warn/danger). `indicatorClassName` prop으로 오버라이드 가능하니 OK.
- 권고: 입력 폼 상단 ProgressBar 용 `size="sm"`(h-0.5 = 2px) 변형 추가. 가이드 §9.2 부합.

### 4.7 Checkbox (`src/components/ui/checkbox.tsx`)

**점수: 75 / 100**

- 합격: `checkbox.tsx:14` `h-6 w-6`(24px) — 적정 크기.
- 합격: `checkbox.tsx:14` `rounded-md`(12px) — 가이드 §8.3 카드 radius와 통일.
- 합격: `checkbox.tsx:15` `border-2 border-neutral-300` — 가이드 §9.2 두께 명시 없으나 두께 2px는 토스 신형 패턴.
- 합격: `checkbox.tsx:18` `data-[state=checked]:bg-brand-500` — 정확.
- 위반: `checkbox.tsx:17` `focus-visible:border-brand-500` — focus ring 누락. 단, `index.css:154-158` :focus-visible 글로벌이 `box-shadow: var(--shadow-focus)` 처리. OK.
- 위반: `checkbox.tsx:27` `Check className="h-4 w-4" strokeWidth={3}` — 4 배수 OK. 그러나 가이드 §9.7 체크리스트의 체크 표시 두께 명시 없음. 시각적으로는 OK.

### 4.8 RadioGroup (`src/components/ui/radio-group.tsx`)

**점수: 65 / 100**

- 합격: `radio-group.tsx:25` `h-6 w-6` 원형, `border-2 border-neutral-300`, `data-[state=checked]:border-brand-500`. 패턴 부합.
- **결정적 누락**: 가이드 §9.3 "운동량은 라디오 카드 3장 세로 배치. 카드 선택 시 `--blue-50` 배경 + `--blue-500` 2px 보더." → **라디오 카드** 패턴이 필요한데, 현재 `radio-group.tsx`는 **점 라디오**만 제공. 카드형 라디오 (LabelCard) 컴포넌트가 없음.
- 권고: `RadioGroupCard` 또는 `<RadioGroupItem asChild>` 패턴으로 카드 hit area 전체에 click을 위임할 수 있는 추상화 추가.

### 4.9 Select (`src/components/ui/select.tsx`)

**점수: 60 / 100**

- 합격: `select.tsx:18` `h-14`(56px) — Input과 동일 높이로 폼 일관성.
- 위반: `select.tsx:18` `rounded-xl`(16px) — Input도 `rounded-xl`(`input.tsx:26`)이라 OK이나 가이드 §8.2 "Radius 12px"는 `rounded-md`/`rounded`. 16px은 한 단계 위.
- 위반: `select.tsx:23` `data-[state=open]:border-brand-500` — focus 시 색만 변경, 두께 안 늘어남. Input과 같은 문제.
- 위반: `select.tsx:83` `rounded-2xl`(24px) on SelectContent — 가이드 §5 "Radius xl 20px (모달)". 24px은 토스 모달보다 큼.
- 위반: `select.tsx:88,99` `translate-y-1` (4px OK), 그러나 `select.tsx:88` `data-[side=top]:-translate-y-1`도 4px — OK.
- 의문: `select.tsx:131` `data-[state=checked]:bg-brand-50` — 가이드 §2 `--blue-50` 선택 배경 부합. 합격.

### 4.10 Dialog (`src/components/ui/dialog.tsx`)

**점수: 50 / 100**

- 위반: `dialog.tsx:44` `rounded-3xl`(48px) — Tailwind 표준 `rounded-3xl`은 24px(`index.css:95` `--radius-2xl: 32px` 다른 토큰이지만 Tailwind 3xl은 매핑이 어디 있는지 명시 안 됨). 어쨌든 24~48px 범위인데 가이드 §5 "modal radius xl = 20px". **두 단계 위.**
- 위반: `dialog.tsx:43` `gap-6 rounded-3xl bg-white p-6 shadow-card-hover` — padding 24px OK, 그림자 `shadow-card-hover` 합격. 그러나 가이드 §5 `elev-3: 0 12px 32px rgba(0,0,0,0.08)` 모달 등급이 카드 hover보다 살짝 강함. shadow-modal(`index.css:103`)이 정의되어 있는데 안 씀.
- 위반: `dialog.tsx:65` `right-4 top-4 inline-flex h-8 w-8` — 닫기 버튼 32px. 가이드 §8.1 "icon: h-14 w-14" 기준 미달. 그러나 모달 내 보조 버튼이라 OK 가능.
- 위반: `dialog.tsx:103` Title `text-2xl`(24px) — 가이드 §3 h2(24px) 부합. OK.
- 위반: `dialog.tsx:104` `font-bold` — 가이드는 h2 weight 700 Bold. 매치. OK.
- 권고: `rounded-3xl` → `rounded-xl`(20px) 또는 `rounded-2xl`(24px). `shadow-card-hover` → `shadow-modal`.

### 4.11 Toast (`src/components/ui/toast.tsx`)

**점수: 55 / 100**

- 위반: `toast.tsx:30` `rounded-2xl`(24px) — 가이드 §5에 토스트 명시 없으나 일반적으로 16~20px. 24px은 살짝 둥글.
- 위반: `toast.tsx:43` default variant `bg-neutral-900 text-white` — 가이드 §9.7 "다운로드 시 200ms 토스트 / 색 명시 없음". neutral-900 배경 + 흰 글씨는 토스 패턴 부합. OK.
- 위반: `toast.tsx:44-45` `border-success-200`·`border-danger-200` — **미정의 토큰**. variant 적용 시 보더 색 빠짐.
- 위반: `toast.tsx:30` `shadow-card-hover` — 가이드 §5 토스트는 `elev-2: 0 4px 12px rgba(0,0,0,0.06)`. `shadow-card-hover`(`index.css:101`)는 `0 4px 12px rgba(0,0,0,0.06), 0 2px 24px rgba(17,24,28,0.06)` — 거의 일치. OK.
- 위반: `toast.tsx:18` `bottom-0 left-1/2 -translate-x-1/2 ... max-w-md ... p-4` — 화면 하단 중앙 정렬, max 448px. 가이드 §4 "max-width 480px" 부합.
- 위반: `toast.tsx:38` `data-[state=open]:slide-in-from-bottom-full` — 가이드 §6 "토스트 등장 280ms spring". 현재 spring 명시 없이 Tailwind 기본. duration도 미명시.
- 권고: variant border를 semantic alpha로. animation duration 명시.

### 4.12 StatNumber (`src/components/ui/StatNumber.tsx`)

**점수: 75 / 100**

- 합격: 토스 패턴 §8.5 거의 정확 구현. `tabular-nums`, `tracking-tight`, `font-bold`, `text-neutral-900`, baseline alignment for unit.
- **위반**: `StatNumber.tsx:61` `font-bold`(700) — 가이드 §3 "Extrabold 800은 큰 숫자(48px 이상)에만 쓴다." 800 필수.
- **위반**: `StatNumber.tsx:71` unit `font-medium`(500) — 가이드 §8.5 "단위 — 숫자 옆 20px / **Semibold** / `--gray-700`". Medium → Semibold(600)로.
- 합격: `StatNumber.tsx:79-86` hint + trend 색 처리. up=success-600, down=danger-600. 가이드 §8.5 부합.
- 위반: `StatNumber.tsx:16-20` `text-success-600`·`text-danger-600` — 미정의 토큰.
- 위반: 변경폭(증감) 표시가 별도 줄로만 노출. 가이드 §3 "변경 폭(증감) 표시는 숫자 오른쪽 위 첨자처럼" — 우상 첨자 패턴 미구현. trend prop이 hint 색만 바꾸고 위치는 변경 안 함.
- 권고: `font-bold` → `font-extrabold`. unit `font-medium` → `font-semibold`. trend가 hint 색만 바꾸지 말고, 별도 superscript slot 추가.

### 4.13 Layout/AppLayout, ConsentGate, DesktopOnlyGate, PageTransition

- **AppLayout** (`AppLayout.tsx:22-49`): 단순·견고. 그러나 `AppLayout.tsx:28` `bg-neutral-50` 페이지 배경, `bg-white` footer — 토스 미감 부합. **footer 면책 카피 톤 좋음** (`AppLayout.tsx:40-43`): "이 결과는 특정 보험상품 추천이 아니라 현재 보장 상태를 이해하기 위한 참고 정보입니다. 입력하신 정보는 브라우저에만 저장되며 외부로 전송되지 않아요." 합격.
- **DesktopOnlyGate** (`DesktopOnlyGate.tsx:31-83`): 토스 위반. 모바일 우선 토스 철학에 반함. 1024px 미만 차단은 학부 프로젝트 편의이지만 시장 진입 불가. Iteration 2에서 적어도 768px까지 반응형 권고. 또한 "PC에서 이용해 주세요" 카피는 §7 톤 부합이나, 마찰이 너무 크다.
- **ConsentGate** (`ConsentGate.tsx:25-43`): 견고. `<Navigate replace />` 사용. 토스 라우터 가드 패턴 부합. OK.
- **PageTransition** (`PageTransition.tsx:46-72`): `prefers-reduced-motion` 처리 우수. 그러나 `PageTransition.tsx:64` `duration: reduced ? durations.fast : durations.slow` — 320ms는 토스 페이지 전환 300ms와 거의 일치. 합격.

---

## 5. Landing.tsx 비평 (섹션별)

### 5.1 TopNav (`Landing.tsx:27-59`)

- **위반**: 가이드 §9.1 "로그인 강요 금지, 마케팅 배너 금지" 부합. 그러나 **TopNav 자체가 토스 랜딩엔 없다**. 토스 첫 화면은 상단 navbar 없이 곧장 Hero. 현재 `Landing.tsx:33` `fixed inset-x-0 top-0 z-50 h-16` navbar는 SaaS 마케팅 페이지의 흔적.
- 위반: `Landing.tsx:46` `max-w-[1280px] px-10` — 데스크탑 폭. 480px 위반 (#17).
- 위반: `Landing.tsx:38-39` `useTransform(bgOpacity, (o) => ...)` 스크롤 시 navbar 배경 페이드인 — 정교한 인터랙션이나 토스 첫 인상엔 과한 디테일. 토스는 navbar 자체를 안 쓴다.
- 위반: `Landing.tsx:52` `h-1.5 w-1.5` — 4 배수 아님. 6px.
- 위반: `Landing.tsx:48` `gap-1.5` — 4 배수 아님.
- 권고: TopNav 제거. 로고는 Hero 안에 inline.

### 5.2 Hero (`Landing.tsx:68-158`)

- **방향성 위반 (CRITICAL)**: `Landing.tsx:96` `text-6xl`(64px) — 가이드 §3 display 토큰은 48px, h1은 32px. 64px은 **두 단계 위**. 토스 랜딩 h1은 32px 최대. 64px은 Stripe/Linear 스타일.
- 위반: `Landing.tsx:83` `max-w-[960px]` — 480px 위반.
- 위반: `Landing.tsx:74-77` 배경 그라데이션 blob — `bg-brand-50 opacity-60 blur-3xl` + 추가 blob. 가이드 §2 "토스 컬러는 블루 1색 + 9단계 그레이로 충분". 장식적 배경 blob은 토스 미감 아님. 토스는 흰 배경 + 콘텐츠.
- 위반: `Landing.tsx:107` `text-xl`(20px) 부제 — 가이드 §3 body 15px. h2 24px. **20px은 어디에도 없음**. 가이드 §3 표 외 폰트 크기 사용 = 위반.
- 위반: `Landing.tsx:115` `mt-12 ... gap-5` — gap 20px OK, mt 48px OK. 그러나 동의 카드 + CTA + 부제 3개 묶음이 한 화면에 — 가이드 §9.1 "Primary CTA 한 개 + Secondary text link" 패턴과 다름. **동의 카드가 추가 의사결정**으로 자라 있음.
- 위반: `Landing.tsx:120` `rounded-2xl border ... bg-white p-4` — 동의 카드 radius 24px, padding 16px. 가이드 §8.3 "Padding 24px". 카드도 작고 빽빽함.
- 위반: `Landing.tsx:146` `h-16 text-lg` — Button size="lg" + 추가 h-16. 이중지정. 그리고 64px CTA는 토스 56px보다 큼.
- 위반: `Landing.tsx:151` `text-sm leading-relaxed text-neutral-500` "보험 가입을 권하지 않아요. 점검만 도와드려요." — 카피 톤 합격, 그러나 CTA 바로 아래 부연이 너무 많음. 가이드 §9.1 "캡션 13px"로 줄이고 신뢰 시그널 하나로 압축 권고.
- 합격: `Landing.tsx:86-90` Badge "내 보험, 한 번 점검해볼까?" — 친근 톤, 입장 시그널.
- 합격: 동의 토글 자체의 카피.
- 점수: **30 / 100** — 카피와 동의 패턴은 좋으나, 폰트 스케일과 폭이 토스 가이드 정면 위반.

### 5.3 TrustSection (`Landing.tsx:167-200`)

- **존재 위반**: 가이드 §9.1 Landing 명세에 Trust 섹션은 **없다**. 가이드는 "로그인 강요 금지, 마케팅 배너 금지" 외 추가 섹션 명시 없음 — 즉 1 화면 1 결정 원칙에 의해 추가 섹션은 토스 아님.
- 위반: `Landing.tsx:171` `max-w-[1280px] px-10 py-24` — 폭 +패딩.
- 위반: `Landing.tsx:175` `grid-cols-3 gap-6` — 3컬럼 그리드. 토스는 카드를 세로 스택. 3컬럼은 SaaS 미감.
- 위반: `Landing.tsx:188` Card `h-full p-6` + `Landing.tsx:189` `h-11 w-11 ... rounded-xl bg-brand-50 text-brand-600` — `h-11 w-11`는 44px (4 배수 OK). `rounded-xl`(16px) OK. 그러나 아이콘 컨테이너에 `bg-brand-50` 틴트는 가이드 §2 "blue-50 — Selected/Focus 배경 틴트" 용도와 다름. 트러스트 아이콘 장식 = 토스 위반.
- 합격: 카피 "가입 X / 서버 X / 광고 X" — 토스 단호함과 친근함 균형.
- 점수: **40 / 100**

### 5.4 PersonaSection (`Landing.tsx:204-283`)

- **존재 위반**: 가이드 §9.1에 페르소나 섹션 없음. 광고 카탈로그 미감.
- 위반: `Landing.tsx:209` `grid-cols-10 ... gap-12` — 10컬럼 그리드, 갭 48px. 토스는 grid 거의 안 쓰고 세로 스택.
- 위반: `Landing.tsx:218` `mt-3 text-4xl font-extrabold` — h2 40px. 가이드 §3 h2 = 24px. **16px 초과**.
- 위반: `Landing.tsx:227` "가입은 했는데, / 제대로 된 건지 / 모르겠는 분들요." — 3줄 줄바꿈. 가이드 §7 토스 톤은 한 문장으로 자연스럽게. 줄바꿈으로 강조하는 패턴은 토스가 아니라 광고 카피.
- 위반: `Landing.tsx:243` Card `p-8`(32px) — 24px 표준 위반. 그러나 큰 카드면 32px OK.
- 위반: `Landing.tsx:246-250` 페르소나 아바타 `size-14 ... rounded-full bg-brand-100 text-2xl ... "민"` — 자작 아바타. 토스는 가공 페르소나 거의 안 씀.
- 위반: `Landing.tsx:255-257` Badge "예시 페르소나" — 자기 변호 카피. "이건 진짜 아니에요" 신호를 페르소나에 다는 순간 페르소나의 신뢰성 자체가 무너짐. 가이드 §4 "친근하지만 단단하다"의 단단함 결여.
- 위반: `Landing.tsx:260` `text-xl font-medium leading-relaxed` 인용 — body-lg 17px가 가이드. 20px은 한 단계 위.
- 위반: `Landing.tsx:266-277` 3컬럼 dl — 한 카드 안에 4개 사실(아바타+인용+3-grid). #13 위반.
- 위반: `Landing.tsx:272` `rounded-xl bg-neutral-100 p-4` — 내부 칩 padding 16px. OK. 그러나 `rounded-xl` 카드 안에 `rounded-xl` 내부 박스는 가이드 §8.3 "한 radius per surface" 원칙 위반 (DESIGN_TOKENS.md:207 "Don't mix `rounded-lg` cards with `rounded-xl` inner elements").
- 점수: **25 / 100** — 섹션 자체가 토스 위반.

### 5.5 PreviewSection (`Landing.tsx:286-326`)

- **존재 위반**: 가이드 §9.1에 미리보기 섹션 없음. 가이드 §9.7 결과 화면을 별도 라우트로 분리. 랜딩에서 미리보기는 진단 동기를 약화.
- 위반: `Landing.tsx:296` `max-w-[1280px] px-10 py-24` — 폭.
- 위반: `Landing.tsx:302` `text-4xl font-extrabold` — h2 40px.
- 위반: `Landing.tsx:299` "진단이 끝나면" `text-sm font-semibold text-brand-600` — brand 컬러 보조 텍스트. 가이드 §2 brand는 "Primary CTA, 활성 상태, 강조" 전용. 보조 텍스트 색으로 brand 사용은 위반.
- 위반: `Landing.tsx:312` `grid-cols-3 gap-6` — 3컬럼 카드 그리드. 모바일 폭 480px이면 세로 스택.
- 점수: **30 / 100**

#### 5.5.1 PreviewDashboard (`Landing.tsx:337-371`)

- 위반: `Landing.tsx:344` Card `p-6` — `rounded-2xl`(24px). 카드 radius 위반.
- 위반: `Landing.tsx:347` `text-score text-neutral-900` "72" — `.text-score` 유틸의 `font-weight: 700`은 가이드 800 위반. 클래스 자체 위반.
- 위반: `Landing.tsx:348` `<span className="pb-2 text-sm font-semibold text-neutral-500">/ 100</span>` — "/100" 단위 표기. 가이드 §3 "단위 '점'". 시험지 미감.
- 위반: `Landing.tsx:350` `text-sm text-neutral-500` "보통 수준이에요" — 등급 라벨이 회색. 가이드 §3 "등급 라벨 — 13px / **Medium / 등급 색상**". 색이 빠짐.
- 위반: `Landing.tsx:351-353` Progress bar h-2 + `bg-brand-500` — brand 색 진행률 OK. 그러나 `Landing.tsx:352` `rounded-full bg-neutral-100` 컨테이너 + 안쪽 `bg-brand-500` — Progress 컴포넌트(`progress.tsx`) 안 쓰고 자체 구현. 컴포넌트 중복.
- 위반: `Landing.tsx:354-368` breakdown 3행 — 가이드 §13 "한 카드 = 한 사실" 위반. 점수 + 진행률 + 3종 breakdown = 4개 사실 한 카드에 압축.
- 위반: `Landing.tsx:361` `text-semantic-warn` 사용 — `index.css:41` `--color-semantic-warn: #F59E0B`는 정의됨. 토큰 OK. 그러나 가이드 §2 warn=`#FF9500` (오렌지), 현재 `#F59E0B`(좀더 노란 오렌지). 가이드 헥스값 정확 불일치. **가이드 토큰이 우선** — `index.css:41`을 `#FF9500`으로 변경하거나 가이드 개정.
- 점수: **40 / 100**

#### 5.5.2 PreviewReport (`Landing.tsx:373-395`)

- 위반: `Landing.tsx:377` `text-lg font-bold` "사망 보장 공백 3,200만원" — h3 토큰은 20px Semibold(`index.css:71` `--text-xl: 1.25rem`). `text-lg`(18px) + `font-bold`(700)는 토큰 외 변형.
- 위반: `Landing.tsx:384,388` `rounded-xl bg-neutral-100 p-3`·`rounded-xl bg-brand-50 p-3` — `p-3`(12px) padding. 가이드 §4 카드 내부 박스 표준은 16~20px.
- 위반: `Landing.tsx:388` `bg-brand-50` — 가이드 §2 blue-50 = "Selected/Focus 배경 틴트". 단순 강조 박스에 blue-50은 잘못된 의미. 또한 `Landing.tsx:389` `text-brand-700` 라벨, `Landing.tsx:390` `text-brand-700` 본문 — 가이드 §2 "Primary text는 무조건 gray-900" 위반.
- 합격: `Landing.tsx:380-382` "부양가족 1인 기준으로 통상 권고되는 보장보다 부족해요." — 친근 톤 합격.
- 점수: **45 / 100**

#### 5.5.3 PreviewChecklist (`Landing.tsx:397-438`)

- 위반: `Landing.tsx:407` `space-y-3`(12px) — 가이드 §8.3 카드 간 12~16px. OK.
- 위반: `Landing.tsx:413` `mt-0.5 inline-flex size-5 ... rounded-md border-2` — `size-5`(20px), `mt-0.5`(2px 4 배수 아님), border-2 OK.
- 위반: 자체 체크박스 구현. `src/components/ui/checkbox.tsx` 있는데 안 씀. 컴포넌트 중복.
- 위반: `Landing.tsx:415` `border-brand-500 bg-brand-500 text-white` 체크된 상태. 가이드 §9.7 "완료 시 체크박스가 `--blue-500`로 채워지며 텍스트에 strikethrough 150ms." 부합.
- 위반: `Landing.tsx:428` `text-neutral-400 line-through` — 합격.
- 점수: **60 / 100**

### 5.6 SiteFooter (`Landing.tsx:441-458`)

- 위반: `Landing.tsx:444` `max-w-[1280px] px-10 py-10` — 폭 1280px. 480px 위반.
- 위반: `Landing.tsx:445-447` 면책 카피 — "본 서비스는 보험상품 추천·중개·자문이 아닌 정보제공 서비스이며, 결과의 정확성·완전성을 보증하지 않습니다." 약관체. 가이드 §7 "이 결과는 참고용이에요. 의료적 진단은 의사 선생님과 상의해 주세요." 친근체로 재작성 권고.
- 위반: `Landing.tsx:450-453` "RiskFit 팀 / 이준호 · 엄덕현 · 소위륜 / 금융인공지능실무 학부 프로젝트" — 학부 프로젝트 시그널 노출은 시장 진입 불가 시그널. **상용 가능성 0**. 시장 진입 점수 큰 깎임.
- 점수: **40 / 100**

---

## 6. 누락된 핵심 마이크로카피

가이드 §7과 §9.6/9.7이 명시하는 카피지만 현재 코드에 없음:

| 상황 | 가이드 기준 카피 | 현재 상태 |
|---|---|---|
| 분석 중 대기 | "잠시만요, 분석하고 있어요" + 13px caption "최대 10초 정도 걸려요" | `Analyzing.tsx:11` "분석 중… (TBD)" — placeholder |
| 분석 진행 메시지 | "건강 신호 계산 중", "유사 사례 비교 중", "리포트 준비 중" (1.5초 교체) | 없음 |
| 결과 첫 인사 | "분석이 끝났어요. 결과를 함께 살펴볼게요." | 없음 |
| 리포트 생성 대기 | "30초만 시간을 주세요. 리포트를 만들고 있어요." | 없음 |
| 입력 검증 실패 | "숫자를 다시 한 번 확인해 주세요." | 없음 (InputBasic TBD) |
| 빈 상태 (보험 미등록) | "아직 등록된 보험이 없어요" + Secondary "보험 추가하기" | 없음 |
| 토스트 (저장 완료) | "리포트가 저장되었어요" | 없음 |
| 가족력 단답 | "있어요 / 없어요 / 모르겠어요" | 없음 (InputFamilyHistory TBD) |
| 404 | (가이드 명시 없음) | `NotFound.tsx` 확인 필요 |

**누락 9건 — Iteration 2에서 모두 채워야 함.**

### CTA 카피 톤 점검

| 위치 | 현재 | 가이드 권고 | 평가 |
|---|---|---|---|
| Landing Hero CTA | "시작하기" (`Landing.tsx:148`) | "분석 시작하기" 또는 "5분이면 끝나요" | 단조로움. 가이드 §7 "사용자의 다음 행동을 적는다"에 따라 "5분 점검 시작하기" 등으로 강화 권고. |
| Landing 동의 | "입력하는 건강·재무 정보는 이 브라우저에만 저장돼요." | "시작하기 전에 두 가지만 동의해 주세요." | 현재 카피가 더 친근하고 정보 밀도 높음. **현재 합격**. |
| Landing 부연 | "보험 가입을 권하지 않아요. 점검만 도와드려요." | 가이드 직접 명시 없음 | 합격 — 토스적 단호함. |
| Footer 면책 | "본 서비스는 보험상품 추천·중개·자문이 아닌 정보제공 서비스이며..." (`Landing.tsx:445-447`) | "이 결과는 참고용이에요. 의료적 진단은 의사 선생님과 상의해 주세요." | **F** — 약관체. 친근체로 재작성 필수. |
| AppLayout footer | "이 결과는 특정 보험상품 추천이 아니라 현재 보장 상태를 이해하기 위한 참고 정보입니다. 입력하신 정보는 브라우저에만 저장되며 외부로 전송되지 않아요." (`AppLayout.tsx:40-43`) | 같음 | **B+** — 거의 토스 톤. "참고 정보입니다" → "참고만 해주세요"로 한 톤 더 내릴 것. |

---

## 7. Iteration 2 우선순위 권고

다음 라운드에서 **이 순서대로** 처리할 것. 1~3번이 안 되면 4번 이하는 의미 없음.

### 우선순위 1 (P0): 카드 radius·shadow 일괄 교체

- `src/components/ui/card.tsx:14`: `rounded-2xl` → `rounded-lg` (16px). 추가로 `border border-border` 기본 적용.
- `src/components/ui/dialog.tsx:44`: `rounded-3xl` → `rounded-xl` (20px). `shadow-card-hover` → `shadow-modal`.
- `src/components/ui/select.tsx:83`: `rounded-2xl` → `rounded-xl`.
- `src/components/ui/toast.tsx:30`: `rounded-2xl` → `rounded-xl`.
- `src/pages/Landing.tsx:120`: 동의 카드 `rounded-2xl` → `rounded-lg`.
- **영향**: 모든 카드 미감이 토스로 전환. 1시간 작업, 전체 시각 70% 개선.

### 우선순위 2 (P0): Landing.tsx 폭 + 폰트 스케일 정상화

- `src/pages/Landing.tsx:46, 83, 171, 207, 296, 444`: 모든 `max-w-[1280px]`·`max-w-[960px]` → `max-w-[480px]`. 페이지 가운데 정렬. 양옆 `bg-neutral-50`.
- `src/pages/Landing.tsx:96`: Hero h1 `text-6xl` → `text-3xl` (32px).
- `src/pages/Landing.tsx:107`: 부제 `text-xl` → `text-base` (16px) 또는 `text-lg`(18px).
- `src/pages/Landing.tsx:218, 302`: 섹션 h2 `text-4xl` → `text-2xl` (24px).
- `src/pages/Landing.tsx:260`: 인용 `text-xl` → `text-lg` (17~18px).
- **영향**: 단번에 토스 모바일 시뮬레이션 미감. **이걸 안 하면 어떤 카드 수정도 의미 없음.**

### 우선순위 3 (P0): Landing 구조 단순화 — TrustSection/PersonaSection/PreviewSection 제거

- `src/pages/Landing.tsx:474-479`: TrustSection·PersonaSection·PreviewSection 삭제 또는 별도 라우트(`/about`)로 분리.
- 가이드 §9.1 "Hero + CTA + 면책 끝" 원칙 복원.
- 동의 체크박스를 별도 카드에서 inline 라벨로 단순화 또는 라우터 가드 직전 다이얼로그로 이동.
- **영향**: 480px 화면에서 한 화면 한 결정 원칙 복원. 가이드 정면 부합.

### 우선순위 4 (P1): 미정의 토큰 일괄 정의 또는 교체

- `src/index.css:39-43` 시맨틱 색에 50/100/200/500/600/700 스케일 추가:
  ```css
  --color-success-50: #E6FBF4;
  --color-success-100: #C7F4DD;
  --color-success-200: #92E5BC;
  --color-success-500: #1AC788; /* primary */
  --color-success-600: #0BAA72;
  --color-success-700: #088256;
  /* 동일 패턴으로 warn-*, danger-* */
  ```
- 또는 컴포넌트들이 `--color-semantic-*` 단일 토큰만 쓰고 alpha 변형으로 처리.
- 영향: `badge.tsx`·`button.tsx`·`input.tsx`·`toast.tsx`·`StatNumber.tsx`의 silent fail 해소.

### 우선순위 5 (P1): Tabs 컬러 변경 (#15 위반)

- `src/components/ui/tabs.tsx:40`: `data-[state=active]:after:bg-brand-500` → `data-[state=active]:after:bg-neutral-900`.
- 가이드 §8.4 "탭 활성은 흑백 대비". 토스 미감의 핵심.

### 우선순위 6 (P1): Input 단위 슬롯 추가

- `src/components/ui/input.tsx`에 `suffix?: ReactNode` prop 추가 (또는 wrapper 컴포넌트).
- 우측 고정 `text-base text-neutral-600 px-4` 슬롯. 가이드 §8.2 핵심.
- 영향: InputBasic의 키(cm)·체중(kg)·연령(세) 마찰 0 입력 가능.

### 우선순위 7 (P1): StatNumber + .text-score weight 800 적용

- `src/index.css:168`: `font-weight: 700` → `font-weight: 800`.
- `src/components/ui/StatNumber.tsx:61`: `font-bold` → `font-extrabold`.
- `src/components/ui/StatNumber.tsx:71`: unit `font-medium` → `font-semibold`.
- 가이드 §3 핵심. "숫자가 주인공" 원칙의 시각적 핵.

### 우선순위 8 (P2): 4 배수 아닌 spacing 일괄 교체

- `src/pages/Landing.tsx`: `gap-1.5`·`mt-0.5`·`size-3.5`·`mt-1.5`·`px-3.5` 등 제거.
- `src/components/ui/tabs.tsx:34` `py-2.5` → `py-3`.
- `src/components/ui/badge.tsx:24` `px-2.5` → `px-2` 또는 `px-3`.
- `src/components/ui/card.tsx:31` `gap-1.5` → `gap-2`.
- 영향: 가이드 #7 위반 0건 회복.

### 우선순위 9 (P2): 모션 duration 단축

- `src/pages/Landing.tsx:85,95,99,106,113,182,210,237,318`: `duration: 0.5 / 0.55 / 0.6` → `0.24 ~ 0.32`.
- `src/lib/motion.ts:35` `slower: 0.48` → `0.4` 또는 제거.
- 가이드 §6 상한 400ms 준수.

### 우선순위 10 (P2): 면책 카피 친근체 재작성

- `src/pages/Landing.tsx:445-447`: "이 결과는 보험상품 추천이 아니에요. 지금 보장이 어떤지 함께 살펴보는 도구로만 써주세요."
- `src/components/layout/AppLayout.tsx:40-43`: "이 결과는 참고만 해주세요. 입력한 정보는 이 브라우저에만 있고 어디로도 안 나가요."
- `src/pages/Landing.tsx:450-453`: "RiskFit 팀 / 이준호 · 엄덕현 · 소위륜 / 금융인공지능실무 학부 프로젝트" → 학부 프로젝트 시그널 삭제 또는 별도 `/about` 페이지로 격리.

---

## 8. 통과해야 할 회귀 기준 (Iteration 2 게이트)

다음 iteration이 끝났을 때 **이 모든 항목을 만족하지 않으면 시장 진입 불가**. 정성 평가가 아니라 정량 게이트.

### 8.1 18-point Audit 0건 위반

- 현재 FAIL 5건 + CONDITIONAL 2건 = 7건. **이를 0건으로 줄여야 함.**
- 특히 #7 (4 배수), #8 (미정의 토큰), #14 (모션 duration), #15 (탭 색), #17 (폭 480px)는 무조건 PASS.
- 자동 lint: ESLint custom rule 또는 grep 스크립트로 `pt-\[1?[0-9]px\]`·`gap-[0-9]\.[0-9]`·`mt-0\.5`·`size-[0-9]\.[0-9]`·`max-w-\[[0-9]{3,4}px\]` 패턴 검출.

### 8.2 토큰 무결성

- `index.css`에 정의된 토큰만 컴포넌트에서 참조. 미정의 토큰(`bg-success-50`, `text-danger-700`, `border-success-200` 등) 사용 0건.
- 자동 검증: `grep -rn "color-success-[0-9]" src/components/` 등으로 미정의 참조 detection. `tailwind --safelist` 활용.

### 8.3 Landing.tsx 가이드 §9.1 정확 일치

- 가이드 §9.1: "화면 상단 64px 여백 후 24px 일러스트(또는 없음), 그 아래 h1 32px Bold로 '건강 신호를 30초 만에 확인하세요'. 본문 body 15px gray-700로 한 문장 보조. 화면 하단 고정 Primary CTA '지금 시작하기' 한 개. 다른 링크는 캡션 13px로 CTA 아래 중앙 정렬. **로그인 강요 금지, 마케팅 배너 금지.**"
- 게이트:
  - max-width 480px ✓
  - h1 32px (text-3xl) ✓
  - 본문 15px (text-sm 또는 text-base 14~16) ✓
  - Primary CTA 1개, height 56px ✓
  - Secondary text link (캡션 13px) ✓
  - TrustSection·PersonaSection·PreviewSection 부재 ✓
  - 마케팅 카피 (Sparkles, badge "내 보험, 한 번 점검해볼까?") 톤 검토 ✓

### 8.4 컴포넌트 prop 충실도

- Input: `suffix` prop으로 단위 표시 가능 ✓
- Button: size variant {sm, default, lg} 모두 height 4 배수 + min 40px(sm)/56px(default)/64px(lg) ✓
- Card: 기본 `rounded-lg` + `border` + `shadow-card` ✓
- Tabs: active indicator color `neutral-900` ✓
- StatNumber: `font-extrabold` ✓
- Dialog: `rounded-xl` + `shadow-modal` ✓

### 8.5 모든 placeholder 화면 (Analyzing/Result/InputBasic/InputHealth/InputFamily/InputInsurance) 진짜 화면으로 교체

- 가이드 §9.2~9.7 화면별 명세 충실 구현.
- 마이크로카피 §6의 누락 9건 모두 채움.

### 8.6 시장 진입 점수 ≥ 90 / 100

- 토스 시니어 디자이너 임의 외부 평가(또는 동일 critic 재실행) 점수 90+ 도달.
- 평가 항목: 토큰(20) + 컴포넌트(25) + Landing(25) + 카피(15) + 모션·접근성(15) = 100.
- 현재 58 → 목표 90 = +32 격차. P0~P2 모두 처리 필요.

### 8.7 추가 회귀 가드

- `prefers-reduced-motion` 처리 유지 (현재 합격).
- ConsentGate 라우트 가드 유지 (현재 합격).
- ESLint + TypeScript strict 통과.
- `pnpm build` 또는 `npm run build` 성공 (Tailwind v4 unknown class 워닝 0건).

---

## 부록 A: 한 줄 요약

> Iteration 1은 **토큰을 깔았지만 토큰을 어겼고**, **토스를 표방했지만 SaaS 마케팅 페이지를 만들었다**. 점수 58점, 시장 진입 불가. P0 3건(카드 radius·Landing 폭·구조 단순화)을 처리하면 70점 회복 가능. P0~P2 10건 모두 처리해야 90점 도달.

## 부록 B: 빠른 grep 명령어 (Iteration 2 검증용)

```bash
# 4의 배수 아닌 spacing 탐지
grep -rn -E "(gap|mt|mb|ml|mr|p|px|py|pt|pb|pl|pr|size)-([0-9]+\.5|[0-9]+\.[0-9])" src/

# 미정의 시맨틱 토큰 탐지
grep -rn -E "(success|warn|danger)-(50|100|200|300|500|600|700|800|900)" src/components/

# 480px 초과 max-width
grep -rn -E "max-w-\[[5-9][0-9]{2,}px\]|max-w-\[1[0-9]{3,}px\]" src/

# rounded-2xl, rounded-3xl 카드
grep -rn -E "rounded-(2xl|3xl)" src/

# 가이드 §3 외 폰트 크기
grep -rn -E "text-(4xl|6xl)" src/

# 모션 duration 0.4s 초과
grep -rn -E "duration:\s*0\.[5-9]|durations\.slower" src/
```

---

## 부록 C: 컴포넌트 토큰 위반 매트릭스

다음 표는 컴포넌트가 참조하는 **미정의/위반 클래스**를 한눈에 본다. Iteration 2에서 토큰을 추가하면 이 표가 비어야 한다.

| 컴포넌트 | 파일:줄 | 위반 클래스 | 가이드 §  | 수정 |
|---|---|---|---|---|
| Button | button.tsx:28 | `bg-danger-500` | §2 미정의 | `bg-semantic-danger` 또는 `--color-danger-500` 신설 |
| Button | button.tsx:29 | `hover:bg-danger-600 active:bg-danger-700` | §2 미정의 | 동상 |
| Button | button.tsx:32 | `sm: h-10` | §8.1 (h-14 표준) | 사용처 제한 또는 변형 제거 |
| Input | input.tsx:16 | `border-danger-500 focus:border-danger-500` | §2 미정의 | semantic-danger 매핑 |
| Input | input.tsx:17 | `border-success-500 focus:border-success-500` | §2 미정의 | semantic-success 매핑 |
| Input | input.tsx:26 | `border` (1px focus 시도 색만 변경) | §8.2 (focus 2px) | `focus:border-2 focus:px-[15px]` 패턴 |
| Card | card.tsx:14 | `rounded-2xl` | §8.3 (16px) | `rounded-lg` |
| Card | card.tsx:14 | 무 보더 | §8.3 (1px gray-200) | `border border-border` 추가 |
| Card | card.tsx:31 | `gap-1.5 mb-4` | §4 (gap 4 배수, mb 20px) | `gap-2 mb-5` |
| Card | card.tsx:78 | `mt-6` | §4 (20px) | `mt-5` |
| Badge | badge.tsx:16 | `bg-success-50 text-success-700` | §2 미정의 | semantic alpha 또는 토큰 신설 |
| Badge | badge.tsx:17 | `bg-warn-50 text-warn-700` | §2 미정의 | 동상 |
| Badge | badge.tsx:18 | `bg-danger-50 text-danger-700` | §2 미정의 | 동상 |
| Badge | badge.tsx:24 | `h-6 px-2.5` | §8.4(B) (h-9, px-3.5) | `h-7 px-3` 또는 `h-9 px-3.5` |
| Tabs | tabs.tsx:34 | `py-2.5` | §4 (4 배수) | `py-3` |
| Tabs | tabs.tsx:39 | `after:h-0.5 after:left-0 after:right-0` | §8.4 (24px wide indicator) | 글자 폭 매칭 |
| Tabs | tabs.tsx:40 | `after:bg-brand-500` | §8.4 (흑백) | `after:bg-neutral-900` |
| Select | select.tsx:83 | `rounded-2xl` | §5 (xl=20px) | `rounded-xl` |
| Select | select.tsx:23 | `data-[state=open]:border-brand-500` | §8.2 (2px) | 두께 변화 패턴 |
| Dialog | dialog.tsx:44 | `rounded-3xl` | §5 (xl=20px) | `rounded-xl` |
| Dialog | dialog.tsx:43 | `shadow-card-hover` | §5 (elev-3) | `shadow-modal` |
| Toast | toast.tsx:30 | `rounded-2xl` | §5 (16~20px) | `rounded-xl` |
| Toast | toast.tsx:44 | `border-success-200` | §2 미정의 | semantic alpha |
| Toast | toast.tsx:45 | `border-danger-200` | §2 미정의 | semantic alpha |
| StatNumber | StatNumber.tsx:16 | `text-success-600` | §2 미정의 | semantic-success |
| StatNumber | StatNumber.tsx:17 | `text-danger-600` | §2 미정의 | semantic-danger |
| StatNumber | StatNumber.tsx:61 | `font-bold` | §3 (Extrabold 800) | `font-extrabold` |
| StatNumber | StatNumber.tsx:71 | `font-medium` (단위) | §8.5 (Semibold) | `font-semibold` |
| .text-score | index.css:168 | `font-weight: 700` | §3 (800) | `font-weight: 800` |

**총 위반 30건 — 모두 5분 이내 일괄 교체 가능.**

---

## 부록 D: Landing.tsx 정정 명세 (480px 모드)

가이드 §9.1을 충실히 따르는 Iteration 2 Landing의 의사 코드 (참고용):

```tsx
// src/pages/Landing.tsx (Iteration 2 목표)
export function Landing() {
  const { consent, setConsent } = useConsent();
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-surface-muted flex items-center justify-center">
      <main className="w-full max-w-[480px] min-h-screen bg-white flex flex-col px-5">
        {/* 64px top + 24px illustration slot */}
        <div className="pt-16" />
        <div aria-hidden className="h-6" /> {/* optional illustration 24px */}

        <h1 className="text-3xl font-bold tracking-tight text-neutral-900">
          건강 신호를<br />30초 만에 확인하세요
        </h1>
        <p className="mt-3 text-base text-neutral-700">
          가족력·생활습관까지 한 번에 점검해드릴게요.
        </p>

        <div className="flex-1" /> {/* push CTA to bottom */}

        {/* Sticky CTA zone */}
        <div className="pb-12 sticky bottom-0 bg-white">
          <label htmlFor="consent" className="flex items-start gap-2 py-4">
            <Checkbox id="consent" checked={consent} onCheckedChange={...} />
            <span className="text-sm text-neutral-700">
              입력 정보는 이 브라우저에만 저장돼요.
            </span>
          </label>
          <Button fullWidth disabled={!consent} onClick={() => navigate("/input/basic")}>
            지금 시작하기
          </Button>
          <p className="mt-3 text-center text-xs text-neutral-500">
            이미 분석한 적 있어요 →
          </p>
        </div>
      </main>
    </div>
  );
}
```

**라인 수: 약 35줄 (현재 485줄 대비 -93%).** 토스 랜딩은 짧다. 이게 토스다.

---

**총평**: 토큰은 80점, 컴포넌트는 55점, Landing은 35점, 카피는 70점, 모션은 75점. 평균 58점. **카드·Landing·미정의 토큰** 3개 영역만 P0로 잡아 정리하면 다음 라운드에 75+ 도달 가능. 그러나 P0를 미루면 영원히 토스가 안 됨. **이건 코드 품질 문제가 아니라 방향성 문제다.**

> **Iteration 2 첫 커밋의 diff 통계 예상**: `card.tsx` -1+1, `dialog.tsx` -1+1, `select.tsx` -1+1, `toast.tsx` -1+1, `Landing.tsx` -450+35, `index.css` +20 (시맨틱 50/100/200/500/600/700 토큰), `tabs.tsx` -1+1, `StatNumber.tsx` -2+2. 약 -460 / +60 라인. 가벼운 PR. **토스가 토스인 이유는 항상 코드가 짧기 때문이다.**
