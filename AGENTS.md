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

## 🎨 3. 프론트엔드 개발 규칙 (Frontend Rules)

### ① **API Base URL 동적 할당 (필수 준수)**
* ❌ **금지**: `http://localhost:8000` 하드코딩 절대 금지 (IP 접속 시 `Failed to fetch` 오류 원인)
* ✅ **원칙**: 모든 API 요청은 `frontend/lib/auth-api.ts`의 `getApiBaseUrl()` 유틸리티를 호출하여 사용해야 합니다.
  ```typescript
  import { getApiBaseUrl } from "@/lib/auth-api";
  const url = `${getApiBaseUrl()}/api/v1/auth/...`;
  ```

### ② **디자인 시스템 & UI/UX 가이드 (Fujifilm Brand Identity)**
* **메인 브랜드 컬러**: `#01916D` (Fujifilm Emerald Green)
* **경고/에러 컬러**: `#E01E35`
* **텍스트/배경 컬러**: `#333333` (주요 헤딩), `#FAFAFA` (기본 배경)
* **디자인 요구사항**:
  * 단순 Minimum Viable Product 형태를 지양하고 **Rich & Premium UI** (Glassmorphism, subtle micro-animations, rounded-2xl/3xl 모달 카드)를 적용합니다.
  * 상단 헤더 브랜드 바에는 `fujifilm-gradation-bg` 클래스를 유지합니다.

### ③ **메뉴 라우팅 컨벤션**
* 메뉴 구조 변경 시 [AppHeader.tsx](file:///d:/workspace/Partneron_v1/frontend/components/layout/AppHeader.tsx)의 `menuTree` 데이터를 업데이트합니다.
* 새로 추가되는 서브 라우트는 `MenuScaffoldPage` 컴포넌트를 활용하여 일관된 Breadcrumb과 대시보드 카드를 제공합니다.

---

## 🛡️ 4. 백엔드 개발 규칙 (Backend Rules)

### ① **2FA (Two-Factor Authentication) 검증 흐름**
* 유저의 2FA 요구 여부는 반드시 `user.requires_2fa()` 메서드를 호출하여 판단합니다.
  ```python
  def requires_2fa(self) -> bool:
      if self.is_2fa_enabled:
          return True
      if self.workplace:
          if self.role == self.Role.OWNER and self.workplace.enforce_2fa_owner:
              return True
          if self.role == self.Role.MANAGER and self.workplace.enforce_2fa_manager:
              return True
          if self.role == self.Role.EMPLOYEE and self.workplace.enforce_2fa_employee:
              return True
      return False
  ```
* 2FA가 필요한 경우 `LoginView`는 JWT 대신 `require_2fa: True`와 `pre_token`, `otp_code`를 리턴하고, 프론트엔드의 2FA verification modal을 통해 `Verify2FAView`에서 최종 JWT를 발급합니다.

### ② **REST API URL 규격**
* 인증/계정 관련 API: `/api/v1/auth/...`
* 사업장/보안정책 관련 API: `/api/v1/workplace/...`
* 모든 뷰 클래스는 DRF `APIView` 또는 `TokenObtainPairView`를 상속받아 명확한 HTTP Status Code(200 OK, 400 Bad Request, 403 Forbidden)를 반환합니다.

### ③ **Django ORM 및 데이터베이스 무결성**
* 모델 변경 시 반드시 `python manage.py makemigrations` 및 `python manage.py migrate`를 수행합니다.
* 기존 comments 및 docstring을 훼손하지 않고 유지합니다.

---

## 🧪 5. 테스트 및 품질 검증 (Verification Standard)

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

## 📝 6. Git 커밋 컨벤션 (Git Commit Convention)

모든 커밋 메시지는 **Conventional Commits** 형식을 따릅니다:

* `feat:` 새로운 기능 추가 (예: `feat: Add 2FA TOTP QR code modal`)
* `fix:` 버그 수정 (예: `fix: Resolve dynamic IP base URL resolution`)
* `refactor:` 기능 변경 없는 코드 구조 개선
* `docs:` 문서 수정 (예: `docs: Add AGENTS.md project rules`)
* `style:` 코드 포맷팅, 세미콜론 누락 등 (코드의 로직 변경 없음)
* `test:` 테스트 코드 추가 및 수정
