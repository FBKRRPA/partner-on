# 📄 ADR 0001: OID DB 테이블 단일 마스터(`oid_lists`) 통합

* **작성 일자**: 2026-08-18
* **작성 개발자**: HR (현률)
* **AI 에이전트**: Antigravity AI Pair Programmer
* **최종 의사결정자**: HR (현률)
* **상태**: 승인됨 (Approved)

---

## 🎯 1. 의사결정 배경 및 문제 정의 (Context & Problem Statement)

기존 시스템에는 OID 저장을 위해 `PrinterOidMapping` (Key-Value 경량 테이블)과 `oid_lists` (`OidListMaster` 26개 필드 마스터 테이블) 2개 테이블이 이원화되어 존재했음.
이로 인해 OID 수정/추가 시 2개 DB 테이블을 동시 갱신해야 하여 데이터 파편화 및 관리 이중화 문제가 발생함.

---

## 💡 2. 검토한 대안들 (Considered Options)

* **대안 1 (기존 유지)**: 2개 테이블을 계속 이원화하여 사용 (데이터 중복 위험 존재).
* **대안 2 (단일 통합 - 채택)**: `PrinterOidMapping` 레거시 테이블을 삭제하고, `oid_lists` 1개 마스터 DB로 전사 OID 관리 및 API 직렬화 통합.

---

## ✅ 3. 최종 결정 내용 및 아키텍처 (Decision & Architecture)

* **선택한 결정**: `PrinterOidMapping` 모델 및 DB 테이블(`accounts_printeroidmapping`) 수술 삭제 (`0020_delete_printeroidmapping.py`).
* **구현 방안**: `AgentFetchOidsView` 및 `TempOidListActionView` 등 백엔드 API가 `oid_lists` (`OidListMaster`) 1개 마스터 DB에서 직접 OID 스펙을 파싱/리턴하도록 일원화.

---

## 👥 4. 결정 주체 및 히스토리 (Ownership & History)

* **AI 에이전트 제안**: 레거시 2개 테이블 구조의 문제점 감사 후 `oid_lists` 단일 마스터 통합안 제안.
* **최종 승인자**: **대표님**의 명시적 승인("진행해줘")을 통해 최종 채택 및 프로덕션 반영 완료.
