# 🖥️ PartnerOn Windows SNMP Agent 설치 및 운영 가이드

본 에이전트 프로그램은 Windows 10/11 환경에서 사내 복합기 및 프린터의 SNMP 카운터를 주기적으로 자동 수집하여 파트너온 클라우드 서버로 암호화 전송하는 Windows 상주형 프로그램입니다.

---

## 🚀 1. 빠른 설치 및 인증 방법

1. **에이전트 다운로드**: 파트너온 웹의 **[자산/모니터링 › 수집기 다운로드]** 메뉴에서 `PartneronAgent.zip` 다운로드 후 압축 해제.
2. **실행 파일 구동**: `PartneronAgent.exe` (또는 `main.py`) 실행.
3. **8자리 인증 코드 입력**: 파트너온 웹 화면에서 발급받은 8자리 인증 코드를 입력합니다.
   * 인증이 완료되면 `config.dat` 설정 파일이 **Windows DPAPI 기술로 암호화 저장**되어 토큰이 안전하게 보호됩니다.

---

## 🛡️ 2. Chrome 및 Windows SmartScreen 차단 대응 안내

### ① Chrome 브라우저에서 다운로드 차단 시
* 다운로드 창에서 **`[위험한 파일 다운로드 유지]`** 선택 ➔ **`[계속 다운로드]`** 클릭.

### ② Windows SmartScreen "PC 보호" 팝업 발생 시
1. 파란색 경고 창에서 **`[추가 정보]`** 글자 클릭.
2. 하단에 나타나는 **`[실행]`** 버튼 클릭.

---

## 📌 3. 주요 기능 및 명령줄 사용법

### 1) 8자리 인증 코드로 자동 활성화 실행
```cmd
PartneronAgent.exe --auth 8A9F2K11 --server https://partneron.co.kr
```

### 2) 대역 스캔 안 되는 미수집 장비 IP 수동 직접 추가
```cmd
PartneronAgent.exe --add-ip 192.168.10.55
```

---

## 🗑️ 4. 에이전트 삭제 방법

1. 실행 중인 `PartneronAgent.exe` 프로세스를 종료(Ctrl+C 또는 작업관리자 종료)합니다.
2. 에이전트 폴더 및 `config.dat` 암호화 파일을 완전히 삭제합니다.
