# 💻 PartnerOn v1.0 Coding Style & Security Guidelines

이 문서는 PartnerOn 프로젝트의 백엔드(Python/Django), 프론트엔드(Next.js/TypeScript), 에이전트(Python Agent) 소스코드 개발 시 준수해야 하는 **코딩 스타일 및 보안 가이드라인**입니다.

---

## 🛡️ 1. 백엔드 시큐어 코딩 & 웹 취약점 방지 수칙

OWASP Top 10 및 KISA 가이드 지침에 따라 아래 시큐어 코딩 수칙을 엄격히 준수해야 합니다.

### ① **SQL Injection 방지**
* ❌ **금지**: `cursor.execute("SELECT ... WHERE email = '%s'" % user_input)` 직접 포맷팅 쿼리 금지.
* ✅ **원칙**: 반드시 Django ORM 메서드(`filter`, `get`) 및 Parameterized Query를 활용합니다.

### ② **Django ORM Q 객체 명시적 임포트 수칙**
* ❌ **금지**: `from django.db import models` 후 `models.Q`를 사용하여 `NameError`로 500 서버 장애를 일으키는 행위.
* ✅ **원칙**: 쿼리 소스코드 상단에 `from django.db.models import Q`를 명시적으로 임포트하여 사용합니다.

### ③ **Broken Access Control & BOLA (타인 데이터 무단 접근) 방지**
* ❌ **금지**: URL 파라미터 `pk`만으로 객체를 바로 조회(`User.objects.get(pk=pk)`)하여 타 사업장 데이터에 접근하게 방치하는 행위.
* ✅ **원칙**: 모든 데이터 조회의 최상위 조건에는 로그인된 유저의 소속 사업장 조건(`workplace=request.user.workplace`)을 결합합니다.
  ```python
  member = User.objects.filter(pk=pk, workplace=request.user.workplace).first()
  ```

### ④ **민감 정보 노출 방지 (Sensitive Data Exposure)**
* 비밀번호는 반드시 `user.set_password()`를 거쳐 PBKDF2 단방향 솔티드 해시로 암호화 저장합니다.
* REST API Serializer 응답 JSON에서 `password`, `totp_secret`, `otp_code`를 제외하거나 `write_only=True`를 명시합니다.

### ⑤ **카운터 수치 단조 증가(Monotonic Increase) 규칙**
* 복합기 카운터(`count_color`, `count_mono`)는 시간이 흐름에 따라 절대 감소할 수 없는 누적 수치이므로, 수집 적재 시 `max(asset.count_color or 0, new_count)` 연산을 거쳐 데이터 역전 현상을 방지합니다.

---

## 🎨 2. 프론트엔드 개발 컨벤션 (Next.js / TypeScript)

### ① **API Base URL 동적 할당 유틸리티 사용 (필수)**
* ❌ **금지**: `http://localhost:8000` 하드코딩 금지.
* ✅ **원칙**: `getApiBaseUrl()` 유틸리티를 호출하여 호스트 환경별 API 주소를 동적으로 획득합니다.
  ```typescript
  import { getApiBaseUrl } from "@/lib/auth-api";
  const url = `${getApiBaseUrl()}/api/v1/auth/...`;
  ```

### ② **XSS (Cross-Site Scripting) 방지**
* React/Next.js에서 `dangerouslySetInnerHTML` 사용을 원천 금지하며, 출력 텍스트는 React JSX 이스케이핑을 거칩니다.

### ③ **UI 이모지 및 아이콘 사용 제한 (Text-First Design)**
* ❌ **금지**: 버튼, 헤더, 카테고리 빵부스러기, 카드 타이틀 등에 유니코드 이모지(📌, 👥, 📱, 📈 등) 및 조잡한 아이콘 삽입 금지.
* ✅ **원칙**: 텍스트 중심의 차분하고 정돈된 B2B 프리미엄 UI 레이아웃을 유지하며, 시각적 강조가 필요한 경우 브랜드 컬러 뱃지(`bg-[#01916D]/10 text-[#01916D]`)와 상태 컬러 태그만 활용합니다.

### ④ **개발(Windows) 및 운영(Linux) 실행 수칙**
* **개발(Dev - Windows)**: PowerShell에서 `npx next dev -H 0.0.0.0 -p 3000` 및 `python manage.py runserver 0.0.0.0:8000`으로 0.0.0.0 바인딩 구동
* **운영(Prod - Linux)**: Linux 서버 환경에서 `Nginx Reverse Proxy` + `Gunicorn` WSGI + Node.js `PM2` 무중단 데몬 관리 구동
