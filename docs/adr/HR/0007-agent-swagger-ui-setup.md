# ADR 0007: OpenAPI 3.0 & Swagger UI 탑재 및 Field Agent 전용 API 태깅 독립 분리

* **작성 일자**: 2026-08-20
* **작성 개발자**: HR
* **AI 에이전트**: Antigravity AI Pair Programmer
* **최종 의사결정자**: HR
* **상태**: 승인됨 (Approved)

---

## 1. 의사결정 배경 및 문제 정의 (Context & Problem Statement)

전사 백엔드 REST API 및 Field Agent(수집기) 연동 API 5종을 브라우저에서 라이브 시각화하고 웹 화면에서 바로 `Try it out` 테스트를 수행할 수 있도록 표준 OpenAPI 3.0 Swagger UI 탑재 필요.

---

## 2. 검토한 대안들 (Considered Options)

* **대안 1 (수동 HTML 문서 작성만 유지)**: API 변경 시마다 일일이 수동 수정해야 함.
* **대안 2 (drf-spectacular 기반 Swagger UI 자동 생성 - 채택)**:
  Django REST Framework 소스코드를 기반으로 Swagger UI (`/api/schema/swagger-ui/`) 및 ReDoc (`/api/schema/redoc/`) 대시보드를 자동 생성하고, `@extend_schema(tags=["Field Agent Collector APIs"])`로 에이전트 연동 API를 독립 태그로 분리 시각화.

---

## 3. 최종 결정 내용 및 아키텍처 (Decision & Architecture)

* **선택한 결정**:
  1. `drf-spectacular` 패키지 설치 및 `settings.py` / `urls.py`에 Schema 라우터 탑재.
  2. Agent 뷰 클래스에 `@extend_schema(tags=["Field Agent Collector APIs"])` 태깅 지정.
  3. `backend/static/agent_api_test.html` 다크모드 대시보드 함께 구동.
* **채택 이유**: 글로벌 개발 표준 준수 및 에이전트 외주/전담 개발자와의 라이브 통신 테스트 효율 10배 상승.

---

## 4. 결정 주체 및 히스토리 (Ownership & History)

* **AI 에이전트 제안**: drf-spectacular 기반 Swagger UI 탑재 및 태깅 분리 제안.
* **최종 승인자**: **HR** 작성 및 최종 승인 완료.
