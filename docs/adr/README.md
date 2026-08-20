# PartnerOn v1.0 Architecture Decision Records (ADR)

PartnerOn 프로젝트에서 LLM AI 페어 프로그래밍(바이브코딩) 및 개발자 협업 시 도출된 **주요 기술적 의사결정 배경, 선택 이유, 최종 결정 주체**를 중앙 관리하는 ADR 저장소입니다.

---

## 1. ADR 생성 및 작성 프로세스 (개발자 + LLM 표준 수칙)

1. **개발자 성함 식별**: LLM 에이전트는 세션 시작 시 **작업 개발자(담당자)의 성함/닉네임**을 확인하여 식별합니다.
2. **주요 의사결정 발생 시**: 아키텍처 변경, DB 구조 통합, 핵심 수집 로직 수정 시 `docs/adr/<개발자명>/` 폴더에 다음 번호로 ADR 문서를 자동 작성합니다.
   * 예: `docs/adr/HR/0003-new-feature-architecture.md`
3. **결정 주체 기록**: 문서 하단에 "작성자(개발자 성함)", "AI 에이전트 제안 내용", "최종 결정자/승인자"를 반드시 명시합니다.

---

## 2. 개발자별 ADR 목차 (Developer ADR Index)

### HR 대표님 (`docs/adr/HR/`)
* [0001-consolidate-oid-master-table.md](HR/0001-consolidate-oid-master-table.md) - OID DB 테이블 단일 마스터(`oid_lists`) 통합
* [0002-agent-subnet-scan-branching.md](HR/0002-agent-subnet-scan-branching.md) - Agent 서브넷 지정 스캔 & 미등록 DB 이중 수집 분리
* [0003-ai-chat-log-model.md](HR/0003-ai-chat-log-model.md) - AIChatLog 모델 신설 및 대화 이력 저장소 구축
* [0004-fernet-encrypted-2fa-fields.md](HR/0004-fernet-encrypted-2fa-fields.md) - 2FA TOTP 비밀키 및 백업코드 Fernet 양방향 암호화 필드 신설
* [0005-rate-limiting-for-agent-auth-and-invites.md](HR/0005-rate-limiting-for-agent-auth-and-invites.md) - agent_auth 및 invite_code Rate Limit (ScopedRateThrottle) 429 차단 도입

### Dev B 팀원 (`docs/adr/DevB/`)
* [0001-sample-module-design.md](DevB/0001-sample-module-design.md) - Dev B 파이프라인 모듈 설계 실전 검증
* [0002-device-maintenance-record.md](DevB/0002-device-maintenance-record.md) - DeviceMaintenanceRecord 모델 신설 및 CE 정기점검 이력 관리
