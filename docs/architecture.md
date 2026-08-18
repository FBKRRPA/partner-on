# 🏗️ PartnerOn v1.0 System Architecture

PartnerOn(파트너온) v1.0은 B2B 사무기기 / 복합기 렌탈 자산 관리 및 통합 CRM/ERP 시스템으로, 고성능 클라이언트-서버 구조와 현장 에이전트 기반 실시간 장비 관제 아키텍처를 취하고 있습니다.

---

## 📐 1. 전체 아키텍처 개요 (System Overview)

```
[ Frontend: Next.js 15 App Router / React 19 / TypeScript 5 / TailwindCSS / PM2 ]
                                    │
                                    ▼ (HTTPS / REST API + JWT Bearer Auth)
[ Backend API: Django REST Framework 5.1 / Python 3.12 / Gunicorn / Nginx ]
                │                                       │
                ▼ (Django ORM / Parameterized)          ▼ (SNMP Ingest Batch API)
  [ Database: PostgreSQL ]               [ Field Collector Agent ]
  (13 Master & Time-Series Tables)       (SNMP v2c / Pinpoint & Subnet Scan)
```

---

## 🌐 2. 레이어별 세부 아키텍처 (Layer Architecture)

### ① **프론트엔드 (Frontend Layer)**
* **기술 스택**: Next.js 15.x (App Router), React 19, TypeScript 5.x, Vanilla TailwindCSS, `@ducanh2912/next-pwa`
* **개발 & 운영 실행 환경**:
  * **개발(Dev)**: Windows PowerShell (`npx next dev -H 0.0.0.0 -p 3000`)
  * **운영(Prod)**: Linux Server (`Node.js 20+` PM2 무중단 데몬 + Nginx Proxy)
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
* **개발 & 운영 실행 환경**:
  * **개발(Dev)**: Windows (`python manage.py runserver 0.0.0.0:8000`)
  * **운영(Prod)**: Linux Server (`Systemd` + `Gunicorn` WSGI + Nginx 80/443 Reverse Proxy)
* **인증 및 시큐어 보안 아키텍처**:
  * SimpleJWT Bearer 토큰 및 pyotp TOTP / 6자리 이메일 OTP 2차 인증 (2FA)
  * 대표 승인 기기 통제 모듈 (`Device` 승인 테이블)
  * Multi-Tenant 사업장 데이터 격리 (`workplace=request.user.workplace`)
* **이중 수집 분리 및 시계열 적재 (Dual Ingestion & Upsert)**:
  * **등록 장비**: `PrinterAsset` ➔ `MonitoringPrinter` ➔ `MonitoringData` (Hot DB 1:1) & `MonitoringDataRecord` (Cold Time-Series `yyyymmdd` 1:N)
  * **미등록 장비**: 관제 오염 방지를 위해 `UnregisteredPrinter` 테이블 (`unique_together = ("workplace", "ip")`)에 자동 분리 적재
* **OID 단일 마스터 아키텍처**:
  * `oid_lists` (`OidListMaster`) 1개 테이블로 전사 OID 통합 관리

### ③ **현장 수집 에이전트 (Field Collector Agent Layer)**
* **기능**: SNMP v2c MIB OID 스캔 및 백엔드 Ingestion 패킷 전송 Engine
* **스캔 사전 준비**:
  * 스캔 직전 백엔드 API (`GET /api/v1/agent/target-assets/`)를 호출하여 백엔드 DB에 등록되어 있는 장비목록(`target_ips`, `target_serials`) 및 OID 맵 사전 조회
* **3가지 스캔 분기 메커니즘**:
  1. **조건 1 (Agent 자체 서브넷 지정 풀스캔 수집)**: Agent 자체 지정 서브넷 대역(.1~.254) 탐지 스캔 수행 ➔ 탐지 장비 전체 패킷 전송 ➔ 서버 미등록 탐지 DB(`unregistered_printers`) 및 자산 DB 분리 적재
  2. **조건 2 (미등록 장비 재스캔 파라미터 전달)**: `--scan-unregistered` / `-u` CLI 파라미터 또는 웹 요청 API 쿼리(`?scan_unregistered=true`) 수신 ➔ 로컬 서브넷 대역 풀 스캔 강제 수행
  3. **조건 3 (기존 등록 장비 정기 관제 수집)**: 정식 등록 기기 존재 ➔ 3분 주기 0.5초 초고속 등록 장비 전용 핀포인트 스캔 (Pinpoint Scan)

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
