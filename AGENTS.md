# 🤖 AGENTS.md - PartnerOn AI Pair-Programming Guidelines (Slim Edition)

PartnerOn v1.0 프로젝트의 **LLM 코딩 에이전트 & 개발자 전용 핵심 지침서**입니다. (150줄 이내 슬림 헌장)

---

## 🚨 1. 최고 필수 준수 원칙 (Mandatory Approval Rule)

* ⚠️ **[사전 승인 필수]**: 사용자의 질문/지시에 사전 승인 없이 코드를 임의로 수정하지 않습니다.
* 👤 **[개발자 식별 수칙]**: 세션 시작 시 **작업 담당자 성함/닉네임**을 확인하여 ADR 및 Commit/PR에 수반 기록합니다. (기본: `HR (현률)`)
* ✅ **[3단계 워크플로우]**: 1단계(Audit 정밀 조사) ➔ 2단계(Propose/Report 계획 문서화) ➔ 3단계(Wait Approval 명시적 승인 후 구현)

---

## 📌 2. 프로젝트 세부 명세서 맵 (`docs/` Sitemap)

상세 기술 및 도메인 지침은 아래 전문 명세서를 최우선 참조합니다:
* 🏗️ **[System Architecture](file:///d:/workspace/Partneron_v1/docs/architecture.md)**: 전체 아키텍처 & 4단계 브랜치 파이프라인
* 💻 **[Coding Style & Security](file:///d:/workspace/Partneron_v1/docs/coding-style.md)**: 시큐어 코딩 (SQLi, XSS, BOLA 방지) & Windows/Linux 환경
* 📡 **[REST API Specification](file:///d:/workspace/Partneron_v1/docs/api.md)**: REST API 규격 & Agent 수집 API 엔드포인트
* 🗄️ **[Database Schema](file:///d:/workspace/Partneron_v1/docs/db-schema.md)**: 13개 DB 마스터 테이블 & ERD
* 💼 **[Business Rules](file:///d:/workspace/Partneron_v1/docs/business-rules.md)**: RBAC 4단계 권한, 2FA 정책, Agent 3가지 스캔 분기 규칙
* 🎨 **[UI & Design Guidelines](file:///d:/workspace/Partneron_v1/docs/ui-guidelines.md)**: 단일 전사 UI 표준 (`/operations/basic/contracts`)

---

## 🛠️ 3. 기술 스택 & 환경 규격 (Tech Stack)

* **Backend**: Python 3.12+, Django 5.1.x, DRF 3.15.x, SimpleJWT, PostgreSQL
* **Frontend**: Next.js 15.x (App Router), React 19, TS 5.x, Vanilla TailwindCSS
* **Environment**: 개발: Windows PowerShell (`0.0.0.0` 바인딩) / 운영: Linux Server (Nginx + Gunicorn + PM2 + Systemd)
* **API Request Rule**: 프론트엔드는 반드시 `getApiBaseUrl()` 유틸리티를 호출하여 API 동적 URL 할당.

---

## 🌿 4. AI 바이브코딩 4단계 브랜치 파이프라인

* **`main`**: 100% 검증 완료된 프로덕션 배포 전용 브랜치 (Protected)
* **`develop`**: 팀 통합 테스트 및 QA 스테이징 브랜치
* **`feature/ai-generated/<feature-name>`**: AI 에이전트 1차 Raw 코드 반영 샌드박스
* **`feature/refined/<feature-name>`**: 개발자(사람)가 정밀 리뷰, 포맷팅, 테스트 검증하여 정제한 제출 브랜치
* **`hotfix/<bug-name>`**: 실서버 긴급 패치 브랜치 (`main` ➔ `main` & `develop` 동시 병합)

---

## 🏷️ 5. AI 커밋 태깅 & 주석 수칙

* **커밋 태깅**: AI 1차 커밋 `feat: [AI-Gen] ...` / 개발자 정제 커밋 `refactor: [Refined] ...`
* **주석 태깅**: AI가 생성한 복잡한 알고리즘 상단에 `// AI-Context: [프롬프트 의도]` 명시.
* **Conventional Commits**: `feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `style:` 사용.

---

## 📑 6. 기술 의사결정 기록 (ADR - Architecture Decision Records)

* 주요 아키텍처/DB 선택 시 `docs/adr/<개발자명>/` 서브폴더 (예: `docs/adr/HR/0001-*.md`)에 ADR 작성.
* ADR 상단에 **작성자(Author)**, **AI 제안(Proposed by AI)**, **최종 승인자(Decision Maker)**를 명시하여 결정 추적성 보존.

---

## 🎯 7. 4단계 요구사항 전달 & AI 역질문 수칙

개발자가 AI에게 기능 요청 시 아래 4가지를 구조화하여 전달합니다:
1. **배경 (Background)**: 서비스 및 유저 타겟
2. **목표 (Goal)**: 기능의 개발 목적
3. **제약 (Constraints)**: 기술 스택, 인프라, 보안 제약
4. **예시 (Examples)**: 기존 유사 코드, UI, API 스펙

⚠️ **[역질문 수칙]**: 위 4가지 항목이 누락된 단순 지시 수신 시, AI 에이전트는 코드 수정을 유예하고 누락 항목의 보완을 정중히 역질문 안내한 후 진행합니다.

---

## 🧪 8. 검증 및 QA 테스트 케이스 관리

* **사전 필수 검증**: 코드 수정 후 반드시 `python manage.py test` 및 `npm run build` 100% 통과.
* **`TEST_CASES.md` 누적**: 주요 기능 추가, 버그 수정, 튜닝 시 `TEST_CASES.md`에 TC 항목(TC ID, 배경, 조치내용, 검증결과) 누적 관리.
