# ADR 0002: DeviceMaintenanceRecord 모델 신설 및 CE 정기점검 이력 관리

* **작성 일자**: 2026-08-19
* **작성 개발자**: Dev B (팀원)
* **AI 에이전트**: Antigravity AI Pair Programmer
* **최종 의사결정자**: HR 대표님 (Final Approval)
* **상태**: 승인됨 (Approved)

---

## 1. 의사결정 배경 및 문제 정의 (Context & Problem Statement)

렌탈 복합기 장비의 정기점검 이력, 소모품 교체 기록, 담당 CE 코멘트를 시스템에 체계적으로 적재하기 위해 `DeviceMaintenanceRecord` 모델 신설 필요.

---

## 2. 검토한 대안들 (Considered Options)

* **대안 1 (수집 데이터 비고 필드 활용)**: 시계열 변경 이력 추적 불가능.
* **대안 2 (독립 점검 이력 테이블 신설 - 채택)**: `DeviceMaintenanceRecord` 테이블로 `PrinterAsset` 1:N 매핑 관리.

---

## 3. 최종 결정 내용 및 아키텍처 (Decision & Architecture)

* **선택한 결정**: `DeviceMaintenanceRecord` 모델 신설 (`printer`, `technician_name`, `inspection_notes`, `inspected_at`).
* **채택 이유**: 복합기 자산별 정비 이력 완전성 보장.

---

## 4. 결정 주체 및 히스토리 (Ownership & History)

* **AI 에이전트 제안**: Dev B 서브폴더 `docs/adr/DevB/`에 독립 0002번 ADR 작성 제안.
* **최종 승인자**: **HR 대표님**의 최종 승인 완료.
