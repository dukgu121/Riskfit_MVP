# Claude Collaboration Entry

이 저장소에서 Claude가 작업할 때는 먼저 `agent-workspace/README.md`와
`agent-workspace/BOARD.md`를 읽어주세요.

## 기본 규칙

- 작업 전 `agent-workspace/BOARD.md`에 본인 lane과 수정 파일을 적습니다.
- 다른 에이전트가 점유한 파일은 수정하지 않습니다.
- 공통 결정은 `agent-workspace/BOARD.md`의 Decisions에 남깁니다.
- 긴 분석 결과는 `agent-workspace/handoffs/`에 새 Markdown 파일로 남깁니다.
- 기존 앱은 `localStorage` 동기 저장 흐름에 의존합니다. Firebase 작업은 기존
  `readProfile()` / `readInsurances()` 계산 계약을 깨지 않는 방향으로 진행합니다.

## 현재 우선 작업

Firebase MVP 스키마 준비가 진행 중입니다.

- 스키마 계약: `src/lib/firebase/schema.ts`
- 보안 규칙 초안: `firestore.rules`
- 설계 문서: `docs/FIREBASE_SCHEMA.md`
- 호환성 테스트: `tests/firebase-schema.test.ts`
