# 📄 ADR 0002: Agent 서브넷 지정 스캔 & 미등록 DB 이중 수집 분리

* **작성 일자**: 2026-08-18
* **작성 개발자**: 개발자 (PartnerOn Dev Team)
* **AI 에이전트**: Antigravity AI Pair Programmer
* **최종 의사결정자**: 대표님 (Final Approval)
* **상태**: 승인됨 (Approved)

---

## 🎯 1. 의사결정 배경 및 문제 정의 (Context & Problem Statement)

현장에 설치된 수집 에이전트(Agent)가 서브넷 대역(.1~.254)을 직접 지정하여 스캔을 수행하고, 탐지된 모든 복합기 기기를 서버로 전송할 때 관제 DB 오염 없이 미인증/미등록 장비와 정식 자산 기기를 분리하여 수용해야 하는 명확한 3가지 스캔 분기 규칙이 필요함.

---

## 💡 2. 검토한 대안들 (Considered Options)

* **조건 1 (Agent 자체 서브넷 지정 풀스캔 수집)**: Agent 자체에서 서브넷(예: `192.168.0.0/24`)을 지정하여 직접 탐지 스캔을 수행하고 전체 리스트를 패킷 전송 ➔ 백엔드는 `unregistered_printers` DB 테이블에 분리 저장.
* **조건 2 (미등록 장비 재스캔 파라미터 전달)**: 명시적 `-u` / `?scan_unregistered=true` 수신 시 강제 풀스캔.
* **조건 3 (기존 등록 장비 정기 관제 수집)**: 정식 등록 기기 대상 3분 주기 0.5초 핀포인트 관제 수집.

---

## ✅ 3. 최종 결정 내용 및 아키텍처 (Decision & Architecture)

* **선택한 결정**: Agent 스캔 4단계 라이프사이클 (스캔 ➔ 미인증 리스팅 ➔ 정식 매칭 ➔ 관제 수집) 정립.
* **구현 방안**: `AgentTargetAssetsView` 및 `AgentIngestBatchView`에 IP Resolution Directive 및 Dual Ingestion Storage 연동 수술 반영.

---

## 👥 4. 결정 주체 및 히스토리 (Ownership & History)

* **AI 에이전트 제안**: 에이전트 수집 프로세스 및 백엔드 5개 REST API 매핑 안 제시.
* **최종 승인자**: **대표님**의 명시적 수칙 정정 및 승인을 통해 최종 채택 및 명세 문서 반영 완료.
