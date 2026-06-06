# Agent Workspace

이 폴더는 Codex, Claude, 기타 에이전트가 동시에 같은 저장소에서 일하기 위한
공통 작업장입니다.

## 사용법

1. `BOARD.md`에서 현재 작업과 점유 파일을 확인합니다.
2. 새 작업을 시작하면 `Active Lanes`에 본인 이름, 목표, 수정 파일을 적습니다.
3. 설계 결정은 `Decisions`에 짧게 남깁니다.
4. 긴 검토 결과나 다음 에이전트에게 넘길 내용은 `handoffs/`에 파일로 남깁니다.
5. 완료 시 `Done`에 변경 파일과 검증 명령을 기록합니다.

## 충돌 방지

- 같은 파일을 두 에이전트가 동시에 수정하지 않습니다.
- 공통 파일(`src/types/index.ts`, `src/lib/storage.ts`, `package.json`)은 board에
  먼저 점유를 적고 진행합니다.
- 인코딩이 깨진 기존 문서는 복구 요청이 없는 한 수정하지 않습니다.

## Firebase MVP 기준

Firebase는 기존 `localStorage`를 즉시 대체하지 않고, 먼저 클라우드 미러링
계약을 확정합니다. 현재 UI는 동기 `read()` 흐름에 의존하므로, 실제 Firebase
연동은 hydration + background sync 방식으로 붙이는 것이 기본 방향입니다.
