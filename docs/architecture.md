# 🏗️ PartnerOn v1.0 System Architecture

PartnerOn(파트너온) v1.0은 B2B 사무기기 / 복합기 렌탈 자산 관리 및 통합 CRM/ERP 시스템으로, 고성능 클라이언트-서버 구조와 현장 에이전트 기반 실시간 장비 관제 아키텍처를 취하고 있습니다.

---

## 📐 1. 전체 아키텍처 개요 (System Overview)

```
[ Frontend: Next.js 15 App Router / React 19 / TypeScript 5 / TailwindCSS ]
                                    │
                                    ▼ (HTTPS / REST API + JWT Bearer Auth)
[ Backend API: Django REST Framework 5.1 / Python 3.12 / SimpleJWT / PyOTP ]
               │                                       │
               ▼ (Django ORM / Parameterized)          ▼ (SNMP Ingest Batch API)
 [ Database: PostgreSQL ]               [ Field Collector Agent: Python 3.12 ]
 (16 Master & Time-Series Tables)       (SNMP v2c / Pinpoint & Full Subnet Scan)
```

---

## 🌐 2. 레이어별 세부 아키텍처 (Layer Architecture)

### ① **프론트엔드 (Frontend Layer)**
* **기술 스택**: Next.js 15.x (App Router), React 19, TypeScript 5.x, Vanilla TailwindCSS, `@ducanh2912/next-pwa`
* **Dynamic IP Base URL Resolution**:
  * 접속 위치(로컬, 내부망 IP, 도메인)에 맞추어 API Base URL을 동적 탐지 (`frontend/lib/auth-api.ts` `getApiBaseUrl()`)
  * `http://localhost:8000` 하드코딩을 100% 제거하여 IP 직접 접속 시 `Failed to fetch` 에러 차단
* **네비게이션 & RBAC 권한 제어**:
  * 7대 대분류 25개 소분류 메가 드롭다운 네비게이션 (`AppHeader.tsx`)
  * 유저 직급(`OWNER`, `ADMIN_STAFF`, `SALES`, `CE`) 및 `RoleMenuPermission` 매핑 테이블 기반 동적 메뉴 차단
* **PWA & 오프라인 폴백 지원**:
  * 서비스 워커(`sw.js`) 및 `manifest.json` 연동으로 모바일/태블릿 PWA 설치 지원
  * 인터넷 유실 시 `/offline` 폴백 페이지 자동 안내

### ② **백엔드 (Backend API Layer)**
* **기술 스택**: Python 3.12+, Django 5.1.x, Django REST Framework 3.15.x, PyOTP
* **인증 및 시큐어 보안 아키텍처**:
  * SimpleJWT Bearer 토큰 및 pyotp TOTP / 6자리 이메일 OTP 2차 인증 (2FA)
  * 대표 승인 기기 통제 모듈 (`Device` 승인 테이블)
  * Multi-Tenant 사업장 데이터 격리 (`workplace=request.user.workplace`)
* **이중 수집 분리 및 시계열 적재 (Dual Ingestion & Upsert)**:
  * **등록 장비**: `PrinterAsset` ➔ `MonitoringPrinter` ➔ `MonitoringData` (Hot DB 1:1) & `MonitoringDataRecord` (Cold Time-Series `yyyymmdd` 1:N)
  * **미등록 장비**: 관제 오염 방지를 위해 `UnregisteredPrinter` 테이블 (`unique_together = ("workplace", "ip")`)에 자동 분리 적재

### ③ **현장 에이전트 수집기 (Field Collector Agent Layer)**
* **기술 스택**: Python 3.12+, `agent/snmp_scanner.py`, `agent/oid_inference.py`, `agent/main.py`
* **SNMP v2c 스캐닝 엔진**:
  * Standard Printer MIB (1.3.6.1.2.1.1.1.0) 및 Xerox/Fujifilm OID Tree 추론 탐지
  * IP 오프셋 + 시각(Timestamp) 분 단위 가중치(`min_offset`) 기반 다이나믹 시계열 스냅샷 생성
* **3가지 스캔 분기 메커니즘**:
  1. **조건 1 (등록 장비 0대 상태)**: 서브넷(.1~.254) 풀 스캔 (Full Scan)
  2. **조건 2 (CLI `-u`/`--scan-unregistered` 수신)**: 서브넷 풀 스캔 (Full Scan)
  3. **조건 3 (정기 수집 구동)**: 0.5초 초고속 등록 장비 전용 핀포인트 스캔 (Pinpoint Scan)

---

## 🔒 3. 세션 만료 및 401 Unauthorized 리다이렉트 흐름

```
[Fetch API Call] ──(401 Unauthorized)──> [readJsonResponse Interceptor]
                                                  │
                                                  ▼ (Clear Session Storage)
                                  [Redirect /login?expired=true&returnUrl=...]
                                                  │
                                                  ▼ (Re-login Success)
                                  [Auto Navigate back to target returnUrl]
```

1. 토큰 만료 또는 401 Unauthorized 반환 시 세션을 즉시 파기하고 보안 안내 뱃지와 함께 로그인 화면으로 안전 리다이렉트합니다.
2. 기존 보던 페이지 주소(`returnUrl`)를 파라미터로 전달하여, 재로그인 완료 시 보고 있던 관제 화면으로 즉시 되돌아갑니다.
