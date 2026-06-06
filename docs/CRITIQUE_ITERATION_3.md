# Iteration 3 — 토스 디자인 + Anti-AI-tone 비평 보고서

> 비평자: Critic Agent P (토스 출신 시니어 디자이너 시점)
> 비평 대상: RiskFit Iteration 3 — Landing(203줄) · Input 4페이지 · Analyzing · Result(4탭) · UI 14 · Wizard 4 · Insurance 3 · Result 9 · LLM 사이드카
> 기준서: `docs/TOSS_DESIGN_AUDIT.md` 18-point + 5원칙 / Anti-AI-tone 9 카테고리
> 이전 비평: `docs/CRITIQUE_ITERATION_1.md` (58/100, 시장 진입 불가)
> 작성일: 2026-05-27

---

## 1. 종합 평가 (Executive Summary)

### 시장 진입 점수: **84 / 100** (이전 58, +26)

### 시장 진입 가능 여부: **조건부 YES**
P0 잔여 4건만 정리하면 토스와 어깨를 나란히 한다는 평을 들을 수 있다. 그러나 현재 상태 그대로는 "토스를 잘 흉내냈으나 두세 군데에서 디자이너의 실수가 보이는 사례"로 평가된다.

### Iteration 1 대비 핵심 개선 5건

| # | 항목 | Iter 1 | Iter 3 |
|---|---|---|---|
| 1 | Landing 폭 (#17 게이트) | `max-w-[1280px]` 정면 위반 | **480px 정확 적용** (`Landing.tsx:36`) |
| 2 | Tabs 액티브 색 (#15 게이트) | `bg-brand-500` 파랑 언더라인 | **`bg-neutral-900` 흑백 대비** (`tabs.tsx:40`) |
| 3 | 숫자 weight (원칙 3) | `font-bold`(700) | **`font-extrabold`(800)** 전 결과 카드 (`RiskScoreHero.tsx:83`, `OutOfPocketCard.tsx:50`, `CoverageOverviewCard.tsx:84`, `RiskFactorCard.tsx:85`, `StatNumber.tsx:61`, `.text-score` 유틸) |
| 4 | 미정의 시맨틱 토큰 | `success-50/100/200/500/600/700` 등 silent fail | **`index.css:49-91`에 success/warn/danger/info 10단계 전체 정의 → Tailwind 빌드 정상화** |
| 5 | Landing AI flavor (사용자 명시 요청) | TopNav/Sparkles/PersonaCard/Preview 3-grid | **5개 구역 모두 제거, 203줄 미니멀** |

### 여전한 치명적 문제 (Top 3)

1. **Input 4페이지 모든 섹션이 `rounded-2xl` (32px)** — 토스 카드 표준은 16px (`rounded-lg`). `InputBasic.tsx:175,239,287`, `InputHealthLifestyle.tsx:171,197,256`, `InputFamilyHistory.tsx:177` 7개 위반. Card 컴포넌트는 이미 `rounded-lg`로 잘 박혀 있는데, 페이지가 Card를 안 쓰고 raw `<section className="rounded-2xl">`를 박아 토큰 일관성을 깬다. 18-point #13 카드 표준 위반. **토스 PM이 본다면 "왜 카드 컴포넌트 안 써?" 한마디.**
2. **Button/Input/Select trigger의 `rounded-xl` (24px)** — DESIGN_TOKENS.md §4와 TOSS_DESIGN_AUDIT.md §8.1·§8.2 모두 "버튼·입력 12px"이라 명시. 그러나 `button.tsx:10`·`input.tsx:26`·`select.tsx:19`은 `rounded-xl`(24px) — 한 단계 위. 통째로 `rounded-md`(12px)로 내려야 토스 인풋·버튼 미감. **토스 입력 필드는 칩이 아니라 사각형이다.**
3. **잔여 AI-tone 1건 + 광고 톤 1건** — `InputInsurance.tsx:208` 다이얼로그 타이틀 "**보험을 삭제할까요?**" — 사용자 명시 금지인 "~할까요?" 질문체. 토스 톤은 "삭제하시겠어요?" 또는 "정말 삭제할까요?"가 아니라 **"이 보험을 삭제할게요"** (확인 다이얼로그 인텐션 명사화). 그리고 `Landing.tsx:90` "**5분이면 끝나요.**" — Anti-AI 카테고리 "광고: 단 5분이면" 직격탄. sanitizeReport()의 `/단 5분이면[^.!?]*[.!?]/g` 패턴이 LLM 출력에서만 작동, **UI 자체엔 적용 안 됨.** Landing의 한 줄 광고가 그대로 살아 있다. 토스 톤은 시간 약속을 부드럽게: **"30초면 충분해요"** 또는 **"몇 분이면 끝나요"**.

### 정량 채점

| 영역 | Iter 1 | Iter 3 | Δ | 비고 |
|---|---|---|---|---|
| 디자인 토큰 정의 | 85 | **92** | +7 | semantic 50/100/200/.../900 정의 완료, radius-modal 추가 |
| 컴포넌트 충실도 | 55 | **80** | +25 | Card radius/border, Tabs 흑백, Dialog 20px, StatNumber 800 — 다 잡힘. 잔여: Input/Button radius |
| Landing 토스 부합 | 35 | **88** | +53 | 480px·h1 32px·CTA 1개·구역 1개·footer 한 줄. 잔여: "5분이면 끝나요" 광고 톤 |
| 입력 화면 토스 부합 | 0 (구현 없음) | **78** | n/a | 488줄→정상 구현. 잔여: rounded-2xl 7건, BMI 카드 라운드, 14건 미흡 |
| Analyzing 토스 부합 | 0 (TBD) | **92** | n/a | 48px 스피너·indeterminate bar·1.5s 메시지 교체·reduced-motion — 가이드 §9.6 거의 완벽 |
| Result 토스 부합 | 0 (TBD) | **85** | n/a | 4탭·sticky·일관 카드·면책 3중 안전망. 잔여: gap-1.5·자기부담 카드 unit |
| 마이크로카피 톤 | 70 | **88** | +18 | Toss-tone 통일, "~예요" 일관, 명령형 거의 없음. 잔여: 할까요 1건, "5분이면 끝나요" 광고체 |
| LLM 리포트 정합 | 0 | **86** | n/a | 7개 룰·34패턴 sanitizer·면책 3중. 잔여: 패턴 일부 누락(과장 형용사 변형) |
| 모션·접근성 | 75 | **88** | +13 | duration 400ms 캡, reduced-motion 모든 곳, ARIA |
| **합산** | **58** | **84** | **+26** | |

평균 단순합산이 아닌 가중합. 그러나 18-point 게이트 통과·시각 통일성이 핵심 지표.

---

## 2. 18-Point Anti-Pattern Audit (재평가)

| # | 검사 항목 | Iter 1 | Iter 3 | 변화 | 근거 (위반 시) |
|---|---|---|---|---|---|
| 1 | 한 화면에 Primary CTA 2개 이상 | PASS | **PASS** | = | `Landing.tsx:168-177` 단일 CTA. `StepFooter.tsx:78-85` Primary 1개 + ghost 이전 (보조) |
| 2 | 라벨 폰트 < 입력 폰트 | PASS | **PASS** | = | `FieldGroup.tsx:52` 13px / Input `text-lg`(18px). 비율 OK |
| 3 | 버튼 height 56px 미만 | COND | **PASS** | ↑ | `button.tsx:33` default h-14(56px), `StepFooter.tsx:82` h-14 강제. sm h-10 변형은 wizard에서 안 씀 |
| 4 | 버튼 pill (radius 9999px) — 칩 제외 | PASS | **PASS** | = | `button.tsx:10` `rounded-xl`. pill 없음. Badge는 칩이라 허용 |
| 5 | 카드 그림자 rgba 0.1 이상 | PASS | **PASS** | = | `--shadow-card`·`--shadow-card-hover` 모두 0.04~0.06 |
| 6 | 숫자 디스플레이에 컬러/그라데이션 | PASS | **PASS** | = | `RiskScoreHero.tsx:82-85`·`OutOfPocketCard.tsx:50` 모두 `text-neutral-900` 검정 |
| 7 | 4의 배수 아닌 spacing | FAIL | **PARTIAL FAIL** | ↑ | **잔여 5건**: `tabs.tsx:39` `after:h-0.5`(2px — 1px hack), `RiskScoreHero.tsx:79` `gap-1.5`(6px), `OutOfPocketCard.tsx:44` `gap-1.5`, `CoverageOverviewCard.tsx:79` `gap-1.5`, `RiskFactorCard.tsx:83` `gap-1.5`. **추가**: `DisclaimerBanner.tsx:40` `mt-0.5`(2px), `Landing.tsx:132` `mt-0.5`, `InputHealthLifestyle.tsx:396,402` `mt-0.5`·`px-2.5`(10px). `StepHeader.tsx:74` `h-1.5`(6px). Iter 1 대비 압도적 감소이나 0건 게이트 미달 |
| 8 | 정의되지 않은 색 | FAIL | **PASS** | ↑↑ | `index.css:49-91` semantic 10단계 정의 완료. Badge·StatNumber·Toast의 `success-700`/`warn-50`/`danger-200` 등 모두 실재. silent fail 0건 |
| 9 | 검정(#000)/흰 위에 흰 | PASS | **PASS** | = | `dialog.tsx:19` overlay만 `bg-black/40`. 텍스트는 모두 neutral-900 |
| 10 | placeholder를 라벨 대신 사용 | N/A | **PASS** | n/a | `FieldGroup.tsx` 강제, placeholder는 보조("예: 5,000")만 |
| 11 | 단위가 placeholder에만 있고 입력 후 사라짐 | N/A | **PASS** | n/a | `InputBasic.tsx:340-372` `SuffixInput`·`ManWonInput`이 우측 고정 단위 "세"·"kg"·"cm"·"만원" 슬롯 구현. 토스 §8.2 정확 부합 |
| 12 | 마이크로카피 명령형 ("확인"/"제출") | PASS | **PARTIAL FAIL** | ↓ | `InputInsurance.tsx:221` ghost "**취소**", `InsuranceForm.tsx:280` "**취소**", `InsuranceForm.tsx:284` "**저장**" — 차가운 동사형. 토스 §7은 "취소"는 OK이나 "저장"은 "저장하기" 정도가 토스 톤. 큰 위반 아님 |
| 13 | 한 카드에 정보 2개 이상의 사실 | FAIL | **CONDITIONAL** | ↑ | `RiskScoreHero.tsx`는 점수+밴드+한 줄 해석 = 1 사실(점수)+1 보조(밴드) — OK. `CoverageOverviewCard.tsx`는 **퍼센트+밴드+막대+3-grid summary** 4개 사실 = §8.3 살짝 위반. `InsuranceCard.tsx:57-90`는 보험사+상품명+보장+금액+월보험료 5개 — 카드 콘셉트엔 맞으나 토스 §8.3 엄격 적용 시 위반 |
| 14 | 모션 duration < 100ms 또는 > 400ms | PARTIAL | **PASS** | ↑ | `motion.ts:35` `slower: 0.4`(400ms) 캡. `Landing.tsx:35` 0.32s, `RiskScoreHero.tsx:78` 0.32s, `RiskFactorCard.tsx:117,136` 0.2s/0.22s. 가이드 §6 모두 부합 |
| 15 | 탭 활성에 파랑 / 두께 4px+ | FAIL | **PASS** | ↑↑ | `tabs.tsx:40` **`data-[state=active]:after:bg-neutral-900`** — 흑백 대비. h-0.5(2px) 두께 OK |
| 16 | tabular-nums 빠짐 | PASS | **PASS** | = | `index.css:173` html 기본 `tnum`, 숫자 디스플레이 모두 `tabular-nums` 명시 |
| 17 | 폭 480px 초과 | FAIL | **PASS** | ↑↑ | `Landing.tsx:36` 480px, 모든 input 페이지 `max-w-[480px]`, `Result.tsx:243` 480px, `StepFooter.tsx:60` 480px. 일관 |
| 18 | 위험·경고 색이 점수 숫자에 적용 | PASS | **PASS** | = | 모든 점수 숫자 `text-neutral-900`. 색은 옆 Badge에만 |

**합계: PASS 13 / PARTIAL 3 / FAIL 0 / N/A 0 → 0건 위반 게이트 미달(잔여 #7, #12, #13).**

이전 FAIL 5건 → Iter 3 FAIL 0건 + PARTIAL 3건. 실질적 게이트 통과까지 잔여 작업 30분.

---

## 3. Anti-AI-tone Audit (9 카테고리)

사용자가 명시 요청한 새 기준. 각 카테고리별 grep 결과와 0건 여부 점검.

### 3.1 과장 형용사 (스마트한/혁신적인/탁월한/완벽한)

- **UI 코드**: 0건. PASS.
- **sanitizeReport patterns** (`llm.ts:119-122`): 4건 모두 정의됨. PASS.
- **누락 우려**: "강력한·효과적인·체계적인·뛰어난·놀라운·간편한·간단한" 같은 변형. grep 결과 UI 코드엔 0건이라 PASS이나, **LLM이 변형 출력 시 빠져나갈 수 있다.** Iter 4에서 sanitizer 확장 권고.

### 3.2 의인화 (함께해요/도와드릴게요/지켜드릴게요)

- **UI 코드**: 0건. PASS.
- **sanitizeReport patterns** (`llm.ts:101-110`): 9건 (도와드리겠습니다/도와드릴게요/지켜드릴게요/지켜드리겠습니다/응원할게요/응원합니다/함께해요/함께 시작해요/함께 시작해 봐요). PASS.
- 누락 우려: "응원해요"(현재형), "지지해요", "함께가요". grep 0건이라 PASS 유지.

### 3.3 광고 (단 5분이면/지금 바로/무료로)

- **UI 코드: FAIL — 1건 발견**
  - `Landing.tsx:90` `<p className="mt-4 text-[15px] leading-relaxed text-neutral-600">5분이면 끝나요.</p>` — Anti-AI 카테고리 직격탄.
  - **대안**: "30초면 충분해요." 또는 "몇 분이면 끝나요." 또는 가이드 §9.1 권고문 "건강 신호를 30초 만에 확인하세요" 그대로.
- **sanitizeReport patterns**: 4건 (단 5분이면/지금 바로/지금 가입하세요/무료로). PASS.
- **모순**: LLM 출력엔 "단 5분이면" 검열하면서 Landing UI엔 "5분이면 끝나요" 살려둠. 일관성 0. **이 한 줄이 시장 진입 점수 -3 깎는 결정타.**

### 3.4 친근체 남용 (~할까요/~해볼까요/~해보실래요)

- **UI 코드: FAIL — 1건 발견**
  - `InputInsurance.tsx:208` `<DialogTitle>보험을 삭제할까요?</DialogTitle>` — 정중한 명령형 위장 친근체 질문. 토스 패턴은 다이얼로그 타이틀 = 명사형 명제. 가이드 §7 표 "닫기 → 닫기" 패턴.
  - **대안**: "이 보험을 삭제할게요" 또는 "정말 삭제하시나요" 또는 "보험 삭제" (명사형). 토스 다이얼로그는 의문문 거의 안 씀.
- **sanitizeReport patterns**: prompt에 "~할까요?/~해볼까요?/~해보실래요?" 금지 명시(`codex-server.ts:194`). PASS.
- "점검해 보세요"(`CoverageOverviewCard.tsx:39`)는 정중한 명령형이라 PASS.

### 3.5 자기지칭 (저희 RiskFit/AI가 분석한)

- **UI 코드**: 0건. PASS.
- **sanitizeReport patterns** (`llm.ts:116-118`): 3건 (저희 RiskFit은/저희가/AI가 분석한). PASS.
- 예외: `ReportTab.tsx:138` `report.source === "codex" ? "AI" : "요약"` 배지 — **"AI" 라벨이 UI에 노출됨**. 사용자 명시 금지는 "AI가 분석한"이지 "AI" 라벨 자체는 아니나, 톤 통일성을 위해 "AI 생성"·"자동 생성" 정도가 토스적. 작은 위반.

### 3.6 이모티콘·자모 (ㅎㅎ/ㅠㅠ/^^/:))

- **UI 코드**: 0건. PASS.
- **sanitizeReport patterns** (`llm.ts:124-135`): Unicode 이모지 3 범위 + ㅎㅎ/ㅠㅠ/ㅜㅜ/^_^/:)/:(/;)/<3 — 8건. **완전.** PASS.

### 3.7 데코 아이콘 (Sparkles/Heart/ThumbsUp 등 정보 전달 외)

- **UI 코드**: 0건. Iter 1의 `Landing.tsx` `Sparkles` 깨끗이 제거. PASS.
- **현재 lucide 아이콘들** (사용처 검증):
  - `Trash2` (`InsuranceCard.tsx:15`) — 삭제 기능. OK
  - `Plus` (`InsuranceEmptyState.tsx:9`, `InputInsurance.tsx:20`) — 추가 기능. OK
  - `MonitorSmartphone` (`DesktopOnlyGate.tsx:16`) — 데스크탑 안내. OK
  - `Wallet` (`OutOfPocketCard.tsx:11`) — **데코**. "예상 자기부담액" 라벨 옆 size-4 wallet 아이콘은 정보 전달 0. 토스라면 빼고 라벨만 둠. 미니멀 후퇴. P2.
  - `ShieldCheck` (`CoverageOverviewCard.tsx:12`) — **데코**. "보장 적합도" 옆 방패. 같은 이유로 P2.
  - `ListChecks` (`ChecklistTab.tsx:21`) — **데코**. "체크리스트" 옆 아이콘. 빼도 의미 전달 동일. P2.
  - `FileText` (`ReportTab.tsx:23`) — **데코**. "리포트" 옆 아이콘. P2.
  - `Info` (`DisclaimerBanner.tsx:9`) — 면책 시그널. 정보 전달 있음. OK
  - `ChevronLeft`/`ChevronDown`/`X`/`Check` — 모두 인터랙션 어포던스. OK
  - `Loader2` (`ReportTab.tsx:23`) — 로딩 스피너. OK
- **판정**: 데코 4건 (`Wallet`, `ShieldCheck`, `ListChecks`, `FileText`) 발견. 토스 결과 화면은 카드 헤더에 아이콘을 거의 안 쓴다. 라벨 글자로 충분. **P2 (Result 카드 4개 헤더 아이콘 일괄 제거).** 시장 진입 게이트는 아니나 토스 미니멀 후퇴.

### 3.8 2인칭 (당신의/당신은)

- **UI 코드**: 0건. PASS. `당신` 검색 결과 매치 0건.
- 토스 패턴 부합: 사용자 이름이 있으면 `${name}님`, 없으면 무인칭 (`RiskScoreHero.tsx:60`).

### 3.9 거품 (끝!/완벽!/최고!)

- **UI 코드**: 0건. PASS.
- Landing의 "5분이면 끝나요"의 "끝나요"는 동사이므로 거품 아님(분리). 그러나 §3.3 광고 위반은 별개.

### 3.10 종합 (Anti-AI-tone)

| 카테고리 | UI 위반 | sanitize 패턴 | 판정 |
|---|---|---|---|
| 과장 형용사 | 0 | 4/4 | PASS |
| 의인화 | 0 | 9/8 | PASS |
| **광고** | **1 (Landing:90)** | 4/3 | **FAIL** |
| **친근체 남용** | **1 (InputInsurance:208)** | 1/1 (prompt) | **FAIL** |
| 자기지칭 | 0 (배지 "AI" 약함) | 3/3 | PARTIAL |
| 이모티콘 자모 | 0 | 8/8 | PASS |
| **데코 아이콘** | **4 (Wallet/ShieldCheck/ListChecks/FileText)** | n/a | **PARTIAL** |
| 2인칭 | 0 | n/a | PASS |
| 거품 | 0 | n/a | PASS |

**총 FAIL 2건 + PARTIAL 2건.** 사용자 명시 요청한 "AI flavor 다 삭제" 기준에 비추어 96~98% 달성. 잔여 2건은 모두 1줄 수정.

---

## 4. 5대 원칙 별 평가

### 원칙 1: 한 화면, 한 생각 (One Screen, One Job)

**평가: A- (Iter 1 D → 큰 도약)**

- **Landing**: 워드마크 → 헤드라인 → 동의 카드 → CTA → footer 한 줄. 화면 하나, 결정 하나(시작 vs 동의). 가이드 §9.1 정확 부합. 점수 95.
- **InputBasic/Health**: 3개 section을 한 페이지에 묶음 (`InputBasic.tsx:174-313` 신상·재무·주거 / `InputHealthLifestyle.tsx:170-340` 신체·의료·생활). 가이드 §9.2 "기본/건강/생활 분리"는 7단계 페이지 분할까지 권고했지만, **3 section 분할 + 한 페이지 wizard step은 토스 신형 패턴(7개를 3개로 통합)**으로 허용 범위. 점수 80.
- **InputFamily**: 한 화면 = 가족력 다중선택 1 결정. 마커 카드 "또는" 구분도 깔끔. 점수 90.
- **InputInsurance**: 한 화면 = 보험 리스트 관리 + 모달로 추가/수정. 1 결정 ↑. 점수 88.
- **Analyzing**: 화면 정중앙 1 요소(스피너 + 메시지). 토스 §9.6 거의 완벽. 점수 95.
- **Result**: 4탭 = 1 화면 1 영역. sticky 탭바, 한 탭에 1 흐름. 점수 85.

**유일한 미흡**: `InputInsurance.tsx:208`·`220` 보험 삭제 다이얼로그가 "삭제 버튼+취소 버튼" 2 결정으로 자라 있음. 토스는 destructive를 빨강이 아니라 **secondary 위치 + ghost 색**으로 처리(`button.tsx:28` destructive variant가 빨강이라 위반은 아님). OK.

### 원칙 2: 여백이 콘텐츠다 (Whitespace as Content)

**평가: B+ (Iter 1 C+ → 개선)**

- **Landing**: `pt-16` (64px) → `mt-12` (48px) → `mt-16` (64px) → `mt-8` (32px). 리듬 좋음. 그러나 콘텐츠 양이 적어 footer 거리감이 살짝 멀게 느껴짐 — Landing은 거의 비어 있는 게 토스다워 OK.
- **InputBasic**: 섹션 카드 사이 `gap-6` (24px), 카드 내부 `mt-5 flex flex-col gap-5` (20/20). 가이드 §4 "카드 내부 섹션 분리: margin-bottom: 20px" 정확 부합. 점수 92.
- **Result**: `gap-4` (16px) 카드 간 — 토스 §8.3 "카드 간 갭 12px (밀착 리스트) 또는 16px". 16px 부합. 그러나 `RiskScoreHero` `mt-5 flex items-center gap-6` (20·24px)는 ScoreDoughnut과 점수가 너무 붙어 있어 보일 위험. ScoreDoughnut size 144px이라 카드 폭 480-48(padding)=432, 도넛 144+gap24+number+badge → 폭이 빡빡. **데스크탑 480px에서 잘 들어가는지 시각 검증 필요**. P2.
- **압축 위반 1건**: `CoverageOverviewCard.tsx:105-109` 3-grid `grid-cols-3 gap-2 text-center` — 8px gap. 가이드 §4 4의 배수이나 `space-2`(8px)는 카드 내부 데이터 단위로 너무 빽빽. 12px(`gap-3`) 권고. P2.

### 원칙 3: 숫자가 주인공 (Numbers Are the Hero)

**평가: A (Iter 1 B- → 큰 개선)**

- **Iter 1의 결정적 위반 (`font-bold`/`.text-score` 700) 모두 해결**. `index.css:217` `.text-score { font-weight: 800 }` ✓. `StatNumber.tsx:61` `font-extrabold` ✓. 모든 result 카드 점수 `font-extrabold` ✓.
- **letter-spacing**: `RiskScoreHero.tsx:86` `letterSpacing: "-0.03em"` 가이드 §3 정확. `RiskFactorCard.tsx:86`·`OutOfPocketCard.tsx:52`·`CoverageOverviewCard.tsx:85` `letterSpacing: "-0.02em"` — `display` 토큰은 -0.03em이라야 하나 본문 헤드라인은 -0.02em OK. **단, 점수 hero "36"은 -0.03em 일관 유지 필요. 현재 RiskScoreHero만 -0.03em, 부 점수는 -0.02em. 의도된 차등.** PASS.
- **단위 표기**: `RiskScoreHero.tsx:90-92` "점" 20px `font-semibold` `text-neutral-700` — 가이드 §8.5 정확 부합. `OutOfPocketCard.tsx:55-57` "만 원" 20px semibold — OK. **그러나 `OutOfPocketCard.tsx:47` "약" prefix가 14px Medium neutral-500로 너무 작음** — 약 5px만 키우면 통일감. P2.
- **숫자 색**: 모두 `text-neutral-900` ✓. 점수에 색 0건. 가이드 §3 정면 부합. PASS.
- **tabular-nums**: 모든 숫자에 명시 ✓. `index.css:212` 글로벌 + 인라인 명시 이중 안전망.

### 원칙 4: 친근하지만 격식 있다 (Casual but Trustworthy)

**평가: A- (Iter 1 B → 개선)**

- **헤드라인**: "보험, 충분한가요." (`Landing.tsx:87`) — 가이드 §9.1 권고문보다 짧고 토스적. 명사형 + 의문문 단호함. PASS.
- **부제**: "5분이면 끝나요." (`Landing.tsx:90`) — Anti-AI 카테고리 위반. §3.3 참조.
- **동의**: "입력한 정보는 이 브라우저에만 저장돼요." (`Landing.tsx:135`) — 가이드 §7 톤 정확 부합. PASS.
- **CTA**: "시작하기" (`Landing.tsx:176`) — 가이드 §9.1 "지금 시작하기"보다 짧음. 토스 디테일로 "시작하기" 단어 자체는 OK이나 가이드 권고문은 동사+부사. **"5분 점검 시작하기"** 정도가 더 토스적. 미흡 1건.
- **빈 상태**: "등록된 보험이 없어요" (`InsuranceEmptyState.tsx:21`) — 가이드 §9.5 "아직 등록된 보험이 없어요"에 가까움. "아직" 한 단어 빠짐. **친근감 -1**. P2.
- **분석 중**: "잠시만요, 분석하고 있어요" + "최대 10초 정도 걸려요" (`Analyzing.tsx:237,242`) — 가이드 §9.6 정확 부합. PASS.
- **결과 해석**: "지금은 낮은 위험이에요" / "보통 위험이에요. 보장 몇 가지를 확인해 두세요" / "높은 위험이에요. 비어 있는 보장부터 확인하세요" (`RiskScoreHero.tsx:42-54`) — 토스 톤 정확 부합. 친근하되 단호. PASS.
- **면책**: "참고용 결과입니다. 특정 상품 가입을 권하지 않아요." (`disclaimers.json:11`) — 가이드 §7 "참고용이에요" 권고문에 비해 약간 격식체 어미("입니다"). 토스 톤 mix-인이라 OK. PASS.
- **AppLayout footer**: "이 결과는 참고만 해주세요. 입력한 정보는 이 브라우저에만 있고 어디로도 안 나가요." (`AppLayout.tsx:40-42`) — Iter 1 비평 권고를 그대로 반영. 친근·단호 균형. PASS.

**잔여 미흡 (P1)**:
- `InputInsurance.tsx:208` "보험을 삭제할까요?" — 친근체 남용 (§3.4).
- `Landing.tsx:90` "5분이면 끝나요." — 광고 (§3.3).
- `InsuranceEmptyState.tsx:21` "등록된 보험이 없어요" — "아직" 추가 (P2).

### 원칙 5: 마찰을 줄여라 (Reduce Friction Relentlessly)

**평가: A- (Iter 1 C → 큰 개선)**

- **단위 슬롯**: `InputBasic.tsx:333-372` `SuffixInput`, `InputBasic.tsx:374-403` `ManWonInput`, `InputHealthLifestyle.tsx:357-388` `SuffixInput`, `InsuranceForm.tsx:300-336` `AmountInput` — 모두 우측 고정 단위 슬롯 구현. 가이드 §8.2 정확 부합. Iter 1 결정적 누락 해결.
- **자동 포커스**: 명시적 `autoFocus` 부재. 토스는 첫 입력칸 자동 포커스. **미흡 (P2)**.
- **debounce localStorage 저장**: 120ms (`InputBasic.tsx:114`, `InputHealthLifestyle.tsx:99`, `InputFamilyHistory.tsx:59`, `InputInsurance.tsx:59`) — 새로고침해도 입력 유지. UX 안전망 OK. PASS.
- **CTA disabled + helper text**: `StepFooter.tsx:61-64` 비활성 시 무엇을 채워야 하는지 자동 안내. 가이드 §9.2 부합. PASS.
- **`missingLabel` 동적 메시지**: `InputBasic.tsx:145-154`, `InputHealthLifestyle.tsx:137-149` — 채워야 할 다음 필드 한 줄 안내. 토스 마찰 감소 패턴. PASS.
- **DesktopOnlyGate**: `DesktopOnlyGate.tsx:31-83` 1024px 미만 차단. **Iter 1 비평이 지적한 마찰 극대화 여전. 미반영**. PC 안내 화면 자체는 친근하나 모바일 사용자는 결국 못 들어옴. 가이드 §4 "모바일: 좌우 padding 20px 고정"이 명시한 모바일 우선 철학과 정반대. P0이나 학부 프로젝트 정책상 의도된 결정일 수 있음 — 시장 진입엔 큰 마이너스이나 점수 -1만 깎음.
- **Consent gate**: `ConsentGate.tsx:25-43` deep-link 보호. UX 안전망 OK. PASS.

---

## 5. 페이지별 비평

### 5.1 Landing (`src/pages/Landing.tsx`, 203줄)

**점수: 88 / 100 (Iter 1 35점 → +53)**

**합격 영역**:
- `Landing.tsx:36` `max-w-[480px]` ✓
- `Landing.tsx:85` h1 `text-3xl font-bold tracking-tight` (32px) ✓ 가이드 §9.1 정확
- `Landing.tsx:87` 헤드라인 "보험, 충분한가요." — 명사형 의문문, 토스적
- `Landing.tsx:114-140` 동의 카드 — `rounded-xl border bg-white p-5`, `border-brand-500` on active. 가이드 §8.3 살짝 위반(rounded-xl=24px이지만 토스 카드 16px), 카드 inner padding 20px → 가이드 24px 살짝 미달. **P1: rounded-lg + p-6.**
- `Landing.tsx:163-180` CTA 영역 — Primary 1개 (size="default" h-14), helper text("동의 후 시작할 수 있어요.") + 면책 한 줄("본 결과는 참고용입니다."). 가이드 §9.1 정확 부합.
- `Landing.tsx:195-200` Footer "금융인공지능실무 학부 프로젝트 · 이준호 · 엄덕현 · 소위륜" — 11px 캡션, 학부 프로젝트임을 명시. **솔직함은 토스적이나 시장 진입에선 마이너스**. 그러나 사용자가 명시 변경 안 했으므로 OK.

**위반 / 미흡**:
- `Landing.tsx:90` **"5분이면 끝나요."** — Anti-AI §3.3 광고. **P0**. 1줄 수정.
- `Landing.tsx:120` 동의 카드 `rounded-xl` (24px) — 가이드 §8.3 카드 16px(rounded-lg). **P1**.
- `Landing.tsx:120` 동의 카드 `p-5` (20px) — 가이드 §8.3 카드 padding 24px(p-6). **P2**.
- `Landing.tsx:132` 체크박스 `mt-0.5` (2px) — 4 배수 아님. 시각적 baseline 정렬용이라 큰 위반 아니나 0건 게이트는 미달. **P2**.
- `Landing.tsx:62` 워드마크 `text-[13px]` — 4 배수 폰트 OK. 토스 §9.1은 워드마크 없이도 OK이나 있어도 OK.
- `Landing.tsx:178` 면책 `text-[11px]` — 가이드 §3 micro 11px 정확 부합. PASS.

**총평**: Iter 1의 SaaS 마케팅 페이지에서 토스 미니멀 랜딩으로 완벽 전환. 5분 문구 + radius 두 군데만 잡으면 95+.

### 5.2 InputBasic (`src/pages/InputBasic.tsx`, 405줄)

**점수: 75 / 100**

**합격 영역**:
- `max-w-[480px]` ✓
- `StepHeader` 스텝 진행률 ✓
- `h2 text-2xl font-bold` (24px) ✓ 가이드 §3 h2
- 세 섹션 (신상·재무·주거) 카드 분리 ✓
- `FieldGroup` 일관 사용, 라벨 13px ✓
- `SuffixInput` "세"·`ManWonInput` "만원" 우측 고정 ✓ 가이드 §8.2 정확
- `formatThousands` 천 단위 콤마 자동 — 토스 마찰 감소
- `SegmentedControl` 성별·부양가족 — 칩 형태 ✓
- `missingLabel` 동적 안내 — "나이는 14에서 99 사이로 입력해요" 톤 정확

**위반**:
- `InputBasic.tsx:175,239,287` **section `rounded-2xl`** (32px) — 가이드 §8.3 카드 16px. **P0**.
- `InputBasic.tsx:175,239,287` raw `<section className="rounded-2xl bg-white p-6 shadow-card">` — Card 컴포넌트(`card.tsx`)가 이미 `rounded-lg + border + shadow-card`로 정착되어 있는데, 페이지는 Card를 안 쓰고 raw markup. 토큰 일관성 깨짐. **P0**: Card 컴포넌트 사용 권고.
- `InputBasic.tsx:290` "(선택)" 표기가 `text-[13px] font-normal text-neutral-500` — OK이나 일관성: `FieldGroup` `optional` prop이 이미 (선택)을 자동 붙임. 중복.
- `InputBasic.tsx:300` SelectTrigger `h-14 text-[17px]` — Select 컴포넌트 default가 `h-14 text-lg`(18px)인데 페이지가 `text-[17px]`로 overwrite. 토스 표준 17~18px 범위라 OK이나 인라인 over-ride는 코드 스멜.
- `InputBasic.tsx:393-401` `BmiReadout` (`InputHealthLifestyle.tsx:390-411` 동일) — `rounded-xl bg-neutral-100 px-4 py-3`. 가이드 §4 카드 내부 박스 16~20px이 표준이라 OK. 그러나 `mt-0.5`(`InputHealthLifestyle.tsx:396`) 2px·`px-2.5`(`:402`) 10px — 4 배수 아님. **P2**.

### 5.3 InputHealthLifestyle (`src/pages/InputHealthLifestyle.tsx`, 415줄)

**점수: 76 / 100**

**합격**: InputBasic과 동일 패턴 일관성. BMI 실시간 계산 + 등급 배지 ✓. "흡연/비흡연" 칩 ✓ (Iter 1 비평 권고 그대로 반영). 음주/운동/수면/스트레스/야근 모두 SegmentedControl 칩. **하지만 운동 칩 4개·수면 칩 3개·야근 칩 3개 = 가이드 §9.3 "주 1~2회/주 3~4회/주 5회 이상" 3 칩 권고 살짝 초과.** OK 범위.

**위반**:
- `InputHealthLifestyle.tsx:171,197,256` **section `rounded-2xl`** — 같은 위반. **P0**.
- `InputHealthLifestyle.tsx:393` `BmiReadout` `rounded-xl bg-neutral-100 px-4 py-3` — `rounded-xl` 24px는 가이드 §4 카드 내부 박스로 약간 큼. 16px(rounded-lg)이 적정. **P2**.
- `InputHealthLifestyle.tsx:396,402` `mt-0.5`·`px-2.5` — 4 배수 아님. **P2**.

### 5.4 InputFamilyHistory (`src/pages/InputFamilyHistory.tsx`, 206줄)

**점수: 78 / 100**

**합격**: 2x3 + 1x2 그리드 — 가이드 §9.4 "체크박스 그리드는 토스 위반"인데 **칩 타일 형태**로 구현해 위반 회피. 각 타일 104px height, 본문+힌트 2줄, 선택 시 brand-50 배경+brand-500 보더. 가이드 §9.4 정확 부합. "또는" 구분으로 마커 카드 격리. 깔끔.

**위반**:
- `InputFamilyHistory.tsx:177` **`rounded-2xl`** 타일 — 같은 위반. **P1**(타일이 인터랙티브라 카드만큼 강하지 않음). `rounded-lg`(16px) 또는 `rounded-md`(12px) 권고.
- `InputFamilyHistory.tsx:176` `h-[104px]` — 토큰화되지 않은 magic number. 가이드 §4 "4 배수" — 104 OK. **단, 토큰화 권고**. P2.
- `InputFamilyHistory.tsx:104` "부모·형제자매 기준. 해당하는 항목을 모두 선택해요." — 가이드 §9.4 권고문 "부모님이나 형제자매 중에 다음 질환을 가진 분이 있나요?"보다 짧고 명확. **개선**. PASS.

### 5.5 InputInsurance (`src/pages/InputInsurance.tsx`, 238줄)

**점수: 73 / 100**

**합격**:
- 빈 상태 (`InsuranceEmptyState`) 가운데 정렬 + Ghost CTA ✓ 가이드 §9.5
- `AnimatePresence` 카드 등장/삭제 애니메이션 (`durations.base`=220ms) ✓
- "+ 보험 추가" ghost variant dashed border ✓ 토스 패턴
- 보험 카드 (`InsuranceCard.tsx`) 한 카드 1 보험 정보 ✓
- 보험 추가/수정 Dialog ✓
- "비워둬도 다음으로 넘어갈 수 있어요." (`InputInsurance.tsx:165`) — 토스 마찰 감소 톤
- `nextLabel="분석 시작"` — 가이드 §7 "분석 시작하기"에 거의 부합

**위반**:
- `InputInsurance.tsx:208` **"보험을 삭제할까요?"** — Anti-AI §3.4 친근체 남용. **P0**.
- `InputInsurance.tsx:206` `sm:max-w-[400px]` — 모달 폭 400px. 가이드 §4 480px 일관 권고이나 모달 폭은 페이지 폭과 별도 — OK.
- `InsuranceCard.tsx:54` `rounded-2xl` (32px) — focus-visible용 hit area라 invisible. 시각 영향 0이라 P2.
- `InsuranceCard.tsx:101-102` 삭제 버튼 `h-9 w-9` (36px) — 가이드 §8.1 icon 56px (h-14). 미달. 그러나 카드 내 보조 액션이라 OK 범위.
- `InsuranceEmptyState.tsx:21` "등록된 보험이 없어요" — "아직" 빠짐. 가이드 §9.5 권고 "아직 등록된 보험이 없어요"가 더 친근. **P2**.

### 5.6 Analyzing (`src/pages/Analyzing.tsx`, 298줄)

**점수: 92 / 100 (Iter 1 0 → 가장 완성도 높음)**

**합격 (가이드 §9.6 거의 완벽)**:
- 화면 정중앙 단 하나의 요소 ✓ `flex-1 flex flex-col items-center justify-center`
- 48px 회전 스피너 (`Analyzing.tsx:199-233`) ✓ 가이드 §9.6 정확
- `h3 text-2xl font-bold tracking-tight text-neutral-900` "잠시만요, 분석하고 있어요" (`:237`) ✓ 가이드 권고문 정확
- 13px caption "최대 10초 정도 걸려요" (`:241`) ✓ 가이드 권고문 정확
- 1.5초 메시지 rotation 4개 (`PROGRESS_MESSAGES`) ✓ 가이드 권고
- fade-cross 200ms (`durations.base`) ✓
- Indeterminate shimmer bar ✓ 가이드 §9.6 "ProgressBar는 indeterminate 패턴"
- prefers-reduced-motion 처리 — spinner/shimmer/메시지 rotation 모두 disable, single "분석 중이에요" ✓ 우수
- 하단 CTA 없음, 취소 버튼 없음 ✓ 가이드 §9.6 정확
- 3초 minimum delay ✓ UX 신뢰감
- profile 미존재 시 `/input/basic` redirect ✓

**미흡**:
- `Analyzing.tsx:199` `h-12 w-12` — 48px. 가이드 §9.6 정확. OK. 단, motion.div가 spinner svg를 wrap하면서 outer `h-12 w-12` + inner `h-12 w-12` 이중지정. 시각 영향 0.

### 5.7 Result 4탭 (`src/pages/Result.tsx`, 337줄)

**점수: 85 / 100 (Iter 1 0 → 새로 완성)**

**탭 시스템**:
- `ResultTabs.tsx` 4탭 (대시보드·상세·리포트·체크) ✓
- sticky `top-[60px]` ✓ DisclaimerBanner 아래
- `tabs.tsx:40` neutral-900 흑백 indicator ✓ 가이드 §8.4 정확
- 가이드 §9.7 정면 부합

**Dashboard 탭**:
- `RiskScoreHero` 점수 48px Extrabold + 도넛 + 밴드 배지 ✓ 가이드 §9.7 정확
- `RiskBreakdownBars` 4축 (건강/생활/직업/재무) chart.js 8px 두께 ✓
- `CoverageOverviewCard` 보장 적합도 % + 진행률 + 3-grid 카운트
- `OutOfPocketCard` 예상 자기부담액 — 한 카드 1 사실

**Detail 탭**:
- 4개 `RiskFactorCard` (건강/생활/직업/재무) ✓
- 각 카드 = 1 요인, 점수 + 밴드 + 한 줄 해석 + "왜 이런 점수인지" 토글
- 토글 펼침 220ms (`RiskFactorCard.tsx:136`) ✓
- 가이드 §9.7 "카드 안에 요인명 h3 + 한 줄 설명 + 왜 이런 결과인지 토글" 정확 부합

**Report 탭**:
- `ReportTab.tsx` 로딩 상태 → 본문 → 면책 분리
- `withDisclaimer()` (`:39-43`) — 면책 강제 부착
- `splitReport()` (`:57-79`) — body / disclaimer 분리 렌더
- `DisclaimerBanner` (sticky) + `withDisclaimer()` (LLM 출력 면책 보강) + `splitReport()` (면책 별도 typography) = **면책 3중 안전망** ✓ 가이드 §7 부합

**Checklist 탭**:
- 약점 보장 → "이번 주" 액션, 주의 보장 → "다음 분기" 액션
- "이번 분기"가 아니라 **"다음 분기"** — 미세 차이 (가이드 권고 "이번 주/이번 달"에서 "이번 달"이 "다음 분기"로 길어짐). 토스 톤에선 "이번 달" / "이번 주" 같이 짧은 시간단위가 더 강력하나 OK 범위.
- 체크박스 ✓ + strikethrough 150ms (`ChecklistTab.tsx:205-208`) ✓ 가이드 §9.7
- localStorage persist ✓

**위반 / 미흡**:
- `Result.tsx:264-274` 대시보드 `<Card className="p-6">` 안에 `<RiskBreakdownBars>` 차트 → 카드 내부 padding 24px. OK.
- `Result.tsx:265-271` 카드 머리 "요인별 신호" + 차트 = 1 카드 1 사실 패턴 살짝 어색 (사실은 4개). §8.3 위반.
- `Result.tsx:248-250` 헤더 우상단 "입력 완성도 {N}%" — 메타 정보. 토스는 메타를 헤더에 잘 안 둠. **P2**: 푸터 or `RiskScoreHero` 안으로.
- `RiskScoreHero.tsx:79` `gap-1.5`(6px) — 4 배수 아님. 토스 baseline alignment 보정용. 가이드 §4 위반. **P2**.
- `RiskScoreHero.tsx:39-55` `bandStyle` 인라인 hex 색 (`#0F8C6A`, `#B45309`, `#C0303B`) — 토큰 미정의 색. `index.css`에 `--color-success-700`(#047857) 다른 hex 정의. **토큰 vs 인라인 불일치**. 토큰 사용 권고. **P1**.
- `RiskScoreHero.tsx:39` `badgeBg: "rgba(0, 200, 150, 0.12)"` — alpha hex 인라인. `bg-semantic-success/10` 같이 Tailwind alpha 유틸 권고. **P1**.
- `CoverageOverviewCard.tsx:120-123` `toneColor` 인라인 hex — 같은 문제.
- `RiskFactorCard.tsx:45-47` `bandStyle` 인라인 hex — 같은 문제.
- `OutOfPocketCard.tsx:24` `outOfPocket.displayText.match(/약\s*([\d,]+)만\s*원/)` — 정규식 파싱이 brittle. format 변경 시 silent fail. **P2**: `displayAmount` 직접 사용 권고.
- `ReportTab.tsx:138` `report.source === "codex" ? "AI" : "요약"` 배지 — "AI" 라벨 (§3.5 partial). **P2**.

### 5.8 NotFound (`src/pages/NotFound.tsx`)

**점수: 70 / 100**

- `text-3xl font-bold` h1 ✓
- "페이지를 찾을 수 없어요" — 톤 OK
- "주소가 잘못 입력되었거나 더 이상 존재하지 않는 페이지예요. 처음 화면으로 돌아가 다시 진단을 시작해 주세요." (`:18-21`) — 정중하나 살짝 길다. **"주소가 잘못됐어요. 처음으로 돌아가세요."** 정도가 토스적. P2.
- `rounded-xl bg-brand-500` 처음으로 버튼 `h-12 px-6` — 가이드 §8.1 height 56px(h-14). 미달. P1.
- "다시 진단을 시작해 주세요" — "다시"·"진단" — 마이너 톤. OK.

---

## 6. 컴포넌트 시스템 정합성

### 6.1 UI Primitives

| 컴포넌트 | 점수 | 핵심 발견 |
|---|---|---|
| Button | 78 | radius `rounded-xl`(24px) → 12px(`rounded-md`) 권고 (P0). variant lg(`h-16`) 미사용 잔재. destructive OK (토큰 정의됨). |
| Input | 70 | radius `rounded-xl`(24px) → 12px(`rounded-md`) 권고 (P0). focus 시 `border-2` 두께 변화 미구현 (가이드 §8.2). state success/error 토큰 OK. |
| Card | **92** | `rounded-lg border border-border shadow-card p-6` ✓ — 가이드 §8.3 거의 완벽. mb-5/mt-5 ✓. **Iter 1 P0 해결.** |
| Badge | 82 | semantic 토큰 정의 후 정상 작동. `h-7 px-3`(default) 가이드 §8.4(B) `h-9 px-3.5`(36px) 미달이나 토스 신형 패턴 허용. **칩 패턴 OK.** |
| Tabs | **90** | indicator `bg-neutral-900` ✓ 흑백 대비. **Iter 1 #15 해결.** 잔여: `after:h-0.5`(2px hack 1px), `py-3` 12px OK. |
| Progress | 80 | h-2 (8px) + brand-500 + 300ms ease-out. 가이드 §6 "600ms"보다 빠르나 wizard ProgressBar라 OK. |
| Dialog | 88 | `rounded-[20px]` arbitrary로 정확 20px ✓ (`--radius-modal: 20px` 토큰화도 가능했으면 좋았음). shadow-modal ✓. **Iter 1 rounded-3xl 해결.** |
| Toast | 85 | `rounded-lg` ✓, `shadow-card-hover` 토스트엔 살짝 강함 (modal보다 약하지만 toast는 elev-2 권고). border-success-200/danger-200 토큰 정의 후 정상. |
| Checkbox | 88 | `h-6 w-6 rounded-md border-2` ✓ |
| RadioGroup | 75 | 점 라디오만 제공, 카드형 라디오 미구현. 그러나 SegmentedControl/ConditionTile이 사실상 라디오 카드 대체. OK. |
| Select | 78 | trigger `rounded-xl` → 12px 권고 (P0). SelectContent `rounded-lg shadow-modal` ✓. SelectItem hover/checked ✓. |
| StatNumber | **92** | `font-extrabold` + `tabular-nums` + `tracking-tight` ✓. **Iter 1 800 weight 해결.** unit `font-semibold` ✓. trend 색 토큰 정의됨. |

### 6.2 Layout

- `AppLayout` 92 — footer 친근체 ✓
- `ConsentGate` 90 — `<Navigate replace />` 안전망 ✓
- `DesktopOnlyGate` **55** — 모바일 차단 정책 미반영. P0이나 학부 프로젝트 정책상 의도된 결정.
- `PageTransition` 88 — reduced-motion ✓, duration 가이드 부합

### 6.3 Wizard

- `FieldGroup` 90 — 라벨 13px + helper 12px + error 12px semantic-danger ✓
- `SegmentedControl` 88 — min-h-56px 칩, 선택 시 brand-50 배경 + brand-500 보더 ✓ 가이드 §8.2
- `StepHeader` 85 — sticky + Progress bar + back button. `h-1.5`(6px) 4 배수 아님. P2.
- `StepFooter` 92 — fixed 하단, Primary 1개 + ghost back, helper text. 가이드 §9.2 정확

### 6.4 Insurance

- `InsuranceCard` 80 — 한 카드 한 보험 ✓. focus hit area `rounded-2xl` (시각 영향 0)
- `InsuranceForm` 85 — coverage type별 input mode 분기, suffix 단위 슬롯 ✓
- `InsuranceEmptyState` 85 — 가운데 정렬 + Ghost CTA. "아직" 빠짐.

### 6.5 Result

- `RiskScoreHero` 88 — 가이드 §9.7 정확. 잔여: `gap-1.5`, 인라인 hex
- `CoverageOverviewCard` 80 — 한 카드 4 사실 (퍼센트+막대+3-grid) — §8.3 살짝 위반
- `CoverageItemRow` 88 — 라벨+값+막대 깔끔
- `OutOfPocketCard` 85 — 한 카드 1 사실 ✓. 정규식 파싱 brittle
- `RiskFactorCard` 90 — 1 카드 1 요인 + 토글 ✓. 인라인 hex
- `ChecklistTab` 88 — strikethrough 150ms ✓, localStorage persist ✓
- `ReportTab` 92 — 면책 3중 안전망 ✓
- `DisclaimerBanner` 90 — sticky `bg-neutral-100` + Info 아이콘 + 면책 텍스트
- `ResultTabs` 90 — sticky 탭바, flex-1 trigger

### 6.6 Charts

- `CoverageBar` 90 — 8px 두께, success/warn/danger 토큰, 600ms easeOutQuart ✓
- `RiskBreakdownBars` 85 — chart.js horizontal bar, 600ms 애니메이션, 8px 두께, brand-500 ✓. 4축 동시 = 1 카드 4 사실로 §8.3 살짝 위반.
- `ScoreDoughnut` 88 — 12% cutout 두께, brand 색 + neutral-100 track, 600ms ✓

---

## 7. 마이크로카피 일관성 매트릭스

| 페이지 | 헤더 톤 | 라벨 톤 | CTA 톤 | 면책 톤 | 평가 |
|---|---|---|---|---|---|
| Landing | "보험, 충분한가요." (명사형 의문, 32px) | n/a | "시작하기" (단순) | "본 결과는 참고용입니다." (11px) | **B+** (5분 광고 +1 미흡) |
| InputBasic | "기본 정보" (24px 명사형) | "이름·나이·성별·직업군·월 소득·월 고정 지출·비상금·부양가족·거주 형태" 일관 명사 | "다음" (단순) | 페이지 footer | **A-** |
| InputHealth | "건강 · 생활" (점 구분자) | "키·몸무게·흡연·음주·운동·평균 수면·스트레스·야근" 명사형 일관 | "다음" | 페이지 footer | **A** |
| InputFamily | "가족력" (24px) + "부모·형제자매 기준" 부제 | "암·고혈압·당뇨·심장 질환·뇌혈관 질환·치매·해당 없음·모름" 명사 | "다음" | "가족력은 의료비 예측의 참고 지표이며, 진단을 대체하지 않습니다." (12px) | **A** |
| InputInsurance | "가입 보험" (24px) + "없으면 비워둬도 괜찮아요." 부제 | "보장 유형·보험사·상품명·월 보험료" 일관 | "분석 시작" | "보험상품 추천이 아닙니다." | **A-** (다이얼로그 할까요 -1) |
| Analyzing | "잠시만요, 분석하고 있어요" (24px) | "건강 신호 계산중·..." rotation | n/a | n/a | **A** |
| Result | "결과" (24px) | "위험 점수·요인별 신호·보장 적합도·예상 자기부담액·건강/생활/직업/재무 신호·체크리스트·리포트" 일관 명사 | n/a (탭 컨테이너) | DisclaimerBanner + footer | **A-** |
| NotFound | "페이지를 찾을 수 없어요" (32px) | n/a | "처음으로" | n/a | **B** (긴 본문 미흡) |

**전체 카피 일관성: A-**. 헤더는 24px 명사형 + 부제 15px neutral-600 패턴이 일관. 라벨은 13px medium neutral-700. helper text는 12px neutral-500. CTA "다음" 일관. "분석 시작" 마지막 단계 변형 OK. 토스 카피 룰 §7 거의 정면 부합. 잔여 미흡 2-3건.

---

## 8. LLM 리포트 검증

### 8.1 codex-server.ts 프롬프트 (7개 룰 + 보조)

**평가: A-**

`tools/codex-server.ts:182-219` `buildPrompt()` 분석:

1. **언어 + 톤 명시** (`:187-188`) — "Toss style" 명시. PASS.
2. **격식 mix-in** (`:190`) — "~예요/이에요" + "~합니다" 혼용 허용. **유연성 우수.** PASS.
3. **FORBIDDEN phrases** (`:191-199`) — 인사/의인화/질문체/과장/세일즈/자기지칭/이모지/자모 — **8 카테고리 모두 명시.** Anti-AI-tone 9 카테고리 중 "데코 아이콘"·"2인칭"은 LLM과 무관. **완전.**
4. **구조 강제** (`:200-205`) — 3~5 문단, 문단 사이 빈 줄. 마지막 면책 줄 verbatim. **명확.**
5. **회피 목록** (`:206-210`) — 불릿/번호/마크다운/입력 외 정량/보험사명/가입 권유 금지. **상품 광고 차단.**
6. **숫자 형식** (`:211`) — "36점", "55%", "270만 원" 아라비아 숫자. PASS.
7. **길이** (`:212`) — 200~350자. **간결.**

**미흡**:
- 룰 4의 면책 "토씨 하나 바꾸지 말 것" — LLM이 어쨌든 가끔 바꿈. `normalizeReportText()` (`:241-247`)와 `withDisclaimer()` (`ReportTab.tsx:39-43`)가 보강. 3중 안전망 ✓.
- "Output ONLY the report text. No preface, no postface" (`:214`) — 프리앰블 차단. PASS.

### 8.2 sanitizeReport() FORBIDDEN_PATTERNS (34개)

**평가: A-** (Iter 1 미존재 → 새로 구현)

`src/lib/report/llm.ts:95-136` 분석:

| 카테고리 | 패턴 수 | 평가 |
|---|---|---|
| 인사 (안녕하세요/안녕하십니까/반갑습니다) | 3 | PASS |
| 약속·의인화 (도와드리/지켜드리/응원/함께해/함께시작/함께시작해봐요) | 9 | **변형 다 잡음.** PASS |
| 세일즈 (단 5분이면/지금 바로/지금 가입하세요/무료로) | 4 | PASS. **"5분이면 끝나요"는 정규식 매치 안 됨** (Landing UI에 살아남) |
| 자기지칭 (저희 RiskFit은/저희가/AI가 분석한) | 3 | PASS |
| 과장 형용사 (스마트한/혁신적인/탁월한/완벽한) | 4 | **변형 누락**: "효과적인·체계적인·강력한·놀라운·뛰어난·간편한·간단한·확실한" |
| 이모지 (Unicode 3 range) | 3 | PASS |
| 자모 (ㅎㅎ/ㅠㅠ/ㅜㅜ/^_^/^^/:)/:(/;)/<3) | 8 | PASS |
| **합계** | **34** | |

**누락된 변형 (Iter 4 권고)**:
```js
[/(효과적인|체계적인|강력한|놀라운|뛰어난|간편한|간단한|확실한|특별한) /g, ''],
[/(친절한|꼼꼼한|섬세한|똑똑한|정교한) /g, ''],
[/(라이브|실시간|단계별) /g, ''],  // 광고체 prefix
[/(놀랍게도|꼭|반드시|당연히)[\s,]/g, ''],
[/(체크해보세요|살펴봐요|확인해봐요|시작해봐요)/g, ''],  // ~봐요 친근체
```

또한 **2인칭/데코 등은 LLM과 무관**해 안전.

### 8.3 폴백 템플릿 (Kim Minji)

**평가: A**

`src/lib/report/template.ts:20-76` `buildTemplateReport()` 샘플 출력 추론:

입력: profileSummary { name: "민지", age: 27 }, riskScore { total: 36, band: "low", health: 32, lifestyle: 40, job: 28, finance: 36 }, coverageFit { overall: 55, bandLabel: "주의", weakCoverages: ["사망"], cautionCoverages: ["암 진단비"] }, expectedOutOfPocket: 2_700_000.

```
민지님의 전체 리스크 점수는 36점으로 낮음 수준이에요.

세부 영역 중 생활 습관이 40점, 재정 안전이 36점으로 가장 높아요.

보장 적합도는 55%로 주의 수준이에요. 표준 대비 부족한 보장은 사망이에요.

질병으로 7일 입원할 경우 예상 자기부담액은 약 270만 원이에요.

본 결과는 특정 보험상품 추천이 아니라 현재 보장 상태를 이해하기 위한 참고 정보입니다.
```

**평가**:
- "민지님의" — `${name}님의 ` (`:28`) 자연스러운 호칭. PASS.
- "낮음 수준이에요" — 한국어로 살짝 어색. "낮은 수준이에요" 또는 "낮은 편이에요"가 자연스러움. **bandLabel을 직접 갖다 붙이면 "낮음/보통/높음"이 그대로 어미 앞에 옴.** P2: `Result.tsx:83-85`의 "낮은 편이에요" 패턴 적용 권고.
- "세부 영역 중 생활 습관이 40점, 재정 안전이 36점으로 가장 높아요." — 자연스러움. PASS.
- "표준 대비 부족한 보장은 사망이에요." — "사망 보장이에요"가 자연스러움. **단 한 단어 차이로 카피 어색.** P2.
- "약 270만 원이에요" — `expectedOutOfPocketText` 그대로 사용. 단위 자연스러움. PASS.
- "본 결과는..." 면책 verbatim. PASS.

**총평**: 핵심 정보 전달 + 토스 톤 일관. 1-2 어휘 다듬으면 사람이 쓴 것과 구별 불가능.

### 8.4 ReportTab 면책 3중 안전망

**평가: A** (Iter 1 미존재 → 새로 구현)

- **1차**: `template.ts:73` `paragraphs.push(REPORT_DISCLAIMER)` — 폴백은 항상 면책으로 끝남. 결정적.
- **2차 (LLM 출력 보강)**: `codex-server.ts:241-247` `normalizeReportText()` — clipped + 면책 append. LLM이 면책 빼먹어도 보강.
- **3차 (클라이언트 최종)**: `ReportTab.tsx:39-43` `withDisclaimer()` — text.trim().endsWith(REPORT_DISCLAIMER) 아니면 강제 append. 그리고 `splitReport()` (`:57-79`)가 body / disclaimer 분리해 별도 typography로 렌더 (`:150-152` `text-xs leading-relaxed text-neutral-500`).

**검증**: 세 군데 어느 하나가 실패해도 면책은 100% 노출. 토스 §7 면책 가이드 정확 부합. **시장 진입 합격.**

추가 안전망:
- `DisclaimerBanner` (`Result.tsx:253`) — 모든 탭 상단 sticky로 결과 면책 노출. 4중.

---

## 9. 남은 우선순위 권고 (Iteration 4 candidates)

### P0 (시장 진입 막는 문제) — 4건

**P0-1**: `Landing.tsx:90` "5분이면 끝나요." 광고 톤 제거
- **수정**: "30초면 충분해요." 또는 "몇 분이면 끝나요." 또는 가이드 §9.1 권고문 "건강 신호를 30초 만에 확인하세요"로 헤드라인 흡수.
- 영향: Anti-AI §3.3 위반 해소. 사용자 명시 요청 마지막 1건.

**P0-2**: `InputInsurance.tsx:208` "보험을 삭제할까요?" 친근체 남용 제거
- **수정**: `<DialogTitle>이 보험을 삭제할게요</DialogTitle>` 또는 `<DialogTitle>보험 삭제</DialogTitle>`. Description은 "입력한 보장 정보가 사라집니다. 다시 등록할 수 있어요." 유지.
- 영향: Anti-AI §3.4 위반 해소.

**P0-3**: Input 4페이지 7개 section `rounded-2xl` → `rounded-lg`
- **수정 위치**: `InputBasic.tsx:175,239,287`, `InputHealthLifestyle.tsx:171,197,256`, `InputFamilyHistory.tsx:177` (또는 Card 컴포넌트 사용으로 전환).
- 가장 토스적인 수정: raw `<section className="rounded-2xl bg-white p-6 shadow-card">` → `<Card>`. radius 16px + border + shadow 자동.
- 영향: 가이드 §8.3 카드 표준 일관성 회복. 18-point #13 완전 PASS.

**P0-4**: Button/Input/Select radius `rounded-xl` (24px) → `rounded-md` (12px)
- **수정 위치**: `button.tsx:10`, `input.tsx:26`, `select.tsx:19`.
- DESIGN_TOKENS.md §4와 TOSS_DESIGN_AUDIT.md §8.1·§8.2 둘 다 12px이라 명시. radius-md 토큰 이미 정의됨 (`index.css:139,140`).
- 영향: 입력 폼 + 버튼 일관 12px. 토스 미감 핵심.

### P1 (개선) — 5건

**P1-1**: `Landing.tsx:120` 동의 카드 `rounded-xl p-5` → `rounded-lg p-6`
- 카드 표준 통일.

**P1-2**: result 카드들 인라인 hex (`#0F8C6A`, `#B45309`, `#C0303B`, `rgba(0, 200, 150, 0.12)` 등) → semantic 토큰
- 위치: `RiskScoreHero.tsx:39-55`, `CoverageOverviewCard.tsx:120-123`, `RiskFactorCard.tsx:45-47`.
- 권고: `bg-success-50 text-success-800` 같이 alpha 변형 또는 Badge variant 활용.

**P1-3**: `NotFound.tsx:24` "처음으로" 버튼 `h-12` → `h-14` (56px)
- 가이드 §8.1.

**P1-4**: Input focus 시 `border-2` 두께 변화
- 위치: `input.tsx:26-32` — 현재 1px border가 색만 변경. 가이드 §8.2 "Focus 보더 2px solid `--blue-500` (120ms 전환)".
- 패턴: `focus:border-2 focus:px-[15px]` (두께 +1px 보정).

**P1-5**: sanitizeReport patterns에 과장 형용사 변형 추가
- 위치: `src/lib/report/llm.ts:119-122`.
- 추가: `효과적인·체계적인·강력한·놀라운·뛰어난·간편한·간단한`.

### P2 (선택적 향상) — 7건

**P2-1**: Result 카드 4개 헤더 데코 아이콘 (`Wallet`, `ShieldCheck`, `ListChecks`, `FileText`) 제거
- 토스 결과 화면은 라벨 텍스트로만. 미니멀 강화.

**P2-2**: `InsuranceEmptyState.tsx:21` "등록된 보험이 없어요" → "아직 등록된 보험이 없어요"
- 가이드 §9.5.

**P2-3**: `gap-1.5` 7건 (RiskScoreHero·OutOfPocketCard·CoverageOverviewCard·RiskFactorCard 각 1건) → `gap-2`(8px) 또는 텍스트 baseline 정렬 재설계
- 4 배수 0건 게이트 달성.

**P2-4**: `mt-0.5`, `px-2.5`, `h-1.5` 등 4건 → 가까운 4 배수
- 위치: `DisclaimerBanner.tsx:40`, `Landing.tsx:132`, `InputHealthLifestyle.tsx:396,402`, `StepHeader.tsx:74`.

**P2-5**: `template.ts:30` "낮음 수준이에요" → "낮은 편이에요" 같이 어미 자연스럽게
- 카피 다듬기.

**P2-6**: `template.ts:55` "부족한 보장은 사망이에요" → "부족한 보장은 사망 보장이에요"
- 어휘 자연스러움.

**P2-7**: `RiskScoreHero.tsx:60` `userName`이 있을 때 일관 표시 검증
- 현재 `${name}님 위험 점수` → 가이드 §3 "위험 점수" 라벨 후 점수. 미세 차이.

### P3 (정책 결정) — 1건

**P3**: `DesktopOnlyGate` 모바일 차단 정책 재검토
- 토스 모바일 우선 철학과 정반대. 시장 진입 시 -10 시그널.
- 학부 프로젝트 정책상 의도된 결정일 수 있어 보수적 P3.
- 권고: 768px까지 반응형 또는 모바일 안내 다운그레이드.

---

## 10. 결론 — 추가 Iteration 필요 여부

### 점수: **84 / 100**
### 시장 진입 가능 여부: **조건부 YES**

**판정**: P0 4건만 처리하면 시장 진입 가능. Iteration 4를 **소규모 (1-2명, 1일)** 권장.

P0 처리 시 예상 점수: **91+**.

### 다음 라운드 5인 영역 권고 (Iteration 4)

P0 4건이 모두 1-3줄 수정이라 5인 분산은 과함. **2인 1일이면 충분**:

- **Agent Q (마이크로카피)**: P0-1 (Landing "5분이면 끝나요"), P0-2 (Insurance "할까요"), P2-2·P2-5·P2-6 (카피 다듬기), P1-5 (sanitizer 변형). 1시간.
- **Agent R (토큰 정합성)**: P0-3 (Input section radius 일괄 교체 → Card 컴포넌트 사용), P0-4 (Button/Input/Select radius 12px), P1-1·P1-2·P1-3·P1-4 (radius·인라인 hex·NotFound 버튼·focus 두께), P2-1 (Result 데코 아이콘 제거), P2-3·P2-4 (gap-1.5·mt-0.5 일괄 교체). 4-5시간.

처리 후 회귀 검증:
1. 18-point 0건 위반
2. Anti-AI-tone 9 카테고리 0건 위반
3. 토큰 일관성 (radius 16px / 12px / 20px)
4. grep 부록 A 명령어 0건 매치

### 후속 비평 게이트

Iter 4가 끝나면 비평자는 다음 grep 명령어로 셀프체크:

```bash
# 18-point #7: 4 배수 아닌 spacing — 0건
grep -rnE "(gap|mt|mb|ml|mr|p|px|py)-([0-9]+\.5)" src/pages/ src/components/

# Anti-AI §3.3: 광고 — 0건
grep -rnE "(단? ?5분이면|지금 바로|무료로)" src/pages/ src/components/

# Anti-AI §3.4: 친근체 남용 — 0건
grep -rnE "(할까요|해볼까요|해보실래요|해봐요)" src/pages/ src/components/

# 카드 radius — rounded-2xl 0건
grep -rnE "rounded-(2xl|3xl)" src/pages/ src/components/ | grep -v "focus-visible\|hit-area"

# 입력 폼 radius — rounded-xl 0건 (Card는 OK)
grep -rnE "rounded-xl" src/components/ui/button.tsx src/components/ui/input.tsx src/components/ui/select.tsx
```

모두 0건이면 시장 진입 합격.

---

## 부록 A: 자동 검증 grep 명령어 모음

다음 라운드 에이전트가 self-check 할 수 있도록 모음.

```bash
# === 18-point Audit ===
# #3: 버튼 height 56px 미만 변형이 풀와이드 CTA에 쓰이는지
grep -rnE "Button.*size=\"sm\".*fullWidth" src/
# #4: pill 버튼 (Badge 제외)
grep -rnE "Button.*rounded-full|button.*rounded-full" src/
# #5: 강한 그림자
grep -rnE "shadow-(lg|xl|2xl|3xl)" src/
# #6: 점수 숫자에 색
grep -rnE "text-(brand|success|warn|danger)-[0-9]+.*tabular-nums|tabular-nums.*text-(brand|success|warn|danger)" src/components/result/ src/components/ui/StatNumber.tsx
# #7: 4 배수 아닌 spacing
grep -rnE "(gap|mt|mb|ml|mr|p|px|py|pt|pb|pl|pr|size|h|w)-([0-9]+\.[0-9]+)" src/ | grep -v vite.svg | grep -v "rounded-1.5\|leading-1\." | grep -v "^Binary"
# #8: 미정의 토큰 (자체 검증)
grep -rnE "bg-(success|warn|danger)-(50|100|200|300|400|500|600|700|800|900)|text-(success|warn|danger)-(50|100|200|300|400|500|600|700|800|900)" src/ | head -5  # 토큰 정의 후 OK
# #9: 검정 / 흰 위 흰
grep -rnE "text-black|bg-black|#000\b" src/
# #10/11: placeholder를 라벨 대신 사용 — Input의 placeholder가 라벨로 쓰이는지
grep -rnE "placeholder=\"[^\"]{5,}\"" src/pages/ | grep -v "예:"
# #14: 모션 duration > 400ms 또는 < 100ms
grep -rnE "duration: *0\.[5-9]|duration: *0\.0[0-9]" src/
# #15: 탭에 brand 색
grep -rnE "after:.*bg-brand-[0-9]+" src/components/ui/tabs.tsx
# #17: 폭 480px 초과
grep -rnE "max-w-\[(5[0-9]{2}|[6-9][0-9]{2}|1[0-9]{3,})px\]" src/

# === Anti-AI-tone 9 카테고리 ===
# §3.1 과장 형용사
grep -rnE "(스마트한|혁신적인|탁월한|완벽한|효과적인|체계적인|강력한|놀라운|뛰어난|특별한)" src/pages/ src/components/
# §3.2 의인화
grep -rnE "(함께해요|함께 시작|도와드려|도와드릴|지켜드려|지켜드릴|응원해|응원할|챙겨드릴)" src/pages/ src/components/
# §3.3 광고
grep -rnE "(단? ?5분이면|지금 바로|지금 가입|무료로|놀랍게도|꼭 필요)" src/pages/ src/components/
# §3.4 친근체 남용 (질문체 권유)
grep -rnE "(할까요\\?|해볼까요\\?|해보실래요\\?|해봐요)" src/pages/ src/components/
# §3.5 자기지칭
grep -rnE "(저희 RiskFit|저희가|AI가 분석)" src/pages/ src/components/
# §3.6 이모지 / 자모
grep -rnE "(ㅎㅎ|ㅠㅠ|ㅜㅜ|\\^_?\\^|:\\)|:\\(|;\\))" src/pages/ src/components/
# §3.7 데코 아이콘 (정보 전달 외 lucide)
grep -rnE "import.*\\{.*(Sparkles|Heart|ThumbsUp|Smile|PartyPopper|Star|Trophy|Award).*\\}.*lucide" src/
# §3.8 2인칭
grep -rnE "(당신의|당신은|당신만)" src/pages/ src/components/
# §3.9 거품
grep -rnE "(끝!|완벽!|최고!|짠!)" src/pages/ src/components/

# === 컴포넌트 정합성 ===
# Card radius (rounded-2xl/3xl 0건)
grep -rnE "rounded-(2xl|3xl)" src/pages/ src/components/ | grep -v "focus\|hit\|absolute inset"
# 입력 폼 radius (rounded-md만 OK)
grep -rnE "rounded-xl" src/components/ui/button.tsx src/components/ui/input.tsx src/components/ui/select.tsx
# Card 컴포넌트 사용 권장 — raw section 카드 0건
grep -rnE "<section className=\"rounded" src/pages/

# === 면책 안전망 검증 ===
grep -n "withDisclaimer\|splitReport\|REPORT_DISCLAIMER\|sanitizeReport" src/components/result/ReportTab.tsx src/lib/report/

# === 토큰 일관성 ===
# 인라인 hex 사용
grep -rnE "(#[0-9A-F]{6}|#[0-9A-F]{3})" src/components/result/ | head -20
# rgba inline alpha
grep -rnE "rgba\\(" src/components/result/ | head
```

---

## 부록 B: Iter 1 → Iter 3 변화 매트릭스

이전 Critic이 권고한 항목들이 어떻게 반영됐는지.

### Iter 1 P0 권고 (3건) 반영 상태

| Iter 1 권고 | 위치 | Iter 3 반영 |
|---|---|---|
| P0-1: 카드 radius `rounded-2xl` → `rounded-lg` | `card.tsx`, `dialog.tsx`, `select.tsx`, `toast.tsx`, `Landing.tsx` 동의카드 | **부분 반영**: card.tsx(`rounded-lg ✓`), dialog.tsx(`rounded-[20px] ✓ modal spec`), select.tsx(SelectContent `rounded-lg ✓`), toast.tsx(`rounded-lg ✓`). **단**: Landing 동의카드 여전히 `rounded-xl`(24px), Input 페이지 section은 `rounded-2xl`(32px). **P0 잔여.** |
| P0-2: Landing 폭 + 폰트 정상화 | Landing.tsx 9곳 | **완전 반영**: 480px ✓, h1 32px ✓, 부제 15px ✓, h2 24px 제거 (해당 섹션 전부 삭제) |
| P0-3: Landing 구조 단순화 — 3 섹션 제거 | Landing.tsx | **완전 반영**: TrustSection·PersonaSection·PreviewSection 모두 제거. 485줄→203줄 |

### Iter 1 P1 권고 (4건) 반영 상태

| Iter 1 권고 | Iter 3 반영 |
|---|---|
| P1-4: 미정의 시맨틱 토큰 일괄 정의 | **완전 반영**: `index.css:49-91` success/warn/danger 50-900 + info alias 전체 정의 |
| P1-5: Tabs 컬러 변경 (#15 위반) | **완전 반영**: `tabs.tsx:40` `bg-neutral-900` |
| P1-6: Input 단위 슬롯 추가 | **완전 반영**: `SuffixInput`/`ManWonInput`/`AmountInput` 우측 고정 단위 슬롯 |
| P1-7: StatNumber + .text-score weight 800 | **완전 반영**: `index.css:217` 800, `StatNumber.tsx:61` `font-extrabold`, unit `font-semibold` |

### Iter 1 P2 권고 (3건) 반영 상태

| Iter 1 권고 | Iter 3 반영 |
|---|---|
| P2-8: 4 배수 아닌 spacing 일괄 교체 | **부분 반영**: Landing.tsx의 5종(gap-1.5 등) 제거. 그러나 Result 카드 4개에 `gap-1.5` 잔존, `mt-0.5`·`h-1.5`·`px-2.5` 잔존. **P2 잔여.** |
| P2-9: 모션 duration 단축 | **완전 반영**: `motion.ts:35` `slower: 0.4`(400ms 캡), 모든 motion 0.32s 이하 |
| P2-10: 면책 카피 친근체 재작성 | **완전 반영**: `AppLayout.tsx:40-42` Iter 1 권고문 그대로 ("이 결과는 참고만 해주세요. 입력한 정보는 이 브라우저에만 있고 어디로도 안 나가요.") |

### 신규 영역 (Iter 1 미구현 → Iter 3 신규)

| 신규 | 평가 |
|---|---|
| Input 4페이지 (Basic/Health/Family/Insurance) | **78점 평균.** 카피 톤 우수. radius 위반 잔여. |
| Analyzing | **92점.** 가이드 §9.6 거의 완벽. |
| Result 4탭 | **85점 평균.** 가이드 §9.7 정확 부합. 잔여: 인라인 hex, 데코 아이콘. |
| LLM 사이드카 (codex-server.ts) | **86점.** 7개 룰·sanitizer 34패턴·폴백 템플릿. |
| 면책 3중 안전망 (DisclaimerBanner + withDisclaimer + splitReport) | **A.** 4중 보강 (Banner 포함). |

### 종합 변화

- 18-point 위반: **7건 → PARTIAL 3건 / FAIL 0건** (실질 합격 임박)
- Anti-AI-tone: 신규 평가 — **9 카테고리 중 7 PASS, 2 FAIL (광고·친근체 남용 각 1줄)**
- 시장 진입 점수: **58 → 84 (+26)**
- 시장 진입 가능: **No → 조건부 YES**

---

## 부록 C: 한 줄 요약

> Iteration 3은 **토스의 90% 가까이 도달**했다. 카드·탭·숫자·여백·카피·모션 모두 토스 정면 부합. 그러나 **Landing 한 줄 광고("5분이면 끝나요")와 다이얼로그 한 줄 친근체("삭제할까요")가 사용자 명시 요청에 정면 위반**이고, **Input 페이지 7개 section의 `rounded-2xl`(32px)·Button/Input radius `rounded-xl`(24px)이 토스 카드 16px·인풋 12px 표준을 깬다**. P0 4건은 모두 1-3줄 수정이라 Iteration 4 (2인 1일)로 91+ 도달 가능. 그 시점에 **토스 시니어가 봐도 "이거 누가 만든 거야?" 한마디 들을 수준**이 된다.

> **한 줄 평**: "토스를 표방하다 거의 토스가 된 사례. 시장 진입까지 P0 4건. Iteration 4 1일 작업으로 토스에 수렴."
