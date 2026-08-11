# 🤖 AGENTS.md - PartnerOn AI Pair-Programming & Coding Guidelines

이 문서는 **PartnerOn (파트너온) v1.0** 프로젝트에서 다른 개발자나 LLM 코딩 에이전트(Antigravity, Cursor, Claude Code, GitHub Copilot 등)가 코드를 작성, 수정, 확장할 때 반드시 준수해야 하는 **프로젝트 표준 및 코딩 규칙 문서**입니다.

---

## 🚨 [최고 필수 준수 원칙] 사전 조사·계획 보고 & 사용자 명시적 승인 후 코드 수정 (Mandatory Approval Rule)

* ⚠️ **[절대 금지]**: 사용자의 질문, 조사, 기능 요구사항에 대해 **사전 승인 없이 절대로 코드를 먼저 수정하거나 임의로 적용하지 않습니다.**
* ✅ **[필수 절차 3단계 (Audit ➔ Propose/Report ➔ Wait Approval)]**:
  1. **1단계 (현 상태 정밀 조사)**: 요청사항 관련 현재 소스코드 상태 및 단일 UI 표준과의 차이점을 정밀 감사합니다.
  2. **2단계 (계획 보고 및 문서화)**: 조사 결과 및 구체적인 수술/개선 플랜을 자연어 및 `.md` 아티팩트 문서로 작성하여 보고합니다.
  3. **3단계 (사용자 명시적 승인 대기)**: 대표님(사용자)의 **"승인 (진행해, 승인함 등)"** 지시를 확인한 후에만 비로소 코드를 수정하고 실전 검증을 진행합니다.

---

## 📌 1. 프로젝트 개요 (Project Overview)
* **프로젝트명**: PartnerOn (파트너온) v1.0
* **시스템 성격**: B2B 사무기기 / 복합기 렌탈 자산 관리 및 통합 CRM/ERP 시스템
* **주요 특징**:
  * 역할 기반 2차 인증 (2FA: TOTP, Email OTP, 일회성 비상 복구 코드)
  * 대표 승인 기기 통제 시스템 (`Device` 승인 모듈)
  * Dynamic IP 자동 감지 (로컬, 내부망 IP, 실서버 도메인 무중단 지원)
  * PWA (Progressive Web App) 및 오프라인 폴백 지원
  * 7대 대분류 25개 소분류 메가 드롭다운 네비게이션 & 4단계 직급별 메뉴 권한 관리 (RBAC)

### 📚 **프로젝트 세부 설계 명세서 (`docs/` Sitemap)**
협업 개발 및 코딩 에이전트를 위한 6대 영역별 세부 명세서는 아래 문서에서 확장 확인하실 수 있습니다:
* 🏗️ **[System Architecture](file:///d:/workspace/Partneron_v1/docs/architecture.md)**: 전체 시스템 아키텍처 및 PWA, 2FA, Agent 동적 통신 아키텍처
* 💻 **[Coding Style & Security](file:///d:/workspace/Partneron_v1/docs/coding-style.md)**: 백엔드/프론트엔드 코딩 규칙 & OWASP 보안 취약점 방지 수칙
* 📡 **[REST API Specification](file:///d:/workspace/Partneron_v1/docs/api.md)**: API 엔드포인트 명세 및 JWT Bearer, Agent Ingest API 규격
* 🗄️ **[Database Schema](file:///d:/workspace/Partneron_v1/docs/db-schema.md)**: 13개 데이터베이스 테이블 ERD 및 Hot/Cold 시계열 Upsert 구조
* 💼 **[Business Rules](file:///d:/workspace/Partneron_v1/docs/business-rules.md)**: 4단계 RBAC 권한, 2FA 정책, 수집기 3가지 스캔 분기 규칙
* 🎨 **[UI & Design Guidelines](file:///d:/workspace/Partneron_v1/docs/ui-guidelines.md)**: Fujifilm 에메랄드 브랜드 토큰, Glassmorphism & UI 지침

---

## 🛠️ 2. 기술 스택 & 환경 규격 (Tech Stack & Environment)

| 구분 | 선택 기술 | 필수 버전 및 규칙 |
| :--- | :--- | :--- |
| **Backend** | Python, Django, DRF | Python 3.12+, Django 5.1.x, DRF 3.15.x |
| **Frontend** | Next.js, React, TypeScript | Next.js 15.x (App Router), React 19, TS 5.x |
| **Styling** | Vanilla TailwindCSS | inline ad-hoc 스타일 지양, 프리미엄 UI 디자인 토큰 사용 |
| **Database** | PostgreSQL | Django ORM (`models.py`) 표준 지침 준수 |
| **Authentication**| SimpleJWT, pyotp | JWT Bearer 토큰 및 pyotp TOTP 검증 |
| **PWA** | `@ducanh2912/next-pwa` | 서비스워커(`sw.js`) 및 Manifest 연동 유지 |

---

## 🎨 3. 프론트엔드 개발 규칙 & 디자인 시스템 (Design System & UI Guidelines)

### ① **API Base URL 동적 할당 (필수 준수)**
* ❌ **금지**: `http://localhost:8000` 하드코딩 절대 금지 (IP 접속 시 `Failed to fetch` 오류 원인)
* ✅ **원칙**: 모든 API 요청은 `frontend/lib/auth-api.ts`의 `getApiBaseUrl()` 유틸리티를 호출하여 사용해야 합니다.
  ```typescript
  import { getApiBaseUrl } from "@/lib/auth-api";
  const url = `${getApiBaseUrl()}/api/v1/auth/...`;
  ```

### ② **브랜드 컬러 토큰 (Fujifilm Brand Identity)**
* **메인 브랜드 컬러**: `#01916D` (Fujifilm Emerald Green) - `bg-[#01916D]`, `text-[#01916D]`
* **서브/호버 컬러**: `#006449` (Deep Emerald), `#01916D`/10 (투명 10% 탭 배경)
* **경고/에러 컬러**: `#E01E35` (Accent Red) - `bg-[#E01E35]`, `text-[#E01E35]`
* **텍스트/배경 컬러**: `#333333` (주요 헤딩), `#5C5C5C` (보조 텍스트), `#FAFAFA` (기본 배경)
* **브랜드 그라데이션**: 헤더 상단 `fujifilm-gradation-bg` (`linear-gradient(90deg, #01916D, #80C342)`) 유지

### ③ **UI/UX 디자인 패러다임 & 단일 전사 표준 (Standard B2B UI Guidelines)**
* **단일 표준 모델 (Authoritative Reference UI)**: 전사 시스템의 모든 뷰페이지(CRM, 기초정보, 자산/수집, 계약, 모니터링 등)는 **`기초정보 관리 > 계약 관리` (`/operations/basic/contracts`)** 페이지의 디자인 구조를 **100% 절대적 단일 표준**으로 삼습니다.
* **Canvas Background**: 메인 바탕 캔버스는 깨끗하고 눈의 피로도가 적은 **`bg-[#FAFAFA]`**를 사용합니다.
* **Header Breadcrumb**: 상단 브랜치 빵부스러기는 `text-xs font-semibold text-[#5C5C5C]` 카테고리 헤더와 대형 메인 타이틀 `text-2xl sm:text-3xl font-black text-[#333333] tracking-tight`를 적용합니다.
* **B2B Table Container**: 데이터 표 카드는 부드러우면서 정돈된 **`bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden`**을 사용하며, 셀 패딩은 **`p-4`**를 적용합니다.
* **Clean Glass Overlay Modal**: 팝업 모달은 **`bg-white rounded-3xl max-w-md` (또는 `max-w-3xl/4xl`) `p-6 shadow-2xl space-y-5 border border-slate-200`** 및 상단 우측 원형 닫기(✕) 버튼(`w-8 h-8 rounded-full bg-slate-100`)을 표준 구조로 전수 통합 적용합니다.
* **Status Badges 규격**:
  * ✅ 승인 완료 / 활성: `bg-emerald-100 text-[#01916D]`
  * ⏳ 승인 대기 / 2FA 필수: `bg-amber-100 text-amber-800`
  * ❌ 승인 거절 / 위험: `bg-rose-100 text-[#E01E35]`

### ④ **메뉴 라우터 & 레이아웃 컨벤션**
* 상단 헤더 메뉴는 [AppHeader.tsx](file:///d:/workspace/Partneron_v1/frontend/components/layout/AppHeader.tsx)의 7대 대분류 + 25개 소분류 드롭다운 네비게이션을 유지합니다.
* 새로 추가되는 소분류 메뉴는 `MenuScaffoldPage` 컴포넌트를 활용하여 일관된 Breadcrumb (`카테고리 › 소분류`)과 모듈 카드 UI를 제공합니다.

### ⑤ **UI 아이콘 & 이모지 사용 제한 (Text-First Design)**
* ❌ **금지**: 헤더, 버튼, 카테고리 빵부스러기, 카드 타이틀 등에 임의의 유니코드 이모지(📌, 👥, 📱, 📈 등) 및 조잡한 아이콘 삽입을 금지합니다.
* ✅ **원칙**: 텍스트 중심의 차분하고 정돈된 B2B 프리미엄 UI 레이아웃을 유지하며, 시각적 강조가 필요한 경우 Fujifilm 브랜드 컬러 뱃지(`bg-[#01916D]/10 text-[#01916D]`)와 상태 컬러 태그만 활용합니다.

### ⑥ **CRM/영업/구성원/권한관리 모달 & B2B 데이터 테이블 표준 규격 (Modal & Table Guidelines)**
* **Pure Text-First Data Table 원칙**: 모든 CRM 및 관리 모듈 List View는 카드가 아닌 `operations/basic/contracts` 표준 규격의 정통 B2B HTML `<table>` 구조를 사용하며, 아이콘/이모지 0건의 텍스트 중심 레이아웃을 준수합니다.
* **고객관리 (`/crm/customers`) 5대 섹션 등록 & 상세보기 모달**:
  * **1) 관리 파트너사 정보 (소속 사업장)**: 로그인 유저의 소속 사업장명(`sessionStorage.getItem("workplaceName")`) 및 실명(`userName`)을 동적 자동 바인딩.
  * **2) 고객 정보**: 고객명, 사무실 유형(5종), 거점, 계약상태(2종), 사업자번호, 관리등급(4종), 임직원 규모(7종).
  * **3) 고객 담당자 정보 1 (주 담당자)**: 성함, 부서(14종 드롭다운), 직책, 이메일, 연락처, 메모.
  * **4) 고객 담당자 정보 2 & 5) 고객 담당자 정보 3**: 보조 담당자 2인 상세 정보.
  * **Row Click 상세보기 모달**: 테이블 행(Row) 클릭 시 `5대 섹션 전수 마스터 정보` 팝업 조회.
* **영업관리 (`/crm/sales`) 2대 섹션 등록 & 상세보기 모달**:
  * **1) 영업기회 관리**: 고객명(고객 테이블 DB 연동 선택), 영업명, 거래처(Workspace 명), 영업단계(5종), 장비모델명, 영업타입(5종), 영업유형(3종), 활동시작일, 계약형태(3종), 예상매출금액, 예상계약월도, 예상매출월도, 기타 사유.
  * **2) 활동 결과**: FBKR/타팀 지원여부, 지원방법(5종), 지원팀 처리 코멘트.
  * **Row Click 상세보기 모달**: 테이블 행(Row) 클릭 시 `2대 섹션 전수 영업 정보` 팝업 조회.
* **구성원관리 (`/crm/members`) & 메뉴 권한 관리 (`/operations/basic/permissions`)**:
  * `contracts` 표준 UI (`bg-[#FAFAFA]`, `rounded-2xl`, Clean Glass Modal, Text-First 0% 이모지)로 100% 동일하게 레이아웃 동기화 완비.

---

## 🔒 4. 시큐어 코딩 & 웹 보안 취약점 방지 수칙 (Web Vulnerability Prevention)

주요 웹 보안 진단/진단도구(KISA 가이드, OWASP Top 10) 시 취약점이 지적되지 않도록 아래 시큐어 코딩 수칙을 엄격히 준수해야 합니다.

### ① **SQL Injection 방지**
* ❌ **금지**: `cursor.execute("SELECT ... WHERE email = '%s'" % user_input)` 파이썬 포맷팅 직접 쿼리 절대 금지.
* ✅ **원칙**: 반드시 Django ORM 메서드 (`User.objects.filter(...)`) 및 Parameterized Query를 활용합니다.

### ② **XSS (Cross-Site Scripting) 방지**
* ❌ **금지**: React/Next.js에서 `dangerouslySetInnerHTML` 속성 사용을 엄격히 금지합니다.
* ✅ **원칙**: 모든 클라이언트 출력 텍스트는 React 기본 JSX 자동 이스케이핑을 거쳐 안전하게 렌더링되도록 작성합니다.

### ③ **Broken Access Control & BOLA (타인 데이터 무단 접근) 방지**
* ❌ **금지**: URL 파라미터 `pk`만으로 객체를 바로 조회(`User.objects.get(pk=pk)`)하여 타 사업장 데이터에 접근할 수 있게 방치하는 행위 금지.
* ✅ **원칙**: 모든 데이터 조회의 최상위 조건에는 로그인된 유저의 소속 사업장 조건(`workplace=request.user.workplace`)을 반드시 결합하여 검증합니다.
  ```python
  member = User.objects.filter(pk=pk, workplace=request.user.workplace).first()
  ```

### ④ **민감 정보 노출 (Sensitive Data Exposure) 방지**
* ❌ **금지**: 비밀번호, TOTP Secret, 이메일 OTP 코드가 REST API DTO 응답(JSON)에 포함되지 않도록 합니다.
* ✅ **원칙**:
  * 비밀번호는 반드시 `user.set_password()`를 거쳐 PBKDF2 단방향 솔티드 해시로 암호화 저장합니다.
  * API Serializer의 `fields`에서 `password`, `totp_secret`, `otp_code`를 제외하거나 `write_only=True`를 명시합니다.
  * DB 암호, SECRET_KEY, API 키 등은 소스코드에 하드코딩하지 않고 환경 변수(`.env`)로 처리합니다.

### ⑤ **Brute-Force (무차별 대입 공격) & 세션 관리**
* 로그인 API에는 `throttle_scope = "login"`을 적용하여 초당 요청 건수를 제한합니다.
* 이메일 OTP 인증 코드는 발송 후 5분이 지나면 자동 만료(`timedelta(minutes=5)`)되도록 처리하며, 1회 검증 시 즉시 소멸(`user.otp_code = None`)시킵니다.

### ⑥ **시스템 상세 정보 노출 방지 (Information Disclosure)**
* API 예외 처리 시 서버 내부 딥 스택트레이스(StackTrace)나 DB 에러 원문을 클라이언트에 직접 렌더링하지 않고, 정제된 메시지(`{"detail": "..."}`) 형태로 반환합니다.

---

## 🗄️ 5. 데이터베이스 스키마 & ORM 모델 (Database Schema & Tables)

현재 데이터베이스에는 **총 13개 테이블**(비즈니스 모델 4개 + 다대다 M2M 관계 테이블 2개 + Django 프레임워크 시스템 테이블 7개(django_admin_log 포함))이 생성되어 운용되고 있습니다.

```
+------------------+         1 : N         +------------------+
|    Workplace     | --------------------- |       User       |
+------------------+                       +------------------+
| id               |                       | id               |
| name (unique)    |                       | email (unique)   |
| address          |                       | name             |
| enforce_2fa_owner|                       | role (OWNER/...) |
| enforce_2fa_a... |                       | is_2fa_enabled   |
| enforce_2fa_s... |                       | totp_secret      |
| enforce_2fa_ce   |                       | backup_codes     |
+------------------+                       +------------------+
        | 1                                         | 1
        | : N                                       | : N
+------------------+                       +------------------+
|RoleMenuPermission|                       |      Device      |
+------------------+                       +------------------+
| id               |                       | id               |
| role             |                       | device_uuid      |
| menu_key         |                       | device_name      |
| is_allowed       |                       | ip_address       |
+------------------+                       | status (PENDING..|
                                           +------------------+
```

### 1) 비즈니스 핵심 모델 테이블 (Accounts App)

* **`accounts_workplace` (Workplace 모델)**:
  * `id`: Primary Key
  * `name`: `CharField(max_length=120, unique=True)` - 사업장 명칭
  * `address`: `CharField(max_length=255)` - 사업장 주소
  * `enforce_2fa_owner`, `enforce_2fa_admin_staff`, `enforce_2fa_sales`, `enforce_2fa_ce`: 4개 직급별 2FA 강제 정책 Boolean
* **`accounts_user` (User 모델 - AbstractUser 상속)**:
  * `id`: Primary Key
  * `email`: `EmailField(unique=True)` - 로그인 ID (USERNAME_FIELD)
  * `name`: `CharField(max_length=80)` - 유저 실명
  * `role`: 5단계 Enum (`HEADQUARTERS`: 본사 총괄 관리자, `OWNER`: 파트너사 대표, `ADMIN_STAFF`: 파트너사 사무직원, `SALES`: 영업, `CE`: CE)
  * `workplace_id`: ForeignKey (`Workplace` 참조)
  * `is_2fa_enabled`: Boolean - 개인 2FA 활성화 여부
  * `totp_secret`: `CharField(max_length=64)` - pyotp TOTP 비밀키
  * `otp_code` / `otp_created_at`: 이메일 OTP 6자리 및 발송 시각
  * `backup_codes`: `JSONField` - 8자리 일회성 비상 복구 코드 10개
  * `invite_code`: `CharField(max_length=32, unique=True)` - 8자리 고유 구성원 초대 코드 (예: `INV-8A9F2K`)
  * `invite_created_at`: `DateTimeField` - 초대 코드 생성/재발송 시각 (24시간 만료 기준)
  * `is_invite_accepted`: Boolean - 구성원의 초대 승인/회원가입 완료 여부
  * `is_admin()` 메서드: `OWNER` 또는 `ADMIN_STAFF` 관리자 권한 리턴
  * `requires_2fa()` 메서드: 유저 개인 설정 및 사업장 직급별 강제 정책 종합 평가 리턴
* **`accounts_rolemenupermission` (RoleMenuPermission 모델)**:
  * `id`: Primary Key
  * `workplace_id`: ForeignKey (`Workplace` 참조)
  * `role`: Enum (`ADMIN_STAFF`, `SALES`, `CE`)
  * `menu_key`: CharField (`crm_customers`, `assets_devices` 등 25개 키)
  * `is_allowed`: Boolean (기본값 True)
* **`accounts_device` (Device 모델)**:
  * `id`: Primary Key
  * `user_id`: ForeignKey (`User` 참조)
  * `device_uuid`: `CharField(max_length=100)` - 브라우저/기기 고유 UUID
  * `device_name`: `CharField(max_length=150)` - 디바이스/OS 명칭
  * `ip_address`: `GenericIPAddressField` - 접속 IP 주소 (Nginx 프록시 전달)
  * `status`: Enum (`PENDING`, `APPROVED`, `REJECTED`) - 접속 승인 상태
* **`accounts_printerasset` (PrinterAsset 모델)**:
  * `id`: Primary Key
  * `workplace_id`: ForeignKey (`Workplace` 참조)
  * `serial_no`: `CharField(max_length=120, unique=True)` - 장비 고유 시리얼 번호
  * `model_name`: `CharField(max_length=120)` - 복합기 모델명
  * `customer_name`: `CharField(max_length=120)` - 설치 고객사명
  * `location`: `CharField(max_length=150)` - 설치 위치
  * `ip_address`: `GenericIPAddressField` - 기기 IP 주소
* **`accounts_agentcollector` (AgentCollector 모델)**:
  * `id`: Primary Key
  * `workplace_id`: ForeignKey (`Workplace` 참조)
  * `auth_code`: `CharField(max_length=32, unique=True)` - 8자리 수집기 인증 코드 (`AST-XXXXXX`)
  * `name`: `CharField(max_length=150)` - 에이전트 수집기 명칭
  * `customer_name`: `CharField(max_length=120)` - 설치 고객사 명칭
  * `ip_range`: `CharField(max_length=100)` - 스캔 대역/IP
  * `custom_ips`: `JSONField` - 수동 지정 IP 목록
  * `status`: Enum (`ONLINE`, `OFFLINE`, `PENDING`) - 수집기 연결 상태
  * `detected_count`: IntegerField - 탐지/스캔된 복합기 수
  * `last_scanned_at`: DateTimeField - 최근 Agent 통신 시각
* **`accounts_printeroidmapping` (PrinterOidMapping 모델)**:
  * `id`: Primary Key
  * `vendor_name`: `CharField(max_length=60)` - 제조사명 (Fujifilm, Canon, Ricoh, Standard)
  * `oid_key`: `CharField(max_length=60)` - OID 키 (serial_no, count_color, count_mono, toner_c 등)
  * `oid_value`: `CharField(max_length=150)` - SNMP OID 주소 문자열
  * `is_active`: Boolean - OID 수집 활성화 여부
* **`oid_lists` (OidListMaster 모델)**: 제조사/모델별 OID 상세 맵
* **`printers` (PrinterModelMaster 모델)**: 프린터 및 복합기 모델 마스터
* **`monitoring_customers` (MonitoringCustomer 모델)**: 사업장별 관제 대상 고객사
* **`monitoring_printers` (MonitoringPrinter 모델)**: 실시간 관제 대상 복합기/프린터 장비
* **`monitoring_data` (MonitoringData 모델)**: 최신 실시간 관제 데이터 (카운터 5종 + 소모품 6종 + 드럼 4종 + Spec Max 10종, `unique_together = ("workplace", "serial_no")`, `MonitoringPrinter` 1:1 OneToOne 매핑)
* **`monitoring_data_records` (MonitoringDataRecord 모델)**: 관제 데이터 일별/월별 누적 이력 (`unique_together = ("monitoring_printer", "yyyymmdd")`로 당일 갱신 및 일자 변경 시 레코드 자동 누적적재)
* **`supplies` (SuppliesAlert 모델)**: 소모품 잔량 경고 및 상태
* **`supply_usages` (SupplyUsage 모델)**: 소모품 수동/시스템 교체 사용 이력
* **`unregistered_printers` (UnregisteredPrinter 모델)**: 현장 에이전트에 탐지된 미등록 복합기 상세 저장소 (`unique_together = ("workplace", "ip")`로 동일 IP 장비 재스캔 시 `serial_no`, `scanned_model`, `vendor_name`, `mac_address`, `count_total/color/mono`, `toner_k/c/m/y`, `last_scanned_at` 등 23개 최신 컬럼 실시간 자동 갱신 지원)

### 2) M2M (다대다) 권한 관계 테이블
* **`accounts_user_groups`**: 사용자 ➔ 권한 그룹 매핑 테이블
* **`accounts_user_user_permissions`**: 사용자 ➔ 개별 권한 매핑 테이블

### 3) Django 프레임워크 내장 시스템 테이블 (System Tables)
* **`auth_group`**: 권한 그룹 마스터 테이블
* **`auth_group_permissions`**: 권한 그룹 ➔ 세부 권한 매핑 테이블
* **`auth_permission`**: 개별 접근 권한 마스터 테이블
* **`django_content_type`**: 프로젝트 모델 메타데이터 인덱스 테이블
* **`django_session`**: 서버 사이드 세션 데이터 저장소
* **`django_migrations`**: DB 마이그레이션 변경 이력 트래킹 테이블

---

## 🛡️ 6. 백엔드 개발 규칙 (Backend Rules)

### ① **2FA (Two-Factor Authentication) 검증 흐름**
* 유저의 2FA 요구 여부는 반드시 `user.requires_2fa()` 메서드를 호출하여 판단합니다.
* 2FA가 필요한 경우 `LoginView`는 JWT 대신 `require_2fa: True`와 `pre_token`, `otp_code`를 리턴하고, 프론트엔드의 2FA verification modal을 통해 `Verify2FAView`에서 최종 JWT를 발급합니다.

### ② **REST API URL 규격**
* 인증/계정 관련 API: `/api/v1/auth/...`
* 사업장/보안정책 관련 API: `/api/v1/workplace/...`
* 장비 현황 CRUD API: `/api/v1/workplace/printers/` 및 `/api/v1/workplace/printers/<int:pk>/` (`PrinterAssetListCreateView`, `PrinterAssetDetailView`)
* 모니터링/사용량 관제 API: `/api/v1/monitoring/usage/`, `/api/v1/monitoring/supplies/` (수집기간 `start_date`, `end_date`, `serial_no` 백엔드 DB 파라미터 쿼리 필터링 필수 적용)
* 에이전트 수집 API: `/api/v1/agent/...` (`target-assets`, `ingest`)
* 모든 뷰 클래스는 DRF `APIView` 또는 `TokenObtainPairView`를 상속받아 명확한 HTTP Status Code(200 OK, 400 Bad Request, 403 Forbidden)를 반환합니다.

### ③ **Django ORM 및 데이터베이스 무결성 & AGENTS.md 동기화 (필수 지침)**
* ⚠️ **[중요] 모델/테이블 추가 및 필드 수정 시 필수 절차**:
  1. `models.py` 수정 후 `python manage.py makemigrations` 및 `python manage.py migrate` 수행.
  2. **새로운 모델/테이블이 생성되거나 필드가 변경된 경우, LLM 코딩 에이전트는 반드시 `AGENTS.md` 파일의 `5. 데이터베이스 스키마 & ORM 모델` 섹션에 해당 테이블 및 필드 설명을 업데이트해야 합니다.**
  3. **Django ORM 쿼리 작성 시 `from django.db import models` 또는 `from django.db.models import Q`를 상단에 명시적으로 임포트하여 `NameError` 예외로 인한 서버 500 장애를 원천 예방해야 합니다.**

### ④ **에이전트 이중 수집 분리 & 3가지 스캔 자동 분기 규칙 (필수 준수)**
* **등록 장비와 미등록 장비의 이중 수집 분리**:
  * [장비관리] 정식 등록 복합기(`PrinterAsset`) ➔ `PrinterAsset`, `MonitoringPrinter`, `MonitoringData`, `MonitoringDataRecord`, `SuppliesAlert` 관제 DB 실시간 갱신. (신규 등록 기기 최초 수집 시 `MonitoringPrinter.objects.get_or_create`로 PK 사전 확보하여 `NOT NULL` 제약조건 위반 500 에러 원천 예방)
  * 미등록 탐지 기기 ➔ 관제 DB 오염 없이 `unregistered_printers` DB 테이블 (`UnregisteredPrinter`, `unique_together = ("workplace", "ip")`)에 실시간 분리 저장.
* **에이전트 3가지 스캔 분기 조건 메커니즘**:
  * **조건 1 (최초 등록 0대 상태)**: `target_serials` 0대 ➔ `get_local_ip_subnet()` 로컬 네트워크 자동 감지 서브넷 대역(.1~.254) 풀 스캔(Full Scan).
  * **조건 2 (미등록 장비 스캔 파라미터 전달)**: `--scan-unregistered` / `-u` CLI 파라미터 또는 API 쿼리 수신 ➔ `get_local_ip_subnet()` 로컬 네트워크 자동 감지 서브넷 대역(.1~.254) 풀 스캔(Full Scan).
  * **조건 3 (기존 등록 장비가 있는 정기 수집)**: 정식 등록 기기 존재 ➔ 0.5초 초고속 등록 장비 전용 핀포인트 스캔(Pinpoint Scan).
* **수집 API IP 키 호환성 및 덮어쓰기 방지 지침 (`Ingest API IP Resolution Directive`)**:
  * 백엔드 수집 API(`AgentIngestBatchView`)는 에이전트 패킷의 IP 키 이름(`ip_address` 또는 `ip`)을 호환 수용(`item.get("ip_address") or item.get("ip") or "127.0.0.1"`)하여, 고유 IP 상실로 인한 미등록 장비 1대 축소 덮어쓰기(Deduplication Overwrite) 버그를 원천 예방해야 합니다.
* **풀 스캔 타겟 IP 고유성 지침 (`Full Scan IP Uniqueness Directive`)**:
  * 에이전트 풀 스캔(.1~.254) 시 스캐너는 각 타겟 IP별로 고유 IP 및 시리얼 번호를 부여하여 `unregistered_printers` DB 테이블에 N대 장비가 개별 분리 적재되도록 수집합니다.
* **정적 에셋 폰트 파일 경로 무결성 준수**:
  * `MinSans` (`MinSansVF.woff2`, `MinSansVF.ttf`) 웹폰트는 반드시 `frontend/public/fonts/` 폴더에 배치하고 `globals.css`에서 `@font-face`로 로딩하여 404 에러를 예방합니다.

---

## 🧪 7. 테스트 및 품질 검증 (Verification Standard)

코드 변경을 완료하기 전에 반드시 아래 **2가지 검증 스크립트**를 실행하고 100% 통과해야 합니다.

1. **백엔드 단위 테스트**:
   ```bash
   cd backend
   python manage.py test
   ```
   *(반드시 9개 이상의 단위 테스트가 `OK` 상태여야 함)*

2. **프론트엔드 프로덕션 빌드 검증**:
   ```bash
   cd frontend
   npm run build
   ```
   *(모든 정적 페이지(35/35) 및 PWA 컴파일이 오류 없이 성공해야 함)*

---

## 🌿 8. Git 브랜치 전략 & PR 규칙 (Branch & PR Strategy)

1. **`main` 브랜치는 보호(Branch Protection)되어 있으므로 직접 Push가 금지됩니다.**
2. **기능 추가 및 수정 시 반드시 작업 브랜치를 생성해야 합니다**:
   - `feature/기능명` (예: `feature/crm-customer-ui`)
   - `fix/버그명` (예: `fix/2fa-otp-timeout`)
   ```bash
   git checkout main
   git pull origin main
   git checkout -b feature/new-crm-module
   ```
3. **코드 검증 통과 후 GitHub에 브랜치를 Push하고 PR(Pull Request)을 작성합니다**:
   - 테스트(`python manage.py test`) 및 빌드(`npm run build`) 통과 필수.
   - PR 생성 후 최소 1명 이상의 승인(Approval)을 받아야만 `main`으로 안전하게 병합(Merge)할 수 있습니다.

---

## 📝 9. Git 커밋 컨벤션 (Git Commit Convention)

모든 커밋 메시지는 **Conventional Commits** 형식을 따릅니다:

* `feat:` 새로운 기능 추가 (예: `feat: Add 2FA TOTP QR code modal`)
* `fix:` 버그 수정 (예: `fix: Resolve dynamic IP base URL resolution`)
* `refactor:` 기능 변경 없는 코드 구조 개선
* `docs:` 문서 수정 (예: `docs: Add AGENTS.md project rules`)
* `style:` 코드 포맷팅, 세미콜론 누락 등 (코드의 로직 변경 없음)
* `test:` 테스트 코드 추가 및 수정

---

## 🧪 10. QA & 테스트 케이스 누적 관리 규칙 (Test Cases Maintenance)

1. **`TEST_CASES.md` 문서 동기화 (필수 지침)**:
   * 사용자 문의 사항, 버그 현상 수정, UI/UX 디자인 개선, 데이터베이스 필터링 정정, 대규모 스케일업(1,000대~10,000대 고성능 엔진 등) 작업 시 **LLM 코딩 에이전트는 반드시 프로젝트 루트의 `TEST_CASES.md` 문합 테스트 케이스 지침서에 해당 항목(TC ID, 기능 분류, 발생 배경, 조치 내용, 검증 결과)을 누적 기록**해야 합니다.
2. **테스트 케이스 유지보수 흐름**:
   * 신규 기능 추가 또는 문의/버그 발생 ➔ 코드 수정 & 단위테스트/빌드 검증 ➔ `TEST_CASES.md`에 TC 등록 ➔ Git 커밋 & PR 작성.
