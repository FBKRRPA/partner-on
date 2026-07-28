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
  * 7대 대분류 25개 소분류 메가 드롭다운 네비게이션

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
* 상단 헤더 메뉴는 [AppHeader.tsx](file:///d:/workspace/Partneron_v1/frontend/components/layout/AppHeader.tsx)의 7대 대분류 + 25개 소분류 드롭다운 네비게이션을 유지합니다. (아이콘 없이 깔끔한 텍스트 렌더링)
* 새로 추가되는 소분류 메뉴는 `MenuScaffoldPage` 컴포넌트를 활용하여 일관된 Breadcrumb (`카테고리 › 소분류`)과 모듈 카드 UI를 제공합니다.

---

## 🗄️ 4. 데이터베이스 스키마 & ORM 모델 (Database Schema)

모든 데이터베이스 구조는 [backend/accounts/models.py](file:///d:/workspace/Partneron_v1/backend/accounts/models.py)에 정의되어 있습니다.

```
+------------------+         1 : N         +------------------+
|    Workplace     | --------------------- |       User       |
+------------------+                       +------------------+
| id               |                       | id               |
| name (unique)    |                       | email (unique)   |
| address          |                       | name             |
| enforce_2fa_owner|                       | role (OWNER/...) |
| enforce_2fa_m... |                       | is_2fa_enabled   |
| enforce_2fa_e... |                       | totp_secret      |
+------------------+                       | backup_codes     |
                                           +------------------+
                                                     | 1
                                                     | : N
                                           +------------------+
                                           |      Device      |
                                           +------------------+
                                           | id               |
                                           | device_uuid      |
                                           | device_name      |
                                           | ip_address       |
                                           | status (PENDING..|
                                           +------------------+
```

### 1) `Workplace` (사업장 모델)
* **`name`**: `CharField(max_length=120, unique=True)` - 사업장 명칭
* **`enforce_2fa_owner`**: `BooleanField(default=False)` - 대표 직급 2FA 필수 강제 여부
* **`enforce_2fa_manager`**: `BooleanField(default=False)` - 매니저 직급 2FA 필수 강제 여부
* **`enforce_2fa_employee`**: `BooleanField(default=False)` - 사원 직급 2FA 필수 강제 여부

### 2) `User` (커스텀 사용자 모델 - AbstractUser 상속)
* **`email`**: `EmailField(unique=True)` - 로그인 ID (USERNAME_FIELD)
* **`role`**: `Role.choices` (`OWNER`: 대표, `MANAGER`: 매니저, `EMPLOYEE`: 사원)
* **`workplace`**: `ForeignKey(Workplace, on_delete=models.PROTECT)` - 소속 사업장
* **`is_2fa_enabled`**: `BooleanField(default=False)` - 유저 개인 2FA 활성화 여부
* **`totp_secret`**: `CharField(max_length=64)` - pyotp TOTP 비밀키
* **`otp_code` / `otp_created_at`**: 이메일 OTP 6자리 번호 및 발송 일시
* **`backup_codes`**: `JSONField(default=list)` - 8자리 일회성 비상 복구 코드 10개
* **`requires_2fa()` 메서드**: 개인 2FA 온/오프 + 사업장 역할별 강제 정책을 종합 평가하여 Boolean 리턴

### 3) `Device` (접속 기기 승인 통제 모델)
* **`user`**: `ForeignKey(User, on_delete=models.CASCADE)` - 대상 유저
* **`device_uuid`**: `CharField(max_length=100)` - 브라우저/기기 고유 UUID
* **`device_name`**: `CharField(max_length=150)` - 디바이스 및 OS/브라우저 명칭
* **`ip_address`**: `GenericIPAddressField` - 접속 IP (Nginx 프록시 X-Forwarded-For 연동)
* **`status`**: `Status.choices` (`PENDING`: 승인 대기, `APPROVED`: 승인됨, `REJECTED`: 거절됨)

---

## 🛡️ 5. 백엔드 개발 규칙 (Backend Rules)

### ① **2FA (Two-Factor Authentication) 검증 흐름**
* 유저의 2FA 요구 여부는 반드시 `user.requires_2fa()` 메서드를 호출하여 판단합니다.
* 2FA가 필요한 경우 `LoginView`는 JWT 대신 `require_2fa: True`와 `pre_token`, `otp_code`를 리턴하고, 프론트엔드의 2FA verification modal을 통해 `Verify2FAView`에서 최종 JWT를 발급합니다.

### ② **REST API URL 규격**
* 인증/계정 관련 API: `/api/v1/auth/...`
* 사업장/보안정책 관련 API: `/api/v1/workplace/...`
* 모든 뷰 클래스는 DRF `APIView` 또는 `TokenObtainPairView`를 상속받아 명확한 HTTP Status Code(200 OK, 400 Bad Request, 403 Forbidden)를 반환합니다.

### ③ **Django ORM 및 데이터베이스 무결성**
* 모델 변경 시 반드시 `python manage.py makemigrations` 및 `python manage.py migrate`를 수행합니다.
* 기존 comments 및 docstring을 훼손하지 않고 유지합니다.

---

## 🧪 6. 테스트 및 품질 검증 (Verification Standard)

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
   *(모든 정적 페이지(34/34) 및 PWA 컴파일이 오류 없이 성공해야 함)*

---

## 📝 7. Git 커밋 컨벤션 (Git Commit Convention)

모든 커밋 메시지는 **Conventional Commits** 형식을 따릅니다:

* `feat:` 새로운 기능 추가 (예: `feat: Add 2FA TOTP QR code modal`)
* `fix:` 버그 수정 (예: `fix: Resolve dynamic IP base URL resolution`)
* `refactor:` 기능 변경 없는 코드 구조 개선
* `docs:` 문서 수정 (예: `docs: Add AGENTS.md project rules`)
* `style:` 코드 포맷팅, 세미콜론 누락 등 (코드의 로직 변경 없음)
* `test:` 테스트 코드 추가 및 수정
