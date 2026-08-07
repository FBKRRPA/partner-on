# 💻 PartnerOn v1.0 Coding Style & Security Guidelines

이 문서는 PartnerOn 프로젝트의 백엔드(Python/Django) 및 프론트엔드(Next.js/TypeScript) 개발 시 준수해야 하는 **코딩 스타일 및 시큐어 코딩 지침서**입니다.

---

## 🛡️ 1. 시큐어 코딩 지침 (Web Vulnerability Prevention)

OWASP Top 10 및 KISA 가이드 지침에 따라 아래 시큐어 코딩 규칙을 엄격 준수합니다.

### ① **SQL Injection 방지**
* ❌ **금지**: `cursor.execute("SELECT ... WHERE email = '%s'" % user_input)` 파이썬 포맷팅 직접 쿼리 절대 금지.
* ✅ **원칙**: 반드시 Django ORM 메서드 (`User.objects.filter(...)`) 및 Parameterized Query를 사용합니다.

### ② **Django ORM Q 객체 명시적 임포트 수칙**
* ❌ **금지**: `from django.db import models` 후 `models.Q`를 불완전 호출하여 `NameError`로 500 서버 장애를 일으키는 행위.
* ✅ **원칙**: 쿼리 소스코드 상단에 `from django.db.models import Q`를 명시적으로 임포트하여 사용합니다.

### ③ **Broken Access Control & BOLA (타 사업장 무단 접근) 방지**
* ❌ **금지**: `User.objects.get(pk=pk)` 처럼 PK만으로 객체를 바로 조회하는 행위.
* ✅ **원칙**: 모든 데이터 조회의 최상위 조건에는 로그인된 유저의 소속 사업장 조건(`workplace=request.user.workplace`)을 결합하여 검증합니다.
  ```python
  member = User.objects.filter(pk=pk, workplace=request.user.workplace).first()
  ```

### ④ **민감 정보 노출 방지 (Sensitive Data Exposure)**
* 비밀번호는 반드시 PBKDF2 단방향 솔티드 해시(`set_password()`)로 저장합니다.
* API Serializer 응답 JSON에서 `password`, `totp_secret`, `otp_code`를 절대 포함하지 않거나 `write_only=True`를 명시합니다.

---

## 🐍 2. 백엔드 개발 컨벤션 (Python / Django)

### ① **API Base URL 동적 할당 유틸리티 사용 (프론트엔드)**
* ❌ **금지**: `http://localhost:8000` 하드코딩 절대 금지.
* ✅ **원칙**: `getApiBaseUrl()` 유틸리티를 사용하여 접속 환경별 API 주소를 동적 획득합니다.
  ```typescript
  import { getApiBaseUrl } from "@/lib/auth-api";
  const url = `${getApiBaseUrl()}/api/v1/auth/...`;
  ```

### ② **카운터 수치 단조 증가(Monotonic Increase) 규칙**
* 장비 사용량 카운터(`count_color`, `count_mono`)는 시간이 지남에 따라 줄어들 수 없는 누적 수치이므로, 수집 적재 시 `max(asset.count_color or 0, new_count)` 규칙을 사용하여 이전 값보다 줄어드는 역전 현상을 원천 방지합니다.

---

## 🎨 3. 프론트엔드 개발 컨벤션 (TypeScript / React)

### ① **XSS (Cross-Site Scripting) 방지**
* React/Next.js에서 `dangerouslySetInnerHTML` 사용을 금지하며, 클라이언트 출력 텍스트는 React 기본 JSX 자동 이스케이핑을 거칩니다.

### ② **UI 아이콘 & 이모지 사용 제한 (Text-First Design)**
* ❌ **금지**: 버튼, 헤더, 카테고리 빵부스러기, 카드 타이틀 등에 유니코드 이모지(📌, 👥, 📱 등) 및 조잡한 아이콘 삽입 금지.
* ✅ **원칙**: 텍스트 중심의 차분하고 정돈된 B2B 프리미엄 UI 레이아웃을 유지하며, 시각적 강조가 필요한 경우 브랜드 컬러 뱃지(`bg-[#01916D]/10 text-[#01916D]`)와 상태 컬러 태그만 활용합니다.
