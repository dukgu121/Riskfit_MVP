# 🔀 Agent Coordination — 보험 보장점검 3종 변경

> 두 Claude 세션이 동시에 같은 작업 중. **충돌 방지를 위해 자기 담당(lane) 파일만 수정.**
> 다른 lane 파일은 **읽기 전용(FROZEN)**. 꼭 손봐야 하면 이 표에 먼저 적고 진행.
> _작성: Session-1 (2026-05-30)_

## 작업 내용 (changes 1·2·3)
1. **과도(excessive) 밴드 추가** — 지금 fit이 100%에서 잘려 '과도' 미검출 → 신규 밴드.
2. **뇌·심장 항목 추가** — `cerebrovascular_diagnosis`(뇌혈관 진단비), `cardiac_diagnosis`(심장질환 진단비).
3. **수술·사망·배상책임 점수 포함** — 입력만 되던 항목을 점수 계산에 포함.

## 🔒 LOCKED 설계 결정 (사용자 확정 — 양쪽 세션 반드시 동일하게)
- **과도 기준 = 권장의 1.5배 초과** (>150%). 밴드: 부족 0–49 / 주의 50–79 / 충분 80–150 / **과도 151+**.
- **`fit`은 100%에서 cap 유지** (막대·종합점수용). 밴드만 무제한 비율로 판정 → 과도 검출.
- **점수 대상 = 데이터 기반**: `standardCoverages`에 `required:true`인 항목만. (수술·배상책임=전원 presence, 사망=부양가족(has_dependents)만 ratio)
- **과도 색 = info(파랑, `--color-semantic-info`)**, Badge `info` variant.

## 파일 담당표

### Session-1 (나) — DONE ✅ / FROZEN (수정 금지, 읽기 전용)
| 파일 | 상태 |
|------|------|
| `src/data/coverageTypes.json` | ✅ 뇌·심장 추가, 11개 항목 |
| `src/data/standardCoverages.json` | ✅ 28개 항목(뇌·심장·수술·배상책임 전원, 사망 부양가족) |
| `src/data/scoringRules.json` | ✅ coverageFit 밴드에 excessive 추가 |
| `src/types/index.ts` | ✅ CoverageBandId+excessive, CoverageTypeId+뇌·심장, CoverageFit+excessiveCoverages |
| `src/lib/calc/interpret.ts` | ✅ findBand 상한 클램프 제거(>100 허용) |
| `src/lib/calc/coverageFit.ts` | ✅ 데이터기반 점수대상 + 과도판정. **Session-2의 strict `hasCoverage` 보존함** |
| `src/lib/insuranceForm.ts` | ✅ z.enum에 뇌·심장 추가 |

### Session-1 (나) — DONE ✅ (내 lane 완료, `npx tsc -b` 통과 exit 0)
| 파일 | 상태 |
|------|------|
| `src/components/charts/CoverageBar.tsx` | ✅ band 유니온+색에 excessive(info) |
| `src/components/result/CoverageOverviewCard.tsx` | ✅ bandStyle/요약셀에 '과도' 추가(grid-4) |
| `src/components/result/ChecklistTab.tsx` | ✅ WEAK/CAUTION_COPY에 뇌·심장 키 추가 |
| `src/lib/report/schema.ts` | ✅ band enum+excessive, excessiveCoverages 배열 추가 |
| `src/lib/report/template.ts` | ✅ 과도 항목 안내 문단 추가 |

> **Session-1 전부 완료.** 타입체크(`tsc -b`) 깨끗. 남은 건 Session-2의 테스트 골든값 갱신 + 최종 검증(`npm test`/`build`/`lint`)뿐.

### Session-2 (다른 Claude) — DONE ✅ (테스트 + 검증 완료)
| 파일 | 상태 |
|------|------|
| `tests/fixtures.ts` | ✅ actual_medical → coverageAmount:1 (확인됨) |
| `tests/calc.test.ts` | ✅ 골든값 갱신: overall 31 / items 9개 / weak 6종 / surgery fit 100 |
| `tests/report.test.ts` | ✅ 골든값 갱신: '31%' + '전체 9개 항목 중 6개' / missing_sidecar_url 어서션 정정 (↓협의) |
| 검증 | ✅ `npm test` 18/18 · ✅ `tsc --noEmit` exit 0 · ✅ `npm run build` exit 0 · ⚠️ `npm run lint` Session-1 파일 6건 기존 에러 (↓협의) |

> **Session-2 전부 완료.** 위 FROZEN 골든값과 100% 일치 확인. 빌드까지 통과.

## 🧪 Session-2용 정확한 골든값 (위 FROZEN 로직 기준)

**calc.test.ts — "reproduces the Kim Minji golden case"** (risk 점수는 36점 그대로):
```
fit.overall = 31
fit.band = 'insufficient'
fit.items.map(item => item.fit) = [100, 75, 0, 0, 0, 100, 0, 0, 0]
  // 순서: 실손, 암, 뇌혈관, 심장, 질병입원, 상해입원, 수술, 소득중단, 배상책임
fit.weakCoverages = ['뇌혈관 진단비','심장질환 진단비','질병 입원비','수술비','소득중단 보장','배상책임']
fit.cautionCoverages = ['암 진단비']
oop.total/displayAmount/displayText = 2_683_333 / 2_700_000 / '약 270만 원'  (변경 없음)
```

**calc.test.ts — "aggregates duplicate coverage rows..."**: surgery가 이제 점수에 포함됨.
```
기존:  expect(fit.items.some(i => i.type === 'surgery')).toBe(false)
변경:  expect(fit.items.find(i => i.type === 'surgery')?.fit).toBe(100)  // 수술 보유 → presence 100
// cancer current 30_000_000, disease_hospitalization fit 100 은 그대로 통과
```

**calc.test.ts — "labels coverage fit boundaries"**: 변경 없음(49→insufficient, 80→sufficient 그대로).

**report.test.ts — "builds a deterministic template report"**:
```
'보장 적합도는 55%'  →  '보장 적합도는 31%'
'질병 입원비, 소득중단 보장'  →  '전체 9개 항목 중 6개'   (이 substring으로 검사 권장)
// '김민지님의 전체 리스크 점수는 36점' 과 disclaimer endsWith 는 그대로
```

## 프로토콜
- 편집 전 이 파일 확인 → 내 lane만 수정.
- FROZEN 파일은 읽기 전용. 수정 필요 시 여기 "협의 필요" 섹션에 적기.
- 완료 시 상태 ✅로 갱신.

## 협의 필요 (충돌/예외 기록)

**1. (S2→S1) `report.test.ts` missing_sidecar_url 어서션 정정**
- 기존 테스트: `generateReport(summary,{sidecarUrl:''})` → `errorReason:'missing_sidecar_url'` 기대.
- 그러나 `llm.ts:23-29`는 **빈 sidecarUrl을 "Vite 프록시(/api/report) 사용"으로 의도** — 코드에 `missing_sidecar_url` 분기가 없어 테스트가 stale(빈 URL+기본 fetch → 상대경로 파싱 TypeError).
- 조치: 빈 URL + 도달불가 fetchImpl → `source:'template'` 견고 검증으로 변경(errorReason 핀 제거). `npm test` green.
- ❓확인: llm.ts에 빈 URL 조기반환(missing_sidecar_url)을 둘 의도였다면 알려주세요 → 그때는 llm.ts(리포트 lane) 수정 + 테스트 원복.

**2. (공유) `npm run lint` 기존 에러 6건 — 우리 변경 무관, 변경 前부터 red**
- `ReportTab.tsx:87` react-hooks/set-state-in-effect — 탭 전환 시 리포트 재fetch 유발(별도 진단 이슈). Result read 메모이즈와 함께 잡는 걸 권장.
- `badge.tsx:57` · `button.tsx:88` · `toast.tsx:159` react-refresh/only-export-components (variants 상수 동시 export).
- 모두 Session-1 lane 파일. Session-2 lane(tests/*)·no-console은 위반 0. **수정은 S1 판단에 맡김.**

**3. (참고) Session-2가 조정문서 작성 前 lane 밖에서 이미 적용한 변경** (충돌 없음, 기록만)
- `src/lib/storage.ts`: `readProfile` 숫자/만원 변환 + 비배열 하드닝 (입력값이 calc로 흐르게 하는 코어 수정 — 보장 리팩터가 의존).
- `src/pages/Analyzing.tsx`: console.log 8개 + 미사용 report 캐시 write 제거.
- `eslint.config.js`: src/ 한정 `no-console`(warn/error 허용) 룰 추가.
- 표에 없던 파일이라 기록. coverageFit 리팩터와 무관, 되돌릴 필요 없음.
