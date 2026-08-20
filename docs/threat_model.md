# PartnerOn v1.0 STRIDE Threat Model & Security Boundaries

PartnerOn(파트너온) v1.0 시스템의 **구글식 시큐어 바이브코딩 (Shift Security Left)** 적용을 위한 STRIDE 6대 위협 모델 분석 및 보안 경계 명세서입니다.

---

## 1. STRIDE 6대 위협 축 분석 & 방어 대책 Matrix

### 1) Spoofing (신원 위장 / 위증)
* **위협 요소**: 타인의 이메일로 비인가 로그인 시도, 미승인 브라우저/디바이스의 무단 접근, Agent 수집기의 가짜 패킷 위조 전송.
* **방어 대책**:
  * 역할 기반 2FA (TOTP, 이메일 OTP 5분 만료) 및 8자리 비상 복구 코드 적용.
  * 대표 승인 디바이스 통제 (`Device` 승인 모듈 `PENDING` / `APPROVED`).
  * 수집기 인증 코드 (`AST-XXXXXX`) 파라미터 매칭 및 IP/시리얼 고유성 검증.

### 2) Tampering (데이터 변조)
* **위협 요소**: Agent 수집 Batch API (`POST /api/v1/agent/ingest/`) 전송 데이터 패킷 변조, 수집 카운터 및 소모품 수치 조작.
* **방어 대책**:
  * HTTPS TLS 1.3 암호화 채널 통신.
  * Agent 전송 패킷 HMAC-SHA256 해시 서명 헤더(`X-Agent-Signature`) 무결성 검증.
  * 백엔드 DRF Serializer 데이터 유형(Integer, GenericIP) 엄격 검증 및 Pydantic/DTO 필터링.
  * `MonitoringDataRecord` 일자별 이력 `unique_together` 불변 무결성 보장.

### 3) Repudiation (부인 / 행위 부인)
* **위협 요소**: 관리자가 구성원을 삭제하거나 자산 정보를 수정한 뒤 해당 행위를 부인.
* **방어 대책**:
  * Django `django_admin_log` 및 API 수준 Audit Logging 갱신 시 시각/유저 PK/IP 자동 기록.

### 4) Information Disclosure (정보 노출)
* **위협 요소**: REST API 응답 JSON에 비밀번호 해시, TOTP 비밀키, 이메일 OTP 코드 노출, 500 에러 시 서버 딥 스택트레이스 클라이언트 노출.
* **방어 대책**:
  * 비밀번호 PBKDF2 단방향 솔티드 해시 저장 (`user.set_password()`).
  * 수집기 토큰 DB 단방향 해시 저장 (`agent_token_hash = sha256(agent_token)` - 해결책 A 반영).
  * Serializer `fields`에서 `password`, `totp_secret`, `otp_code` 전수 제외 (`write_only=True`).
  * `.env` 환경 변수 분리로 DB 비번 및 `SECRET_KEY` 하드코딩 원천 차단.
  * API 예외 처리 시 정제된 메시지(`{"detail": "..."}`) 반환.

### 5) Denial of Service (서비스 거부 / DoS)
* **위협 요소**: 무차별 로그인 대입(Brute-Force), 수집기 풀 스캔 시 무제한 레코드 유입으로 인한 DB 부하.
* **방어 대책**:
  * API Rate Throttling (`throttle_scope = "login"`).
  * 등록 기기 핀포인트 0.5초 초고속 스캔 및 미등록 기기 `unregistered_printers` DB 이중 분리 적재 (`unique_together = ("workplace", "ip")`).

### 6) Elevation of Privilege (권한 상승 & BOLA)
* **위협 요소**: 일반 사용자(`SALES`, `CE`)가 관리자 API에 접근하거나, URL `pk` 조작으로 타 사업장의 자산/계약 데이터 무단 접근 (Broken Object Level Authorization).
* **방어 대책**:
  * 4단계 RBAC 메뉴 및 API 권한 통제 (`RoleMenuPermission`).
  * 모든 Django ORM 쿼리에 유저 소속 사업장 조건 결합 (`workplace=request.user.workplace`).

---

## 2. 구글식 TDD Security Boundaries & Assertions 규칙

LLM 에이전트 및 개발자가 새로운 기능 구현 계획(Plan)을 작성할 때 반드시 아래 **보안 경계 수칙**을 포함해야 합니다:

1. **Input Schema Validation**: 모든 API 입력을 DTO/Serializer로 엄격 검증.
2. **Business Boundary Testing**: BOLA 타 사업장 접근 시 403 Forbidden 검증.
3. **Self-Correction Rule**: pre-commit 또는 보안 스캔 실패 시 원인을 파악하여 환경변수 기반 리팩터링 후 재커밋.
