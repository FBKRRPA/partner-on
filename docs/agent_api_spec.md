# PartnerOn v1.0 Field Agent Collector REST API Interface Specification

본 문서는 PartnerOn(파트너온) v1.0 현장 수집 에이전트(Field Agent Collector)와 백엔드 클라우드 서버 간의 **REST API 통신 명세서**입니다.

---

## 1. 통신 기본 사양 (General Overview)

* **통신 프로토콜**: HTTPS / TLS 1.3 (Security Encrypted Channel)
* **API Base URL**: `https://<클라우드서버IP_또는_도메인>/api/v1/agent/`
* **보안 헤더 규격**:
  * `Authorization`: `Bearer <agent_token>`
  * `X-Agent-Signature`: `HMAC-SHA256(payload_json_bytes, secret=agent_token)` (패킷 변조 Tampering 방지)
  * `X-Agent-Timestamp`: `<unix_timestamp>` (재전송 공격 Replay Attack 방지)

---

## 2. API 단계별 세부 명세 (Interface Specifications)

---

### ① [1단계] 수집기 최초 인증 및 토큰 교환 (`AgentAuthExchange`)

* **통신 URL**: `https://<서버IP>/api/v1/agent/register/`
* **HTTP Method**: `POST`
* **설명**: 현장에 설치된 Agent가 관리자 웹 화면에서 발급받은 8자리 인증 코드(`AST-XXXXXX`)를 전달하여 보안 토큰(`agent_token`)을 최초 1회 자동으로 교환받는 API.

#### • Request (JSON)
```json
{
    "authCode": "AST-8A9F2K",
    "agentName": "현장 수집기 Agent (사무실 1층)",
    "localIp": "192.168.0.229"
}
```

#### • Response (Success Case)
```json
{
    "status": "success",
    "result": {
        "agentToken": "token_agent_AST-8A9F2K_9f8a7b6c5d4e3f2a1b",
        "workplaceName": "삼우비즈니스 파트너사",
        "customerName": "자사 본사",
        "customerId": "CUST-1002",
        "assignedSubnet": "192.168.0.0/24",
        "pingIntervalSec": "180"
    }
}
```

#### • Response (Error Case)
```json
{
    "status": "authCodeInvalid",
    "detail": "유효하지 않거나 만료된 8자리 인증 코드입니다."
}
```
* **status 코드**:
  * `success`: 정상 토큰 교환 완료 (`AgentCollector.status = ONLINE`)
  * `authCodeNull`: authCode가 null이거나 빈 문자열일 때
  * `authCodeInvalid`: DB에 존재하지 않는 인증 코드일 때
  * `fail`: 서버 시스템 또는 DB 처리 에러

* **memo (비즈니스 로직)**:
  * `agentToken`은 에이전트 로컬 PC의 `config.dat` 파일에 암호화하여 저장되며, 이후 모든 API 호출 시 `Authorization: Bearer <agentToken>` 헤더로 사용됩니다.
  * `pingIntervalSec`는 4단계 생존 핑(Heartbeat) 통신 주기(초)를 의미합니다 (기본 180초 = 3분).

---

### ② [2단계-1] 사전 수집 타겟 및 서브넷 조회 (`GetAgentTargetAssets`)

* **통신 URL**: `https://<서버IP>/api/v1/agent/target-assets/`
* **HTTP Method**: `GET`
* **Header**: `Authorization: Bearer <agentToken>`
* **설명**: 에이전트 스캔 시작 직전 백엔드 DB에 이미 등록된 정식 자산 장비가 있는지/없는지를 먼저 확인하여 핀포인트 스캔할지 풀스캔할지 판단하는 API.

#### • Request (JSON / Header Query)
```http
GET /api/v1/agent/target-assets/ HTTP/1.1
Host: server.partneron.co.kr
Authorization: Bearer token_agent_AST-8A9F2K_9f8a7b6c5d4e3f2a1b
```

#### • Response (Success Case A - 등록 장비가 있는 경우)
```json
{
    "status": "success",
    "result": {
        "targetIps": [
            "192.168.0.55",
            "192.168.0.101"
        ],
        "targetSerials": [
            "FX-721495-192168055",
            "FX-9988102-192168101"
        ],
        "assignedSubnet": "192.168.0.0/24",
        "registeredCount": "2",
        "scanUnregistered": "N"
    }
}
```

#### • Response (Success Case B - 등록 장비가 0대인 최초 탐지 상황)
```json
{
    "status": "success",
    "result": {
        "targetIps": [],
        "targetSerials": [],
        "assignedSubnet": "192.168.0.0/24",
        "registeredCount": "0",
        "scanUnregistered": "Y"
    }
}
```

#### • Response (Error Case)
```json
{
    "status": "tokenInvalid",
    "detail": "유효하지 않거나 인증 해제된 에이전트 토큰입니다."
}
```
* **status 코드**:
  * `success`: 정상 조회 성공
  * `tokenNull`: Authorization 토큰 헤더 누락 시
  * `tokenInvalid`: 유효하지 않거나 OFFLINE 상태인 에이전트 토큰
  * `fail`: 서버 DB 조회 에러

* **memo (스캔 행동 판단 예시)**:
  * **case 1) `registeredCount` > 0 이고 `scanUnregistered` == "N" 인 경우**:
    에이전트는 로컬 254대를 다 스캔하지 않고, `targetIps`에 지정된 **2대 IP로만 0.5초 만에 초고속 핀포인트 관제 스캔**을 수행합니다. (조건 3)
  * **case 2) `registeredCount` == 0 또는 `scanUnregistered` == "Y" 인 경우**:
    에이전트는 `assignedSubnet` 대역(.1~.254) **풀스캔(Full Scan)**을 수행하여 현장에 존재하는 모든 복합기를 찾아 백엔드로 넘깁니다. (조건 1/2)

---

### ③ [2단계-2] 제조사 OID 마스터 맵 다운로드 (`GetOidMasterList`)

* **통신 URL**: `https://<서버IP>/api/v1/agent/oids/`
* **HTTP Method**: `GET`
* **Header**: `Authorization: Bearer <agentToken>`
* **설명**: 백엔드 `oid_lists` (`OidListMaster`) 단일 마스터 DB에 관리되는 제조사/모델별 26개 세부 SNMP OID 맵 구조를 다운로드하는 API.

#### • Request (JSON / Query)
```http
GET /api/v1/agent/oids/?vendor=Fujifilm HTTP/1.1
Authorization: Bearer token_agent_AST-8A9F2K_9f8a7b6c5d4e3f2a1b
```

#### • Response (Success Case)
```json
{
    "status": "success",
    "result": {
        "vendor": "Fujifilm",
        "oidMapList": [
            {
                "manufacturer": "FUJIFILM",
                "printerModel": "ApeosPort-VII C3373",
                "oidSerialNo": "1.3.6.1.4.1.2988.1.1.2.1.1.0",
                "oidCountColor": "1.3.6.1.4.1.2988.1.1.2.1.2.1.0",
                "oidCountMono": "1.3.6.1.4.1.2988.1.1.2.1.2.2.0",
                "oidTonerK": "1.3.6.1.4.1.2988.1.1.2.1.3.1.0",
                "oidTonerC": "1.3.6.1.4.1.2988.1.1.2.1.3.2.0",
                "oidTonerM": "1.3.6.1.4.1.2988.1.1.2.1.3.3.0",
                "oidTonerY": "1.3.6.1.4.1.2988.1.1.2.1.3.4.0",
                "oidDrumK": "1.3.6.1.4.1.2988.1.1.2.1.4.1.0"
            }
        ]
    }
}
```

---

### ④ [3단계] 배치 관제 데이터 수집 적재 (`PostAgentIngestData`)

* **통신 URL**: `https://<서버IP>/api/v1/agent/ingest/`
* **HTTP Method**: `POST`
* **Header**:
  * `Authorization`: `Bearer <agentToken>`
  * `X-Agent-Signature`: `HMAC-SHA256(payload_body, secret=agentToken)`
  * `X-Agent-Timestamp`: `1723456789`
* **설명**: SNMP 스캔을 마친 관제 데이터를 서버로 업로드하여, DB 등록 기기는 관제 DB(`MonitoringData`/`Record`)로 갱신하고, 미등록 기기는 `unregistered_printers` DB로 분리 적재하는 API.

#### • Request (JSON)
```json
{
    "devices": [
        {
            "serialNo": "FX-721495-192168055",
            "ipAddress": "192.168.1.55",
            "modelName": "ApeosPort-VII C3373",
            "vendorName": "FUJIFILM",
            "macAddress": "00:11:22:33:44:55",
            "countColor": "29100",
            "countMono": "76470",
            "countTotal": "105570",
            "tonerK": "10",
            "tonerC": "52",
            "tonerM": "42",
            "tonerY": "47",
            "drumK": "89"
        }
    ]
}
```

#### • Response (Success Case)
```json
{
    "status": "success",
    "result": {
        "matchedCount": "1",
        "unregisteredCount": "0",
        "totalIngested": "1",
        "ingestTimestamp": "2026-08-19 13:33:00"
    }
}
```

#### • Response (Error Case)
```json
{
    "status": "signatureMismatch",
    "detail": "패킷 무결성 해시 서명이 일치하지 않습니다. (Tampering detected)"
}
```
* **status 코드**:
  * `success`: 정상 배치 수집 및 이중 DB 분리 적재 완료
  * `signatureMismatch`: HMAC-SHA256 패킷 변조 감지
  * `devicesNull`: devices 배열 데이터가 null이거나 비어있을 때
  * `fail`: DB 인제스트 처리 오류

---

### ⑤ [4단계] 수집기 생존 핑 & 종료 통보 (`AgentPingAndShutdown`)

* **통신 URL 5-1 (Heartbeat Ping)**: `https://<서버IP>/api/v1/agent/ping/` (`GET`)
* **통신 URL 5-2 (Graceful Shutdown)**: `https://<서버IP>/api/v1/agent/shutdown/` (`POST`)
* **Header**: `Authorization: Bearer <agentToken>`
* **설명**: 3분 주기로 에이전트의 생존 핑을 전송하여 수집기 상태를 `ONLINE`으로 유지하거나, 수동 종료 시 `OFFLINE`으로 즉시 변경하는 API.

#### • Request (JSON - Shutdown Case)
```json
{
    "reason": "Windows OS Shutdown"
}
```

#### • Response (Success Case)
```json
{
    "status": "success",
    "result": {
        "agentStatus": "ONLINE",
        "lastPingAt": "2026-08-19 13:33:00"
    }
}
```
