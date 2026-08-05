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


