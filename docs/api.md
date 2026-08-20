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

### ① **에이전트 인증 (`POST /api/v1/agent/authenticate/`)**
* **Request**: `{"auth_code": "AST-8A9F2K", "ip_range": "192.168.0.0/24"}`
* **Response (200 OK)**:
  ```json
  {
    "detail": "에이전트 인증 성공",
    "token": "token_agent_AST-8A9F2K",
    "workplace_name": "자사 본사",
    "ip_range": "192.168.0.0/24"
  }
  ```

### ② **수집 타겟 및 서브넷 조회 (`GET /api/v1/agent/target-assets/`)**
* **Header**: `Authorization: Bearer <agent_token>`
* **Response (200 OK)**:
  ```json
  {
    "target_serials": ["FX-9988102"],
    "target_ips": ["192.168.0.101"],
    "assigned_subnet": "192.168.0.0/24",
    "count": 1,
    "scan_unregistered": false
  }
  ```

### ③ **제조사 OID 리스트 다운로드 (`GET /api/v1/agent/oids/?sys_object_id=1.3.6.1.4.1.2988.1.1.2.1&vendor=Fujifilm`)**
* **Query Params**: `sys_object_id` (1순위 핀포인트 exact 검색), `vendor` (2순위), `model` (2순위)
* **Response (200 OK)**: `oid_lists` (`OidListMaster`) 단일 마스터 DB에서 sys_object_id로 1순위 파싱한 exact 26개 OID 맵 리턴 (`sys_object_id`, `serial_no`, `count_color`, `count_mono`, `toner_c`, `toner_m`, `toner_y`, `toner_k`, `drum_k` 등).

### ④ **배치 수집 Ingestion (`POST /api/v1/agent/ingest/`)**
* **Security Headers (패킷 무결성 및 암호화 설계 규격)**:
  * `Authorization`: `Bearer <agent_token>`
  * `X-Agent-Signature`: `HMAC-SHA256(payload_json_bytes, secret=agent_token)` (패킷 변조 Tampering 차단)
  * `X-Agent-Timestamp`: `<unix_timestamp>` (재전송 공격 Replay Attack 차단)
* **Ingest API IP Resolution Directive**: `ip_address` 및 `ip` 키 명칭을 완벽 호환 수용 (`item.get("ip_address") or item.get("ip") or "127.0.0.1"`)하여 고유 IP 상실에 따른 미등록 장비 덮어쓰기 버그 원천 방지.
* **Request Payload**:
  ```json
  {
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
* **이중 수집 분리 저장**:
  * DB 등록 정식 기기 ➔ `PrinterAsset` & `MonitoringData` (Hot DB) & `MonitoringDataRecord` (Cold 시계열 DB) 갱신
  * DB 미등록 신규 기기 ➔ `unregistered_printers` DB 테이블 (`UnregisteredPrinter`)에 분리 적재 및 최신화

---

## 📈 4. 모니터링 관제 API (/api/v1/monitoring)

### ① **카운터 사용량 현황 (`GET /api/v1/monitoring/usage/`)**
* **Query Params**: `start_date`, `end_date`, `serial_no`
* **Response**: `devices` (스냅샷) + `history` (`MonitoringDataRecord` 일자별 시계열 이력).

### ② **소모품 잔량 현황 (`GET /api/v1/monitoring/supplies/`)**
* **Query Params**: `start_date`, `end_date`, `serial_no`
* **Response**: 토너 C/M/Y/K, 드럼 잔량 %, 경고 레벨(`CRITICAL`, `WARNING`, `NORMAL`) 리턴.
