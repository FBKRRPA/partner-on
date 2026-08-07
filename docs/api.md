# 📡 PartnerOn v1.0 REST API Specification

PartnerOn 백엔드 시스템의 REST API 엔드포인트 명세서입니다. 모든 요청 및 응답은 JSON 표준 규격을 사용합니다.

---

## 🔑 1. 인증 API (/api/v1/auth)

### ① **로그인 (`POST /api/v1/auth/login/`)**
* **Request**:
  ```json
  {
    "email": "owner@partneron.com",
    "password": "Password123!",
    "device_uuid": "UUID-XXXX",
    "device_name": "Chrome / Windows"
  }
  ```
* **Response (2FA 불필요 - 200 OK)**:
  ```json
  {
    "access": "eyJhbGciOi...",
    "refresh": "eyJhbGciOi...",
    "user": {
      "id": 1,
      "email": "owner@partneron.com",
      "name": "홍길동",
      "role": "OWNER",
      "workplace_name": "파트너온 본사"
    }
  }
  ```
* **Response (2FA 필수 - 200 OK)**:
  ```json
  {
    "require_2fa": true,
    "pre_token": "TEMP_TOKEN_XXXX",
    "email": "owner@partneron.com"
  }
  ```

### ② **2차 인증 검증 (`POST /api/v1/auth/verify-2fa/`)**
* **Request**: `{"email": "owner@partneron.com", "otp_code": "123456"}` 또는 비상 복구 코드.
* **Response (200 OK)**: Access/Refresh JWT 토큰 발급.

---

## 🏢 2. 사업장 및 자산 API (/api/v1/workplace)

### ① **등록 복합기 목록 및 등록 (`GET/POST /api/v1/workplace/printers/`)**
* **GET**: 사업장 소속 `PrinterAsset` 정식 등록 기기 목록 리턴.
* **POST**: 신규 수동 등록 (`serial_no`, `model_name`, `customer_name`, `location`, `ip_address`).
* **Side Effect**: 등록 처리 시 `unregistered_printers` 테이블 동종 장비가 있으면 `registered=True`, `confirmed_serial_no` 자동 업데이트.

---

## 🤖 3. 에이전트 수집 API (/api/v1/agent)

### ① **수집 타겟 조회 (`GET /api/v1/agent/target-assets/`)**
* **Header**: `X-Agent-Auth-Code: AST-XXXXXX`
* **Response (200 OK)**:
  ```json
  {
    "target_serials": ["FX-721495-192168055", "FX-721495-192168100"],
    "target_ips": ["192.168.1.55", "192.168.1.100"]
  }
  ```

### ② **배치 수집 적재 (`POST /api/v1/agent/ingest/`)**
* **Ingest API IP Resolution Directive**: `ip_address` 및 `ip` 키 명칭을 완벽 호환 수용 (`item.get("ip_address") or item.get("ip") or "127.0.0.1"`)하여 고유 IP 상실에 따른 미등록 장비 덮어쓰기 버그 원천 방지.
* **Request Payload**:
  ```json
  {
    "auth_code": "AST-XXXXXX",
    "devices": [
      {
        "serial_no": "FX-721495-192168055",
        "ip_address": "192.168.1.55",
        "model_name": "ApeosPort-VII C3373",
        "count_color": 29100,
        "count_mono": 76470,
        "count_total": 105570,
        "toner_c": 52,
        "toner_m": 42,
        "toner_y": 47,
        "toner_k": 10,
        "drum_k": 89
      }
    ]
  }
  ```

---

## 📈 4. 모니터링 관제 API (/api/v1/monitoring)

### ① **카운터 사용량 현황 (`GET /api/v1/monitoring/usage/`)**
* **Query Params**: `start_date`, `end_date`, `serial_no`
* **Response**: `devices` (스냅샷) + `history` (`MonitoringDataRecord` 일자별 시계열 이력).

### ② **소모품 잔량 현황 (`GET /api/v1/monitoring/supplies/`)**
* **Query Params**: `start_date`, `end_date`, `serial_no`
* **Response**: 토너 C/M/Y/K, 드럼 잔량 %, 경고 레벨(`CRITICAL`, `WARNING`, `NORMAL`) 리턴.
