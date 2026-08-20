# ADR 0005: agent_auth 및 invite_code Rate Limit (ScopedRateThrottle) 429 차단 도입

* **작성 일자**: 2026-08-20
* **작성 개발자**: HR
* **AI 에이전트**: Antigravity AI Pair Programmer
* **최종 의사결정자**: HR
* **상태**: 승인됨 (Approved)

---

## 1. 의사결정 배경 및 문제 정의 (Context & Problem Statement)

8자리 수집기 코드(`AST-XXXXXX`) 및 회원가입 초대 코드를 1초에 수천 번 무차별 대입(Brute-Force)하는 해킹 공격을 방지하기 위해 DRF Throttling 도입 필요.

---

## 2. 검토한 대안들 (Considered Options)

* **대안 1 (IP 단위 단순 Throttling)**: 동일 사내망 IP에서 여러 수집기가 접속할 경우 정상 요청까지 차단될 위험이 있음.
* **대안 2 (ScopedRateThrottle 스코프 분리 - 채택)**: `agent_auth` 및 `invite_verify` 전용 스코프를 만들어 분당 5회 제한(`5/minute`)을 부여하고, 6회째 시도부터 `429 Too Many Requests` 상태 코드로 즉시 차단.

---

## 3. 최종 결정 내용 및 아키텍처 (Decision & Architecture)

* **선택한 결정**:
  1. `settings.py`에 `DEFAULT_THROTTLE_RATES = {"agent_auth": "5/minute", "invite_verify": "5/minute"}` 세팅.
  2. `AgentAuthExchangeView` 및 `SignUpWithInviteView`에 `throttle_classes = [ScopedRateThrottle]` 적용.
* **채택 이유**: KISA SW 보안약점 가이드 및 7대 고도화 이슈 3순위 지침 준수.

---

## 4. 결정 주체 및 히스토리 (Ownership & History)

* **AI 에이전트 제안**: ScopedRateThrottle 스코프 분리 및 429 차단 방안 제안.
* **최종 승인자**: **HR** 작성 및 최종 승인 완료.
