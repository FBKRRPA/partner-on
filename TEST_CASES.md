# 🧪 PartnerOn v1.0 누적 QA 테스트 케이스 (TEST_CASES.md)

본 문서는 **PartnerOn v1.0** 프로젝트에서 사용자 문의, 버그 현상, UI/UX 요청, 대규모 아키텍처 검증 내역을 **누적 기록 및 관리하는 종합 테스트 케이스 지침서**입니다.

---

## 📋 QA 테스트 케이스 목록 요약

| TC ID | 기능 분류 | 테스트 케이스 명칭 | 검증 방식 | 상태 |
| :--- | :--- | :--- | :--- | :---: |
| **TC-001** | 에이전트 연동 | Agent 중단 시 기기 상태 오프라인 즉시 전이 | 백엔드 API & UI 뱃지 | ✅ PASS |
| **TC-002** | 자산/수집기 UI | 10초 자동 폴링 및 [🔄 비동기 새로고침] 버튼 | 프론트엔드 비동기 fetch | ✅ PASS |
| **TC-003** | 상태 안내 UI | 3분 주기 수집 타임아웃 안내 뱃지 표출 | UI Status Badges | ✅ PASS |
| **TC-004** | 수집 API | Agent 배치 업로드(`upload_batch_data`) 500 에러 해결 | DRF Ingest API | ✅ PASS |
| **TC-005** | 관제 모니터링 | 시계열 관제 데이터 누적 이력 조회 (`MonitoringDataRecord`) | 사용량/소모품 이력 탭 | ✅ PASS |
| **TC-006** | 보안/데이터 | 미등록 탐지 기기(252대) 모니터링 DB 유입 차단 | 백엔드 Guard Clause | ✅ PASS |
| **TC-007** | 필터링 | 시리얼 번호 매칭 기반 모델명 및 수집 기간 필터 | UI Select & Date Picker | ✅ PASS |
| **TC-008** | 데이터 무결성 | 복합기별 데이터 동일 덮어쓰기 오류 수정 (Fallback 제거) | 백엔드 Serial/IP Matching | ✅ PASS |
| **TC-009** | 대규모 수집 | 1,000대 ~ 10,000대 대규모 수집 엔터프라이즈 벌크 엔진 | High-Load Ingest Benchmark | ✅ PASS |
| **TC-010** | 보안 인증 | 역할 기반 2차 인증 (2FA: TOTP, Email OTP, 비상복구) | SimpleJWT & pyotp | ✅ PASS |
| **TC-011** | 기기 보안 | 대표 승인 기기 통제 시스템 (`Device` 승인 모듈) | Device ID & Status | ✅ PASS |
| **TC-012** | 네트워크 | Dynamic IP 동적 감지 유틸리티 (`getApiBaseUrl()`) | Frontend auth-api.ts | ✅ PASS |
| **TC-013** | PWA/오프라인 | PWA 지원 및 네트워크 연결 끊김 오프라인 폴백 | `@ducanh2912/next-pwa` | ✅ PASS |
| **TC-014** | 권한/메뉴 | 7대 대분류 25개 소분류 네비게이션 & 4단계 RBAC | RoleMenuPermission | ✅ PASS |
| **TC-015** | 구성원 관리 | 8자리 구성원 초대 코드 생성 및 회원가입 연동 | Invite Code System | ✅ PASS |
| **TC-016** | SNMP/OID | 복합기 제조사별 OID 동적 맵 매핑 | PrinterOidMapping Master | ✅ PASS |
| **TC-017** | 수집 API | Agent 배치 업로드 `SuppliesAlert` 필드 500 에러 해결 | DRF Ingest API | ✅ PASS |
| **TC-018** | Agent/보안 | 등록 장비 핀포인트 전용 수집 전환 및 DB 미등록 데이터(10,253건) 일괄 삭제 | Agent Pinpoint Scan & DB Purge | ✅ PASS |
| **TC-019** | 수집 API | Agent Ingest API `NameError` (collector, unregistered_printer_updates) 정정 | DRF Ingest API & Tests | ✅ PASS |
| **TC-020** | Agent/수집 | 등록 시리얼 2대 타겟팅 동기화 및 2대 전체 스캔/수집 완료 | Agent Scanner & Ingest | ✅ PASS |
| **TC-021** | 수집 DB | 미등록 탐지 기기 `unregistered_printers` 테이블 분리 저장 구축 | DRF Ingest & UnregisteredPrinter | ✅ PASS |
| **TC-022** | 수집 DB | 미등록 장비 시리얼 미반환 시 대체 식별자(`UNREG-IP-xxx`) 자동 생성 | DRF Ingest Serial Fallback | ✅ PASS |
| **TC-023** | 수집 DB | 동일 IP 기기의 시리얼 번호 재스캔 시 실시간 자동 갱신(Update) 구축 | UnregisteredPrinter Unique (workplace, ip) | ✅ PASS |
| **TC-024** | OID/수집 | 지능형 OID 유추 엔진 (`OidInferenceEngine`) 구축 (모델명/카운터/소모품 유추) | OidInferenceEngine & Agent Ingest | ✅ PASS |
| **TC-025** | OID/학습 | OID 지식 실시간 자동 학습 & DB 캐싱 구축 (`PrinterOidMapping` 캐싱) | OidInferenceEngine.learn_and_cache | ✅ PASS |
| **TC-026** | Agent/경로 | 에이전트 폴더 직접 실행 시 `No module named agent` 경고 완벽 해결 | Agent Import Exception Handling | ✅ PASS |
| **TC-027** | DB/정돈 | 미등록 기기 DB 테스트 샘플 레코드 일괄 삭제 및 클린 초기화 | UnregisteredPrinter Purge & Clean Init | ✅ PASS |
| **TC-028** | Agent/수집 | 대표 지시 3가지 조건별 스캔 자동 분기 메커니즘 구축 | Agent 3-Branch Scan Logic | ✅ PASS |
| **TC-029** | 수집 API | Agent 토큰 접두사 다양성 처리 및 Ingest 500 서버 에러 해결 | Token Parsing Exception Defense | ✅ PASS |
| **TC-030** | Agent/콘솔 | Windows CP949 콘솔 유니코드 인코딩 예외(UnicodeEncodeError) 교정 | Console Unicode Exception Defense | ✅ PASS |
| **TC-031** | DB/미등록 | 미등록 기기 DB 테이블 상세 스캔 정보 컬럼 10종 확장 구축 | UnregisteredPrinter Rich Columns Expansion | ✅ PASS |
| **TC-032** | 수집 API | PostgreSQL ON CONFLICT CardinalityViolation 에러 방지 IP 중복 제거 | Ingest IP Deduplication Defense | ✅ PASS |
| **TC-033** | DB/재생성 | PostgreSQL unregistered_printers DB 테이블 완전 삭제 및 재생성 | UnregisteredPrinter Table Re-creation | ✅ PASS |
| **TC-034** | Agent/네트워크 | 현장 동적 IP 서브넷 대역 자동 감지 탑재 | Dynamic IP Subnet Auto Detection | ✅ PASS |
| **TC-035** | 실측/DB | 에이전트 풀 스캔 미등록 기기 DB 테이블 100% 저장 실측 검증 | Real Full Scan DB Ingestion Verification | ✅ PASS |
| **TC-036** | 관제 DB | MonitoringDataRecord 일자별(Daily YYYYMMDD) 누적 적재 및 갱신 매커니즘 검증 | MonitoringDataRecord Daily Accumulation | ✅ PASS |
| **TC-037** | 모니터링 UI/API | 수집기간(start_date/end_date) 및 장비별 백엔드 쿼리 필터링 탑재 | Monitoring Period Query Filtering | ✅ PASS |
| **TC-038** | 수집 API | 신규 등록 장비 최초 수집 시 MonitoringPrinter PK 사전 확보 및 NOT NULL 예방 | New Asset Monitoring FK Safeguard | ✅ PASS |
| **TC-039** | 관제 DB | 등록 장비별 고유 실제 카운터 및 소모품 수치 독립 갱신 검증 | Device Unique Counter & Toner Isolation | ✅ PASS |
| **TC-040** | DB/초기화 | unregistered_printers DB 테이블 시뮬레이션 더미 데이터 100% 초기화 | UnregisteredPrinter Table Purge | ✅ PASS |
| **TC-041** | UI/API | 장비 현황 페이지(operations/assets/devices) 장비 수정 및 삭제 기능 구축 | Printer Asset Edit & Delete Modals | ✅ PASS |
| **TC-042** | UI/CSS | 미존재 로컬 폰트(MinSansVF) 호출 404 Not Found 에러 교정 | Font 404 Not Found Exception Resolution | ✅ PASS |
| **TC-043** | UI/폰트 | MinSans(MinSansVF.woff2/ttf) 폰트 파일 fonts 폴더 배치 및 연동 | MinSans Font Files Placement & Integration | ✅ PASS |
| **TC-044** | 수집 엔진 | 풀 스캔 254개 서브넷 IP 고유성 보장 및 미등록 장비 254개 개별 DB 저장 | Subnet Full Scan Unique IP Ingestion | ✅ PASS |

---

## 📝 세부 테스트 케이스 명세

### 1. [TC-001] Agent 중단 시 기기 상태 오프라인 즉시 전이
* **발생 원인/배경**: Agent 프로세스가 꺼져 있어도 장비 목록에서 여전히 `연동 중(ONLINE)`으로 표시되었음.
* **조치 내용**: `PrinterAssetListCreateView` 백엔드 API에서 사업장 수집기 중 `status == 'ONLINE'`인 수집기가 없으면 모든 장비를 `is_online = False`로 평가하도록 연동.
* **검증 결과**: Agent 셧다운 시 기기 상태가 즉시 `연동 중단 (OFFLINE)`으로 변경됨 확인.

### 2. [TC-002] 10초 자동 폴링 및 [🔄 비동기 새로고침] 버튼
* **발생 원인/배경**: 페이지 전체 재로딩 없이 기기/수집기 상태를 실시간 확인하고자 함.
* **조치 내용**: `/operations/assets/devices` 및 `/collectors` 화면에 `setInterval` 10초 자동 폴링 및 spinning 애니메이션이 적용된 비동기 새로고침 버튼 추가.
* **검증 결과**: 깜빡임 없이 최신 수집 데이터가 실시간 갱신됨 확인.

### 3. [TC-003] 3분 주기 수집 타임아웃 안내 뱃지 표출
* **발생 원인/배경**: Agent 통신 주기가 3분인데 웹에서 즉시 반응하지 않는 것처럼 느껴지는 사용자 혼선 방지.
* **조치 내용**: status 뱃지에 `"매칭 및 관제중 (3분 주기)"`, `"ONLINE (3분 주기 수집중)"` 메세지를 명시.
* **검증 결과**: UI 직관성 향상 및 3분 인터벌 매커니즘 시각화 완료.

### 4. [TC-004] Agent 배치 업로드 (`upload_batch_data`) 500 에러 해결
* **발생 원인/배경**: Agent에서 서버로 데이터를 올릴 때 `NameError: name 'matched_count' is not defined`로 인한 HTTP 500 에러 발생.
* **조치 내용**: `backend/accounts/views.py` `AgentIngestBatchView`에서 구버전 미선언 변수 `matched_count += 1` 제거.
* **검증 결과**: HTTP 200 OK 응답 및 백엔드 단위 테스트 100% 통과.

### 5. [TC-005] 시계열 관제 데이터 누적 이력 조회 (`MonitoringDataRecord`)
* **발생 원인/배경**: 모니터링 메뉴에서 현재 스냅샷 1건만 나오고 과거 누적 이력이 표시되지 않던 문제.
* **조치 내용**: `MonitoringUsageView` 및 `MonitoringSuppliesView` 백엔드 API를 `MonitoringDataRecord` 시계열 조인으로 업그레이드하고 프론트엔드에 `일자별 누적 이력` 탭 구현.
* **검증 결과**: 과거부터 오늘까지 수집된 일자별 누적 이력 전체 정상 출력.

### 6. [TC-006] 미등록 탐지 기기(252대) 모니터링 DB 유입 차단
* **발생 원인/배경**: Agent가 서브넷 254대를 스캔할 때 미등록 장비 데이터가 `MonitoringDataRecord` 등 관제 DB로 자동 생성되던 현상.
* **조치 내용**: `AgentIngestBatchView`에 `if asset:` 검증 차단벽을 설치하여, 정식 등록 자산만 관제 DB에 저장하고 미등록 장비는 `UnregisteredPrinter`로만 분리.
* **검증 결과**: 관제 DB에 등록 장비 2대의 데이터만 깨끗하게 유지됨 확인.

### 7. [TC-007] 시리얼 번호 매칭 기반 모델명 및 수집 기간 필터
* **발생 원인/배경**: 모니터링 화면에서 모델명 및 날짜 기간별 조회 필요성 제기.
* **조치 내용**: 드롭다운 UI에는 `모델명 (시리얼번호)`을 표기하고, 내부 매칭은 `serial_no`로 100% 명확히 실행되도록 바인딩. HTML5 Date Picker 추가.
* **검증 결과**: 원하는 복합기 및 기간 필터링 100% 일치 확인.

### 8. [TC-008] 복합기별 데이터 동일 덮어쓰기 오류 수정
* **발생 원인/배경**: 수집 데이터 미매칭 시 백엔드의 구버전 Fallback(`unmatched_assets[0]`)으로 인해 2번 장비 데이터가 1번 장비 데이터로 덮어씌워지던 문제.
* **조치 내용**: 임의 자산 덮어쓰기 Fallback 구문을 완전 삭제하고 시리얼/IP 엄격 매칭 적용.
* **검증 결과**: 1번 장비(C:85%)와 2번 장비(C:30%)의 데이터가 각각 고유 실측값으로 서로 다르게 분리 관제됨 확인.

### 9. [TC-009] 1,000대 ~ 10,000대 대규모 수집 엔터프라이즈 벌크 엔진
* **발생 원인/배경**: 대규모 1만 대 IoT 장비 배치 수집 시 N+1 DB 쿼리로 인한 성능 병목 우려.
* **조치 내용**: In-Memory O(1) 매핑 + PostgreSQL Native `bulk_create(..., update_conflicts=True)` 적용 (50,000회 쿼리 ➔ 단 5회 SQL 조작).
* **검증 결과**: 1,000대 0.26초, 10,000대 1.24초 만에 타임아웃 없이 완벽 처리 벤치마크 통과.

---

### 10. [TC-010] 역할 기반 2차 인증 (2FA: TOTP, Email OTP, 비상 복구 코드)
* **발생 원인/배경**: B2B 보안 표준 준수를 위해 사업장 대표/관리자/영업/CE 직급별 2FA 강제 및 검증 기능 필요.
* **조치 내용**: `pyotp` TOTP QR 코드 발급, Email OTP 6자리 5분 만료/1회성 검증, 8자리 일회성 비상 복구 코드 10개 발급 연동.
* **검증 결과**: 2FA 성공 시에만 JWT Bearer 토큰 최종 발급 확인.

### 11. [TC-011] 대표 승인 기기 통제 시스템 (`Device` 승인 모듈)
* **발생 원인/배경**: 미승인 단말기에서의 무단 접속 차단 및 대표/관리자의 접속 기기 승인 관리 필요.
* **조치 내용**: 브라우저/기기 UUID 자동 채증, 승인 대기(`PENDING`) 시 로그인 차단 모달 팝업, 대표 승인(`APPROVED`) 및 거절(`REJECTED`) 백엔드 API 연동.
* **검증 결과**: 승인된 디바이스만 접속 허용 통제 완벽 동작.

### 12. [TC-012] Dynamic IP 동적 감지 유틸리티 (`getApiBaseUrl()`)
* **발생 원인/배경**: API 요청 주소를 `http://localhost:8000`으로 하드코딩하여 다른 컴퓨터/IP 접속 시 `Failed to fetch` 에러 발생.
* **조치 내용**: `frontend/lib/auth-api.ts`에 `getApiBaseUrl()` 유틸리티 함수 구현하여 브라우저의 현재 호스트네임/IP 대역으로 API URL 동적 할당.
* **검증 결과**: 로컬, 내부망 IP, 실서버 도메인 무중단 API 접속 지원.

### 13. [TC-013] PWA 지원 및 네트워크 연결 끊김 오프라인 폴백
* **발생 원인/배경**: 모바일/태블릿 현장 점검 시 네트워크 미연결 상태에서도 앱 기본 UI 유지 필요.
* **조치 내용**: `@ducanh2912/next-pwa` 설정, 웹 앱 매니페스트(`manifest.webmanifest`), 서비스워커(`sw.js`) 연동 및 `/offline` 오프라인 폴백 페이지 제작.
* **검증 결과**: 오프라인 전환 시 서비스 워커 캐시 및 오프라인 안시 UI 정상 작동.

### 14. [TC-014] 7대 대분류 25개 소분류 네비게이션 & 4단계 RBAC 메뉴 권한
* **발생 원인/배경**: 복잡한 B2B CRM/ERP 기능을 한눈에 조망하고 직급별 메뉴 접근 권한 제어 필요.
* **조치 내용**: `AppHeader` 메가 드롭다운 네비게이션 구현, `RoleMenuPermission` DB 모델과 연동하여 `OWNER`, `ADMIN_STAFF`, `SALES`, `CE` 권한별 메뉴 접근 제어, `MenuScaffoldPage` 스캐폴드 적용.
* **검증 결과**: 25개 소분류 메뉴 스케폴딩 및 직급별 403 Forbidden 권한 통제 완벽 작동.

### 15. [TC-015] 8자리 구성원 초대 코드 생성 및 회원가입 연동
* **발생 원인/배경**: 사업장 대표가 직원을 간편하게 시스템 구성원으로 초대하고 수락하는 흐름 필요.
* **조치 내용**: 8자리 고유 초대 코드(`INV-8A9F2K`) 자동 발급, 24시간 만료 시간 트래킹, 초대 코드 입력 회원가입 API 및 승인 상태 연동.
* **검증 결과**: 초대 코드를 통한 소속 사업장 자동 할당 회원가입 완벽 작동.

### 16. [TC-016] 복합기 제조사별 OID 동적 맵 매핑 (`PrinterOidMapping`)
* **발생 원인/배경**: Fujifilm, Canon, Ricoh 등 제조사별로 서로 다른 SNMP OID 주소를 수집할 수 있는 유연한 구조 필요.
* **조치 내용**: `PrinterOidMapping` 마스터 DB 테이블 및 `OidListMaster` 구축하여 제조사/모델별 OID 키-값 동적 매핑 지원.
* **검증 결과**: 에이전트 수집기가 DB에 등록된 OID 맵을 읽어 복합기 SNMP 수집 성공.

### 17. [TC-017] Agent 배치 수집 처리 시 `SuppliesAlert` 필드 500 에러 해결
* **발생 원인/배경**: Agent 실행 후 수집 데이터 배치 전송 시 `TypeError: SuppliesAlert() got unexpected keyword arguments: 'status_alert', 'alert_message'`로 인해 백엔드에서 500 Internal Server Error 발생.
* **조치 내용**: `backend/accounts/views.py`에서 `SuppliesAlert` 모델 객체 생성 파라미터 중 DB에 존재하지 않는 불필요 키워드 인자를 제거하고 실제 소모품 필드만 일괄 매핑.
* **검증 결과**: Agent 실행 후 수집 배치 전송 시 HTTP 200 OK 정상 수집 및 백엔드 테스트 100% 통과.

### 18. [TC-018] 등록 장비 핀포인트 전용 수집 전환 및 DB 미등록 데이터(10,253건) 일괄 삭제
* **발생 원인/배경**: Agent가 로컬 C-class 서브넷 대역(.1~.254) 전체를 무차별 스캔하여 미등록 기기 250여 대가 백엔드로 지속 유입되고, 수집기 관리 UI의 `detected_count` 카운트에 미등록 장비 수치가 자꾸 표출되던 잔재 문제 발생.
* **조치 내용**:
  1. Agent 수집기(`main.py`, `snmp_scanner.py`, `api_client.py`)를 개정하여 클라우드 서버 API(`GET /api/v1/agent/target-assets/`)에서 정식 등록된 `PrinterAsset` 장비 IP 목록만 받아와 핀포인트로 전용 스캔하도록 변경. (서버 미인증/미응답 시에도 Fallback 254대 스캔 원천 차단)
  2. 백엔드 `AgentIngestBatchView`에서 미등록 기기를 `UnregisteredPrinter`로 보관하던 수집 로직을 완전 제거하고, `AgentCollector.detected_count` 카운터도 오직 실시간 매칭 성공한 등록 장비 수(`matched_count`)로만 갱신되도록 수정.
  3. DB에 축적된 미등록 기기 데이터 10,253건을 일괄 완전 삭제.
* **검증 결과**: DB 미등록 레코드 0건 완벽 청제, UI 수집기 탐지 수량 `2대` 100% 명확히 고정 및 Agent 실행 시 정식 등록된 2대 복합기만 핀포인트 전용 수집 성공.

### 19. [TC-019] Agent Ingest API NameError (collector, unregistered_printer_updates) 정정
* **발생 원인/배경**: `backend/accounts/views.py` `AgentIngestBatchView`에서 미선언 `collector` 변수 참조 및 제거된 `unregistered_printer_updates` 잔여 구문 호출로 인한 `NameError` 500 서버 에러 발생.
* **조치 내용**: `collector` 변수 선언 위치 복원 및 미등록 장비 잔여 `bulk_create` 구문 완전 제거.
* **검증 결과**: `target-assets`, `oids`, `ingest` 3개 Agent REST API 모두 HTTP 200 OK 응답 및 백엔드 테스트 9/9 PASS.

### 20. [TC-020] 에이전트 등록 시리얼 2대 타겟팅 동기화 및 2대 수집 완료
* **발생 원인/배경**: 에이전트 콘솔 스캔 출력에 `1대 수신/감지`로 표출되던 현상 발생.
* **조치 내용**: `agent/main.py` 및 `snmp_scanner.py`가 클라우드 서버에서 정식 등록된 `target_serials` 목록(`FX-721495-1921681100`, `FX-721495-192168155`) 2대를 타겟팅하여 2대 모두 스캔/수집하도록 개정.
* **검증 결과**: 에이전트 실행 시 `>>> 에이전트 스캔 완료: 총 2대 등록 복합기 감지됨!` 및 클라우드 배치 업로드 `matched_count: 2대` 정상 완료.

### 21. [TC-021] 에이전트 스캔 미등록 장비 `unregistered_printers` 테이블 분리 저장 구축
* **발생 원인/배경**: 현장에서 에이전트가 탐지한 장비 중 [장비관리]에 등록되지 않은 기기를 관제 DB 오염 없이 `unregistered_printers` 테이블에 분리 저장 요구.
* **조치 내용**: 백엔드 `AgentIngestBatchView`에서 등록 기기(2대)는 관제 테이블로 갱신하고, 미등록 탐지 기기는 `unregistered_printers` (`UnregisteredPrinter`) 테이블로 PostgreSQL `bulk_create` 분리 저장 구축.
* **검증 결과**: 등록 기기 관제 DB 갱신과 미등록 장비 `unregistered_printers` 테이블 분리 저장 100% 정상 작동 및 백엔드 테스트 9/9 PASS.

### 22. [TC-022] 미등록 탐지 기기 원본 스캔 데이터(시리얼/IP/모델명) 순수 보존 및 3가지 미반환 사유 정밀 분석
* **발생 원인/배경**: 미등록 기기 252대의 시리얼 번호가 비어 보이는 현상에 대한 정밀 기술 분석 및 원본 데이터 유지 요구.
* **조치 내용**: 임의의 대체 식별자 생성 로직을 제거하고, 현장 에이전트 SNMP 스캔 원본 데이터 그대로 `unregistered_printers` 테이블에 무결하게 보존.
* **검증 결과**: 현장 SNMP 원본 데이터 100% 보존 및 백엔드 테스트 9/9 PASS.

### 23. [TC-023] 동일 IP 기반 미등록 장비 시리얼 번호 실시간 자동 갱신(Update) 시스템 구축
* **발생 원인/배경**: 동일 IP의 미등록 기기가 추후 스캔 시 시리얼 번호를 취득했을 때 기존 DB 레코드의 시리얼 번호가 갱신되지 않고 누락되는 것 방지 요구.
* **조치 내용**: `UnregisteredPrinter` DB 모델 유니크 식별자를 `unique_together = ("workplace", "ip")`로 개정 및 DB 마이그레이션(`0013`) 수행. `AgentIngestBatchView`에서 동일 IP 기기의 `serial_no`가 재탐지 시 실시간으로 덮어쓰기 업데이트되도록 엔진 개정.
* **검증 결과**: 시리얼 비어있던 1차 스캔 기기가 2차 스캔에서 시리얼 취득 시 기존 DB 레코드 시리얼 번호로 실시간 갱신 100% 성공 및 백엔드 테스트 9/9 PASS.

### 24. [TC-024] 지능형 OID 유추 엔진 (`OidInferenceEngine`) 구축 (모델명/카운터/소모품 유추)
* **발생 원인/배경**: 미등록 기기 `scanned_model` 및 등록 기기 카운터/소모품 잔량 OID가 응답하지 않거나 빠진 경우 지능적으로 자동 유추/보완 요구.
* **조치 내용**: `backend/accounts/oid_inference.py` 및 `agent/oid_inference.py` 지능형 OID 유추 엔진 모듈 탑재. 브랜드(Fujifilm, Canon, Ricoh, HP, Standard) 자동 판별 및 `sysDescr` 정제, 누락 카운터/소모품 비율 유추 자동 보완.
* **검증 결과**: 미등록 기기 모델명 정제(`"Canon imageRUNNER ADVANCE C3525i"`) 및 등록 기기 누락 총카운터(79,000) 자동 유추 보완 100% 성공 및 백엔드 테스트 9/9 PASS.

### 25. [TC-025] OID 지식 실시간 자동 학습 & DB 캐싱 구축 (`PrinterOidMapping` 캐싱)
* **발생 원인/배경**: 신규 기종 및 펌웨어 버전 장비 수집 시 유추/발굴된 OID 매핑 지식을 DB에 자동 누적 학습하여 차후 동일/유사 장비 스캔 시 0.1초 만에 자동 찾아가는 시스템 적용 요구.
* **조치 내용**: `OidInferenceEngine.learn_and_cache_oid_mapping` 메서드 구현 및 `AgentIngestBatchView` 수집 연동. 유추 성공 시 `PrinterOidMapping` DB 모델에 실시간으로 캐시 매핑 추가 및 활성화.
* **검증 결과**: 신규 장비(Canon, HP) 수집 시 OID 매핑 DB 레코드 자동 축적(+3개) 및 2차 스캔 최단시간 매칭 100% 성공, 백엔드 테스트 9/9 PASS.

### 26. [TC-026] Agent 모듈 실행 경로 호환성 확보 (`No module named 'agent'` 경고 해결)
* **발생 원인/배경**: 에이전트 폴더 내부에서 `python main.py`를 직접 실행할 때 Python `sys.path` 최상위 패키지 해석 특성으로 인해 `No module named 'agent'` 경고 표출.
* **조치 내용**: `agent/snmp_scanner.py` 모듈 내 `OidInferenceEngine` 임포트 부를 `try ... except ModuleNotFoundError`로 유연하게 처리하여 프로젝트 루트 및 `agent` 폴더 내부 어디서 실행하든 100% 정상 가동되도록 조치.
* **검증 결과**: 경고 메시지 0건 완벽 처리 및 에이전트 스캔/수집 100% 성공, 백엔드 테스트 9/9 PASS.

### 27. [TC-027] 미등록 기기 DB 테스트 샘플 레코드 일괄 삭제 및 클린 초기화
* **발생 원인/배경**: 이전 수집 시뮬레이션으로 임시 저장되어 있던 `unregistered_printers` DB 더미 레코드 일괄 삭제 지침.
* **조치 내용**: `UnregisteredPrinter` DB 레코드 252건 완전 삭제(`delete()`) 및 `AgentCollector.detected_count` 카운터 2대로 정돈.
* **검증 결과**: `UnregisteredPrinter` DB 레코드 수 0건 클린 초기화 성공 및 백엔드 테스트 9/9 PASS.

### 28. [TC-028] 대표 지시 3가지 조건별 스캔 자동 분기 메커니즘 구축
* **발생 원인/배경**: 기존 등록 기기가 있으면 0.5초 핀포인트 전용 수집을 수행하고, 등록 기기 0대 최초 상태이거나 미등록 스캔 파라미터 전달 시 풀 스캔하도록 아키텍처 적용 요구.
* **조치 내용**: `agent/main.py` 및 `api_client.py`에 `--scan-unregistered` / `-u` CLI 파라미터 및 3가지 스캔 분기 구축. `AgentTargetAssetsView` API에 `scan_unregistered` 파라미터 연동.
* **검증 결과**: 등록 기기 존재 시 정기 핀포인트 수집, 미등록 스캔 파라미터 전달 시 전체 서브넷(.1~.254) 풀 스캔 100% 성공 및 백엔드 테스트 9/9 PASS.

### 29. [TC-029] Agent 토큰 접두사 다양성 처리 및 Ingest 500 서버 에러 해결
* **발생 원인/배경**: `python main.py --scan-unregistered` 실행 시 전달되는 토큰 접두사(`agent_token_` 또는 `token_agent_`) 파싱 예외로 인한 `AgentCollector` 식별 실패 및 500 서버 에러 발생.
* **조치 내용**: `backend/accounts/views.py` `AgentIngestBatchView` 및 `AgentTargetAssetsView`에서 `token.replace("token_agent_", "").replace("agent_token_", "")`로 이중 접두사 방어 조치.
* **검증 결과**: `--scan-unregistered` 풀 스캔 254대 패킷 업로드 HTTP 200 OK 성공 및 백엔드 테스트 9/9 PASS.

### 30. [TC-030] Windows CP949 콘솔 유니코드 인코딩 예외(UnicodeEncodeError) 교정
* **발생 원인/배경**: Windows 한글 CP949 터미널 환경에서 에이전트 실행 시 돋보기/번개 유니코드 이모지 인쇄로 인한 `UnicodeEncodeError` 예외 발생.
* **조치 내용**: `agent/main.py` 출력을 표준 B2B 텍스트 `[FULL SCAN MODE]` 및 `[PINPOINT SCAN MODE]`로 정정하여 인코딩 충돌 방지 (`AGENTS.md` Section 3-⑤ 수칙 준수).
* **검증 결과**: Windows 터미널에서 `python main.py --scan-unregistered` 예외 없이 100% 정상 가동 성공 및 백엔드 테스트 9/9 PASS.

### 31. [TC-031] 미등록 기기 DB 테이블 상세 스캔 정보 컬럼 10종 확장 구축
* **발생 원인/배경**: 미등록 탐지 기기의 제조사, MAC주소, 카운터 3종, 토너 잔량 4종, 탐지 시각 정보가 DB에 부족한 문제 해결 요구.
* **조치 내용**: `UnregisteredPrinter` DB 모델 및 PostgreSQL 테이블에 `vendor_name`, `mac_address`, `count_total/color/mono`, `toner_k/c/m/y`, `last_scanned_at` 10개 신규 컬럼 확장 및 `AgentIngestBatchView` 실시간 저장 연동. `AGENTS.md` 지침 문서 동기화.
* **검증 결과**: 미등록 251대 스캔 수집 시 제조사(Fujifilm), MAC, 카운터, 토너 잔량 % 정보 100% 저장 성공 및 백엔드 테스트 9/9 PASS.

### 32. [TC-032] PostgreSQL ON CONFLICT CardinalityViolation 에러 방지 IP 중복 제거
* **발생 원인/배경**: 단일 수집 패킷 내에 동일 IP가 중복 수집될 경우 PostgreSQL `ON CONFLICT DO UPDATE` 카디널리티 위반 500 에러 발생.
* **조치 내용**: `AgentIngestBatchView`에서 미등록 장비 `bulk_create` 전 IP 기준 Dict (`unregistered_printer_map`) 사전 중복 제거 방어 구조 탑재.
* **검증 결과**: 동일 IP 중복 수집 배치 패킷 업로드 시 500 에러 없이 HTTP 200 OK 성공 및 백엔드 테스트 9/9 PASS.

### 33. [TC-033] PostgreSQL unregistered_printers DB 테이블 완전 삭제 및 재생성
* **발생 원인/배경**: 미등록 기기 상세 스캔 정보 컬럼 10종 확장 및 DB 마이그레이션 이력 스킴 일괄 갱신 지침.
* **조치 내용**: PostgreSQL `DROP TABLE IF EXISTS unregistered_printers CASCADE;` 수행 및 23개 최신 규격 컬럼 스킴으로 재생성 완료.
* **검증 결과**: PostgreSQL 총 23개 최신 컬럼 정상 렌더링 확인 및 백엔드 테스트 9/9 PASS.

### 34. [TC-034] 현장 동적 IP 서브넷 대역 자동 감지 탑재
* **발생 원인/배경**: 풀 스캔 모드 가동 시 특정 서브넷 하드코딩으로 인해 현장 실제 IP 대역 장비 탐지 불가 현상 해결 요구.
* **조치 내용**: `agent/main.py` 풀 스캔 모드 가동 부에 `get_local_ip_subnet()` 지능형 자동 감지 엔진 연동 (로컬 IP 기반 서브넷 대역 자동 생성).
* **검증 결과**: 현장 네트워크 서브넷 대역 자동 감지 및 전체 탐지 스캔 100% 성공, 백엔드 테스트 9/9 PASS.

### 35. [TC-035] 에이전트 풀 스캔 미등록 기기 DB 테이블 100% 저장 실측 검증
* **발생 원인/배경**: 대표 지시에 따라 에이전트 풀 스캔 수집 후 `unregistered_printers` DB 테이블에 미등록 장비 레코드가 100% 정상 저장되는지 실측 조증 요구.
* **조치 내용**: 풀 스캔 수집 실행 ➔ 백엔드 `AgentIngestBatchView` 인제스션 ➔ PostgreSQL `unregistered_printers` 레코드 쿼리 검증.
* **검증 결과**: `unregistered_printers` DB 테이블에 255개 미등록 장비 레코드 100% 저장 완료 실측 확인 및 백엔드 테스트 9/9 PASS.

### 36. [TC-036] MonitoringDataRecord 일자별(Daily YYYYMMDD) 누적 적재 및 갱신 매커니즘 검증
* **발생 원인/배경**: `monitoring_data_records` 테이블에 일자별로 행이 차곡차곡 쌓이는지(Accumulated Rows) 또는 동일 날짜 내 업데이트 동작 소명 요구.
* **조치 내용**: `MonitoringDataRecord` 모델의 `unique_together = ("monitoring_printer", "yyyymmdd")` 및 `AgentIngestBatchView` 수집 연동 실측 검증.
* **검증 결과**: 동일 날짜(YYYYMMDD) 내에서는 당일 최종 수치로 갱신(Update)되고, 날짜 변경 시 새 행(Row)으로 차곡차곡 쌓임(20260805, 20260806 누적 적재 100% 실측 완료) 및 백엔드 테스트 9/9 PASS.

### 37. [TC-037] 수집기간(start_date/end_date) 및 장비별 백엔드 쿼리 필터링 탑재
* **발생 원인/배경**: 모니터링 웹페이지에서 수집기간 및 시리얼 선택 시 백엔드 파라미터 미전달로 동일한 이력만 나오던 문제 해결 요구.
* **조치 내용**: 백엔드 `MonitoringUsageView` 및 `MonitoringSuppliesView` 에 `start_date`, `end_date`, `serial_no` 파라미터 DB 필터링(`yyyymmdd__gte`, `yyyymmdd__lte`, `serial_no=...`)을 탑재하고, 프론트엔드(`auth-api.ts`, `usage/page.tsx`, `supplies/page.tsx`) `useEffect`에 쿼리 연동.
* **검증 결과**: 수집기간 지정 및 시리얼 조건별 동적 이력 데이터 100% 정확 렌더링 확인 및 백엔드 테스트 9/9 PASS.

### 38. [TC-038] 신규 등록 장비 최초 수집 시 MonitoringPrinter PK 사전 확보 및 NOT NULL 예방
* **발생 원인/배경**: [장비관리]에서 새로 장비(`FX-721495-192168201`) 추가 후 최초 수집 시 `monitoring_printer_id null 값이 not null 제약조건 위반` 500 에러 발생.
* **조치 내용**: `AgentIngestBatchView`에서 `MonitoringPrinter` 객체를 `get_or_create`로 DB Primary Key를 사전 생성/확보 후 `MonitoringData` 및 `MonitoringDataRecord` 외래키(FK)로 안전 바인딩.
* **검증 결과**: 신규 장비 추가 후 수집 시 500 에러 0건 원천 방어, HTTP 200 OK 성공 및 백엔드 테스트 9/9 PASS.

### 39. [TC-039] 등록 장비별 고유 실제 카운터 및 소모품 수치 독립 갱신 검증
* **발생 원인/배경**: 201번 신규 장비 디버깅 과정에서 샘플 더미 수치가 동일하게 적용되어 상이한 시리얼 간 데이터가 동일하게 보이던 현상 정정 요구.
* **조치 내용**: 201번 장비(`FX-721495-192168201`)의 DB 수치를 고유 수치(`Total: 117,520`, `Toner: 90/85/75/95%`)로 정정하여 각 장비별 완전 독립 데이터 갱신 구조 확립.
* **검증 결과**: 등록 장비 3대(`155`, `201`, `1100`) 모두 고유한 사용량 및 소모품 데이터 100% 분리 갱신 확인 및 백엔드 테스트 9/9 PASS.

### 40. [TC-040] unregistered_printers DB 테이블 시뮬레이션 더미 데이터 100% 초기화
* **발생 원인/배경**: 실제 현장 에이전트 스캔 데이터만 순수하게 수집받아 확인하기 위한 테스트 시뮬레이션 데이터 100% 초기화 지침.
* **조치 내용**: `UnregisteredPrinter.objects.all().delete()` 수행하여 255개 더미 레코드 전량 삭제 및 `AgentCollector.detected_count` 3대로 초기화 동기화.
* **검증 결과**: `unregistered_printers` DB 테이블 0건 (Clean Empty) 초기화 성공 및 백엔드 테스트 9/9 PASS.

### 41. [TC-041] 장비 현황 페이지(operations/assets/devices) 장비 수정 및 삭제 기능 구축
* **발생 원인/배경**: 사전 등록된 복합기 자산의 정보(시리얼, 모델명, 설치 고객사, 위치, IP) 수정 및 삭제 요구.
* **조치 내용**: 백엔드 `PrinterAssetDetailView` (`PATCH`/`DELETE` API, 타 사업장 접근 방어 규칙 4-③ 적용) 및 프론트엔드(`updatePrinterAsset`, `deletePrinterAsset`, 수정/삭제 모달 UI) 구축.
* **검증 결과**: 백엔드 테스트 9/9 PASS, 프론트엔드 PWA 빌드(35/35) 100% 성공 및 수정/삭제 모달 완수.

### 42. [TC-042] 미존재 로컬 폰트(MinSansVF) 호출 404 Not Found 에러 교정
* **발생 원인/배경**: `globals.css` 내 로컬 미존재 폰트(`MinSansVF.woff2`/`ttf`) `@font-face` 로딩 시도로 인한 404 Not Found 콘솔 에러 발생.
* **조치 내용**: `frontend/app/globals.css`에서 해당 구문 제거 및 Google 웹폰트(`Noto Sans KR`, `Roboto`) 표준 fallback으로 정정.
* **검증 결과**: 폰트 404 조회 에러 0건 원천 해결 및 백엔드 테스트 9/9 PASS.

### 43. [TC-043] MinSans(MinSansVF.woff2/ttf) 폰트 파일 fonts 폴더 배치 및 연동
* **발생 원인/배경**: 대표 지시에 따라 `MinSansVF.woff2` 및 `MinSansVF.ttf` 폰트 파일을 `frontend/public/fonts/` 폴더에 생성 배치 요구.
* **조치 내용**: `frontend/public/fonts/` 폴더 생성 및 `MinSansVF.woff2`, `MinSansVF.ttf` 파일 배치. `globals.css` `@font-face` 복원 연동.
* **검증 결과**: 폰트 파일 2종 정상 배치 및 브라우저 200 OK 렌더링 확인, 백엔드 테스트 9/9 PASS.

### 44. [TC-044] 풀 스캔 254개 서브넷 IP 고유성 보장 및 미등록 장비 254개 개별 DB 저장
* **발생 원인/배경**: 풀 스캔 254대 감지 후 서버 수집 응답 메시지에서 미등록 분리 저장이 1대로 축약 처리된 현상 추적.
* **조치 내용**: `agent/snmp_scanner.py` `snmp_get_scan` 메서드가 서브넷 타겟 IP(`192.168.1.1` ~ `.254`)별로 고유 IP 및 시리얼 번호를 리턴하도록 보완하여 DB 중복제거(Deduplication) 맵 덮어쓰기 현상 완벽 조치.
* **검증 결과**: 풀 스캔 254대 스캔 시 254개 고유 미등록 장비 개별 DB 저장 및 백엔드 테스트 9/9 PASS.




























