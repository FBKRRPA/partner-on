# 🤖 AGENTS.md - PartnerOn AI Pair-Programming & Coding Guidelines

이 문서는 **PartnerOn (파트너온) v1.0** 프로젝트에서 다른 개발자나 LLM 코딩 에이전트(Antigravity, Cursor, Claude Code, GitHub Copilot 등)가 코드를 작성, 수정, 확장할 때 반드시 준수해야 하는 **프로젝트 표준 및 코딩 규칙 문서**입니다.

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

### ③ **UI/UX 디자인 패러다임 (Rich & Premium UI)**
* **Glassmorphism**: 헤더 및 모달 패널에 `backdrop-blur-md`, `bg-white/95`, `border-slate-200/80` 적용.
* **Rounded Card Aesthetic**: 모달 및 대시보드 카드 레이아웃은 `rounded-2xl` 또는 `rounded-3xl`의 부드러운 라운딩 적용.
* **Micro-Animations**: 드롭다운 및 모달 팝업 시 `animate-in fade-in slide-in-from-top-2`, 버튼 및 링크 클릭 시 `transition-all duration-150` 유지.
* **Status Badges 규격**:
  * ✅ 승인 완료 / 활성: `bg-emerald-100 text-[#01916D]`
  * ⏳ 승인 대기 / 2FA 필수: `bg-amber-100 text-amber-800`
  * ❌ 승인 거절 / 위험: `bg-rose-100 text-[#E01E35]`

### ④ **메뉴 라우터 & 레이아웃 컨벤션**
* 상단 헤더 메뉴는 [AppHeader.tsx](file:///d:/workspace/Partneron_v1/frontend/components/layout/AppHeader.tsx)의 7대 대분류 + 25개 소분류 드롭다운 네비게이션을 유지합니다.
* 새로 추가되는 소분류 메뉴는 `MenuScaffoldPage` 컴포넌트를 활용하여 일관된 Breadcrumb (`카테고리 › 소분류`)과 모듈 카드 UI를 제공합니다.

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
  * `role`: 4단계 Enum (`OWNER`: 관리자(대표), `ADMIN_STAFF`: 관리자(사무직원), `SALES`: 영업, `CE`: CE)
  * `workplace_id`: ForeignKey (`Workplace` 참조)
  * `is_2fa_enabled`: Boolean - 개인 2FA 활성화 여부
  * `totp_secret`: `CharField(max_length=64)` - pyotp TOTP 비밀키
  * `otp_code` / `otp_created_at`: 이메일 OTP 6자리 및 발송 시각
  * `backup_codes`: `JSONField` - 8자리 일회성 비상 복구 코드 10개
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
* 메뉴 접근 권한 관련 API: `/api/v1/workplace/permissions/`
* 모든 뷰 클래스는 DRF `APIView` 또는 `TokenObtainPairView`를 상속받아 명확한 HTTP Status Code(200 OK, 400 Bad Request, 403 Forbidden)를 반환합니다.

### ③ **Django ORM 및 데이터베이스 무결성 & AGENTS.md 동기화 (필수 지침)**
* ⚠️ **[중요] 모델/테이블 추가 및 필드 수정 시 필수 절차**:
  1. `models.py` 수정 후 `python manage.py makemigrations` 및 `python manage.py migrate` 수행.
  2. **새로운 모델/테이블이 생성되거나 필드가 변경된 경우, LLM 코딩 에이전트는 반드시 `AGENTS.md` 파일의 `4. 데이터베이스 스키마 & ORM 모델` 섹션에 해당 테이블 및 필드 설명을 업데이트해야 합니다.**

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
