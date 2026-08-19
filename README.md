# 🟢 PartnerOn (파트너온) v1.0

**PartnerOn (파트너온) v1.0**은 B2B 사무기기 / 복합기 렌탈 자산 관리 및 통합 CRM/ERP 시스템입니다.

---

## 📌 주요 특징 (Key Features)

* **역할 기반 2차 인증 (2FA)**: TOTP, Email OTP, 일회성 비상 복구 코드 및 대표 승인 기기 통제 시스템(`Device` 승인 모듈)
* **Dynamic IP 자동 감지**: 개발 환경(Local), 사내 내부망 IP, 실서버 도메인 접속 무중단 자동 대응
* **PWA & 오프라인 지원**: Progressive Web App 및 네트워크 유실 시 오프라인 폴백 지원
* **메가 드롭다운 & RBAC**: 7대 대분류 25개 소분류 메가 드롭다운 네비게이션 및 4단계 직급별 메뉴 권한 통제 (`OWNER`, `ADMIN_STAFF`, `SALES`, `CE`)
* **에이전트 기반 실시간 관제**: 현장 Python SNMP 수집기 기반 등록/미등록 장비 이중 분류 및 실시간 관제

---

## 📚 세부 설계 명세서 (`docs/`)

협업 개발자 및 AI 에이전트를 위한 영역별 세부 기술 명세서입니다:

* 🏗️ **[System Architecture](file:///d:/workspace/Partneron_v1/docs/architecture.md)**: 아키텍처 및 PWA, Agent 동적 통신 구조
* 💻 **[Coding Style & Security](file:///d:/workspace/Partneron_v1/docs/coding-style.md)**: 시큐어 코딩 규칙 및 개발 가이드
* 📡 **[REST API Specification](file:///d:/workspace/Partneron_v1/docs/api.md)**: REST API 엔드포인트 명세 및 Ingest 규칙
* 🗄️ **[Database Schema](file:///d:/workspace/Partneron_v1/docs/db-schema.md)**: 13개 DB 테이블 ERD 및 Hot/Cold 시계열 구조
* 💼 **[Business Rules](file:///d:/workspace/Partneron_v1/docs/business-rules.md)**: 4단계 RBAC 권한, 2FA 정책, 3가지 스캔 분기 규칙
* 🎨 **[UI & Design Guidelines](file:///d:/workspace/Partneron_v1/docs/ui-guidelines.md)**: Fujifilm 에메랄드 브랜드 토큰 & UI/UX 가이드

---

## 🚀 빠른 시작 (Quick Start)

### 1. 백엔드 실행 (Backend)
```bash
cd backend
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 0.0.0.0:8000
```

### 2. 프론트엔드 실행 (Frontend)
```bash
cd frontend
npm install
npm run dev
```

### 3. 현장 에이전트 수집기 실행 (Agent Collector)
```bash
python agent/main.py
```
