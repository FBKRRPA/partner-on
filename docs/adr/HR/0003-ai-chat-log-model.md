# ADR 0003: AIChatLog 모델 신설 및 대화 이력 저장소 구축

* **작성 일자**: 2026-08-19
* **작성 개발자**: HR (현률)
* **AI 에이전트**: Antigravity AI Pair Programmer
* **최종 의사결정자**: HR (현률)
* **상태**: 승인됨 (Approved)

---

## 1. 의사결정 배경 및 문제 정의 (Context & Problem Statement)

바이브코딩 시 개발자와 AI 간의 아키텍처 토의 배경 및 의사결정 의도가 소실되는 것을 방지하기 위해, 유저별 프롬프트 의도와 AI 응답을 기록하는 `AIChatLog` DB 모델 신설 요구.

---

## 2. 검토한 대안들 (Considered Options)

* **대안 1 (로컬 파일 보관)**: 검색이 어렵고 멀티 유저 환경에 부적합.
* **대안 2 (Django ORM AIChatLog 신설 - 채택)**: PostgreSQL `ai_chat_logs` 테이블로 정형 관리 및 유저별 FK 매핑.

---

## 3. 최종 결정 내용 및 아키텍처 (Decision & Architecture)

* **선택한 결정**: `AIChatLog` 모델 신설 (`user`, `prompt_intent`, `ai_response`, `created_at`).
* **채택 이유**: 유저별 대화 이력 정형 추적성 확보.

---

## 4. 결정 주체 및 히스토리 (Ownership & History)

* **AI 에이전트 제안**: Django ORM 모델 설계 및 ADR 기록 제안.
* **최종 승인자**: **HR (현률)** 작성 및 최종 승인 완료.
