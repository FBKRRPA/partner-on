# ADR 0004: 2FA TOTP 비밀키 및 백업코드 Fernet 양방향 암호화 필드 신설

* **작성 일자**: 2026-08-20
* **작성 개발자**: HR
* **AI 에이전트**: Antigravity AI Pair Programmer
* **최종 의사결정자**: HR
* **상태**: 승인됨 (Approved)

---

## 1. 의사결정 배경 및 문제 정의 (Context & Problem Statement)

2FA OTP 비밀키(`totp_secret`)와 백업 코드가 DB 덤프 시 평문(Plaintext)으로 노출되는 치명적 보안 위협을 차단하기 위해 양방향 암호화(Symmetric Encryption) 적용 필요.

---

## 2. 검토한 대안들 (Considered Options)

* **대안 1 (단방향 PBKDF2 해시)**: 비밀번호와 달리 TOTP 비밀키는 OTP 번호 계산 및 QR 생성을 위해 서버 복호화가 필요하므로 단방향 해시 사용 불가.
* **대안 2 (Fernet AES-128-CBC + HMAC-SHA256 양방향 암호화 - 채택)**: `cryptography` 라이브러리의 표준 Fernet 대칭키 암호화 적용. 대칭키(`FERNET_KEY`)를 `.env` 환경변수에 격리하여 DB 유출 시에도 해독 불가능성 보장.

---

## 3. 최종 결정 내용 및 아키텍처 (Decision & Architecture)

* **선택한 결정**:
  1. `backend/accounts/fields.py`에 Django 커스텀 `EncryptedCharField` 구현.
  2. `User.totp_secret` 및 `User.backup_codes` 필드 타입 변경 및 DB 마이그레이션 (`0022`) 적용.
* **채택 이유**: DB 적재 시 자동 암호화(`gAAAAA...`), 인메모리 사용 시 자동 복호화로 기존 2FA 로직 100% 하위 호환성 유지.

---

## 4. 결정 주체 및 히스토리 (Ownership & History)

* **AI 에이전트 제안**: EncryptedCharField 구현 및 마이그레이션 방안 제안.
* **최종 승인자**: **HR** 작성 및 최종 승인 완료.
