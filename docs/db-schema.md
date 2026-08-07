# 🗄️ PartnerOn v1.0 Database Schema Specification

PartnerOn 시스템에는 **총 13개 데이터베이스 테이블**(비즈니스 4개 + M2M 2개 + 내장 시스템 7개 + 관제/미등록 6개)이 탑재되어 운용되고 있습니다.

---

## 📐 1. ERD 다이어그램 (Entity Relationship Diagram)

```
+------------------+         1 : N         +------------------+
|    Workplace     | --------------------- |       User       |
+------------------+                       +------------------+
| id               |                       | id               |
| name (unique)    |                       | email (unique)   |
| enforce_2fa_owner|                       | role (OWNER/...) |
+------------------+                       +------------------+
        │ 1                                         │ 1
        │ : N                                       │ : N
+------------------+                       +------------------+
|RoleMenuPermission|                       |      Device      |
+------------------+                       +------------------+
| role, menu_key   |                       | device_uuid, ip  |
+------------------+                       +------------------+
        │ 1                                         │ 1
        │ : N                                       │ : 1
+------------------+                       +------------------+
|   PrinterAsset   | ---------------------> |MonitoringPrinter |
+------------------+                       +------------------+
                                                    │ 1
                                    ┌───────────────┴───────────────┐
                                    ▼ 1:1                           ▼ 1:N
                           +------------------+            +------------------+
                           |  MonitoringData  |            |MonitoringDataRec.|
                           +------------------+            +------------------+
                           | (Hot DB Board)   |            | (Cold TimeSeries)|
                           +------------------+            +------------------+
```

---

## 📋 2. 핵심 비즈니스 테이블 구조

### ① **`accounts_workplace` (Workplace 모델)**
* `id`: PK
* `name`: `CharField(max_length=120, unique=True)` - 사업장 명칭
* `enforce_2fa_owner`, `enforce_2fa_admin_staff`, `enforce_2fa_sales`, `enforce_2fa_ce`: 직급별 2FA 강제 Boolean

### ② **`accounts_user` (User 모델)**
* `id`: PK
* `email`: `EmailField(unique=True)` - USERNAME_FIELD
* `role`: Enum (`OWNER`, `ADMIN_STAFF`, `SALES`, `CE`)
* `workplace_id`: FK (`Workplace` 참조)
* `invite_code`: `CharField(max_length=32, unique=True)` - 8자리 고유 구성원 초대 코드 (예: `INV-8A9F2K`)

### ③ **`accounts_printerasset` (PrinterAsset 모델)**
* `id`: PK
* `workplace_id`: FK (`Workplace` 참조)
* `serial_no`: `CharField(max_length=120, unique=True)` - 장비 고유 시리얼 번호
* `model_name`, `customer_name`, `location`, `ip_address`
* `count_color`, `count_mono`, `count_total`, `toner_c`, `toner_m`, `toner_y`, `toner_k`, `drum_k`

### ④ **`monitoring_data` (MonitoringData 모델 - Hot DB)**
* 최신 실시간 관제 상태용 1:1 패널 핫 데이터베이스.
* `unique_together = ("workplace", "serial_no")`

### ⑤ **`monitoring_data_records` (MonitoringDataRecord 모델 - Cold Time-Series DB)**
* 과거 일자별 시계열 이력 누적 적재 cold 데이터베이스.
* `unique_together = ("monitoring_printer", "yyyymmdd")`
* PostgreSQL `ON CONFLICT DO UPDATE` 메커니즘을 적용하여 당일 스캔 시에는 갱신되고, 날짜가 바뀌면 레코드가 자동 신규 생성적재됨.

### ⑥ **`unregistered_printers` (UnregisteredPrinter 모델)**
* 현장 에이전트에 스캔 탐지되었으나 아직 정식 등록되지 않은 기기 전용 테이블.
* `unique_together = ("workplace", "ip")`로 동일 IP 재스캔 시 최신 카운터 및 소모품 23개 컬럼 자동 갱신.
