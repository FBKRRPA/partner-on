# 📑 PartnerOn v1.0 Architecture Decision Records (ADR)

PartnerOn 프로젝트에서 LLM AI 페어 프로그래밍(바이브코딩) 및 개발자 협업 시 도출된 **주요 기술적 의사결정 배경, 선택 이유, 최종 결정 주체**를 중앙 관리하는 ADR 저장소입니다.

---

## 📋 ADR 생성 및 작성 프로세스 (개발자 + LLM 표준 수칙)

1. **개발자 성함 식별**: LLM 에이전트는 세션 시작 시 **작업 개발자(담당자)의 성함/닉네임**을 확인하여 식별합니다.
2. **주요 의사결정 발생 시**: 아키텍처 변경, DB 구조 통합, 핵심 수집 로직 수정 시 `docs/adr/` 폴더에 다음 번호로 ADR 문서를 자동 작성합니다.
   * 예: `docs/adr/0003-new-feature-architecture.md`
3. **결정 주체 기록**: 문서 하단에 "작성자(개발자 성함)", "AI 에이전트 제안 내용", "최종 결정자/승인자"를 반드시 명시합니다.

---

## 📂 ADR 목록

* [0000-template.md](file:///d:/workspace/Partneron_v1/docs/adr/0000-template.md) - ADR 작성용 표준 템플릿
* [0001-consolidate-oid-master-table.md](file:///d:/workspace/Partneron_v1/docs/adr/0001-consolidate-oid-master-table.md) - OID DB 테이블 단일 마스터(`oid_lists`) 통합
* [0002-agent-subnet-scan-branching.md](file:///d:/workspace/Partneron_v1/docs/adr/0002-agent-subnet-scan-branching.md) - Agent 서브넷 지정 스캔 & 미등록 DB 이중 수집 분리
