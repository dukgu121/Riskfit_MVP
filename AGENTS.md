# Agent Workspace Rules

이 파일은 Codex, Claude, 기타 코드 에이전트가 공통으로 따르는 작업 규칙입니다.

1. 먼저 `agent-workspace/BOARD.md`를 확인합니다.
2. 수정할 파일을 lane에 명시하고, 다른 lane의 파일을 건드리지 않습니다.
3. 작업 결과는 테스트 명령과 함께 board 또는 handoff에 남깁니다.
4. Firebase 관련 작업은 `docs/FIREBASE_SCHEMA.md`의 MVP 계약을 기준으로 합니다.
5. 사용자 데이터는 건강, 재무, 보험 정보를 포함하므로 공개 로그나 예시 payload에
   실제 개인정보를 남기지 않습니다.

현재 프로젝트는 Git 저장소가 아닌 상태일 수 있습니다. `git status`가 실패해도
작업 내역은 파일 경로 기준으로 보고합니다.
