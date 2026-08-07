# 🗄️ PartnerOn v1.0 Database Schema Specification

PartnerOn 시스템에는 **총 16개 데이터베이스 모델 테이블**(비즈니스 6개 + M2M 2개 + 내장 시스템 7개 + 관제/미등록 마스터 8개)이 탑재되어 운용되고 있습니다.

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

## 📋 2. 전체 16개 모델 테이블 메타데이터 상세

### 1) 비즈니스 핵심 모델 (Accounts App)

1. **`accounts_workplace` (Workplace 모델)**
   * `id`: PK, `name`: `CharField(max_length=120, unique=True)` - 사업장 명칭
   * `enforce_2fa_owner`, `enforce_2fa_admin_staff`, `enforce_2fa_sales`, `enforce_2fa_ce`: 직급별 2FA 강제 Boolean
2. **`accounts_user` (User 모델)**
   * `id`: PK, `email`: `EmailField(unique=True)` - USERNAME_FIELD
   * `role`: Enum (`OWNER`, `ADMIN_STAFF`, `SALES`, `CE`), `workplace_id`: FK
   * `totp_secret`, `otp_code`, `backup_codes`, `invite_code` (`INV-XXXXXX` 8자리 고유 초대코드)
3. **`accounts_rolemenupermission` (RoleMenuPermission 모델)**
   * `id`: PK, `workplace_id`: FK, `role`: Enum, `menu_key`: CharField, `is_allowed`: Boolean
   * `unique_together = ("workplace", "role", "menu_key")`
4. **`accounts_device` (Device 모델)**
   * `id`: PK, `user_id`: FK, `device_uuid`: CharField, `ip_address`: IP, `status`: Enum (`PENDING`, `APPROVED`, `REJECTED`)
   * `unique_together = ("user", "device_uuid")`
5. **`accounts_printerasset` (PrinterAsset 모델)**
   * `id`: PK, `workplace_id`: FK, `serial_no`: CharField (unique), `model_name`, `customer_name`, `location`, `ip_address`
   * `count_color`, `count_mono`, `count_total`, `toner_c`, `toner_m`, `toner_y`, `toner_k`, `drum_k`
6. **`accounts_agentcollector` (AgentCollector 모델)**
   * `id`: PK, `workplace_id`: FK, `auth_code`: CharField (`AST-XXXXXX` unique), `name`, `status` (`ONLINE`, `OFFLINE`, `PENDING`)
7. **`accounts_printeroidmapping` (PrinterOidMapping 모델)**
   * `id`: PK, `vendor_name`, `oid_key`, `oid_value`, `is_active`
   * `unique_together = ("vendor_name", "oid_key")`

### 2) 관제 및 마스터 모델 테이블

8. **`temp_oid_lists` (`TempOidListMaster` 모델 - 임시 스테이징)**: 검색 에이전트 스캔 직후 1차 임시 스테이징 저장소 (`status: PENDING`/`CONFIRMED`/`REJECTED`)
9. **`oid_lists` (`OidListMaster` 모델 - 정식 마스터)**: 제조사/모델별 OID 1:1 풀 맵 마스터 저장소
9. **`printers` (PrinterModelMaster 모델)**: 프린터 및 복합기 모델 마스터 (`printer_model` unique)
10. **`monitoring_customers` (MonitoringCustomer 모델)**: 사업장별 관제 대상 고객사 (`unique_together = ("workplace", "customer_id")`)
11. **`monitoring_printers` (MonitoringPrinter 모델)**: 모니터링 복합기 장비 마스터 (`unique_together = ("workplace", "serial_no")`)
12. **`monitoring_data` (MonitoringData 모델 - Hot DB)**: 실시간 관제 최신 패널 (`unique_together = ("workplace", "serial_no")`, `MonitoringPrinter` 1:1 매핑)
13. **`monitoring_data_records` (MonitoringDataRecord 모델 - Cold Time-Series DB)**: 일별 시계열 이력 누적 적재 (`unique_together = ("monitoring_printer", "yyyymmdd")`)
14. **`supplies` (SuppliesAlert 모델)**: 소모품 경고 상태 (`unique_together = ("workplace", "serial_no")`)
15. **`supply_usages` (SupplyUsage 모델)**: 소모품 교체 및 사용 이력
16. **`unregistered_printers` (UnregisteredPrinter 모델)**: 현장 탐지 미등록 복합기 저장소 (`unique_together = ("workplace", "ip")`)
