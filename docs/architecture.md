# 🏗️ PartnerOn v1.0 System Architecture

PartnerOn(파트너온) v1.0은 B2B 사무기기 / 복합기 렌탈 자산 관리 및 통합 CRM/ERP 시스템으로, 확장 가능한 클라이언트-서버 구조와 에이전트 기반 실시간 장비 관제 아키텍처를 취하고 있습니다.

---

## 📐 1. 전체 아키텍처 개요 (System Overview)

```
[ Frontend: Next.js 15 App Router / React 19 / PWA ]
                      │
                      ▼ (HTTPS / REST API + JWT Bearer)
[ Backend API: Django REST Framework 5.1 / Python 3.12 ]
          │                                 │
          ▼                                 ▼
[ Database: PostgreSQL ]      [ Field Agents: Python SNMP Collector ]
(13 Tables / Hot & Cold)      (SNMP v2c / Subnet & Pinpoint Scan)
```

---

## 🌐 2. 주요 아키텍처 구성 요소 (Components)

### ① **프론트엔드 (Frontend Layer)**
* **기술 스택**: Next.js 15.x (App Router), React 19, TypeScript 5.x, Vanilla TailwindCSS
* **동적 IP 자동 감지 (Dynamic IP Base URL)**:
  * 로컬 환경, 내부망 IP, 실서버 도메인을 접속 위치에 따라 자동 동적 할당 (`frontend/lib/auth-api.ts` `getApiBaseUrl()`)
  * `http://localhost:8000` 하드코딩을 배제하여 IP 접속 시 `Failed to fetch` 오류 원천 차단
* **PWA & 오프라인 폴백 (Progressive Web App)**:
  * `@ducanh2912/next-pwa` 서비스 워커(`sw.js`) 연동
  * 오프라인 시 `/offline` 폴백 안내 지원

### ② **백엔드 (Backend API Layer)**
* **기술 스택**: Python 3.12+, Django 5.1.x, Django REST Framework 3.15.x
* **인증 및 보안 모듈 (Auth & Security)**:
  * SimpleJWT Bearer 토큰 및 pyotp TOTP/Email OTP 2차 인증 (2FA)
  * 대표 승인 기기 통제 시스템 (`accounts_device` 테이블)
  * Broken Access Control (BOLA) 방지 multi-tenant 사업장 격리 (`workplace=request.user.workplace`)
* **데이터 분기 수집 (Dual Data Ingestion)**:
  * 정식 등록 복합기(`PrinterAsset`) ➔ 관제 마스터 DB 실시간 갱신
  * 미등록 탐지 복합기 ➔ 관제 오염 방지를 위해 `unregistered_printers` 테이블에 분리 저장

### ③ **현장 에이전트 (Field Collector Agent Layer)**
* **기술 스택**: Python 3.12+, `agent/snmp_scanner.py`, `agent/oid_inference.py`
* **SNMP 수집 엔진**:
  * SNMP v2c 프로토콜 기반 로컬 C-Class 서브넷(.1~.254) 및 지정 IP 스캔
  * OID 추론 엔진을 통해 제조사(Fujifilm, Canon, Ricoh 등) 자동 탐지
* **수집 모드 스위칭**:
  * 최초 등록 0대 또는 CLI `-u`/`--scan-unregistered` ➔ **풀 스캔 (Full Scan)**
  * 기존 등록 장비 존재 시 ➔ 0.5초 **핀포인트 스캔 (Pinpoint Scan)**

---

## 🔒 3. 세션 관리 및 401 만료 리다이렉트 아키텍처

```
[API 호출 (Fetch)] ──(401 Unauthorized)──> [readJsonResponse Interceptor]
                                                    │
                                                    ▼ (Session Storage Clear)
                                    [Redirect to /login?expired=true&returnUrl=...]
                                                    │
                                                    ▼ (Login Success)
                                    [Return to Previous Page (returnUrl)]
```

* 엑세스/리프레시 토큰 만료 시 사용자 보안 보호를 위해 즉시 세션을 비우고 로그인 화면으로 안전 리다이렉트합니다.
* 사용자가 접속해 있던 페이지 URL(`returnUrl`)을 유지하여 재로그인 시 보던 관제 화면으로 즉시 자동 원복됩니다.
