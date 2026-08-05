"""
PartnerOn Agent Main Service (Windows 10+)
Manages Auth Code input, DPAPI encrypted config.dat, daemon background scan loop, and custom IP addition.
"""

import sys
import time
import argparse
from config_manager import ConfigManager
from api_client import ApiClient
from snmp_scanner import SNMPScanner

AGENT_VERSION = "v1.2.0-v2test"

def main():
    parser = argparse.ArgumentParser(description="PartnerOn Windows SNMP Agent")
    parser.add_argument("--auth", type=str, help="8-digit Auth Code for Agent initial activation")
    parser.add_argument("--add-ip", type=str, help="Manually add custom designated printer IP")
    parser.add_argument("--server", type=str, default="http://localhost:8000", help="PartnerOn Server URL")
    parser.add_argument("--interval", type=int, default=3600, help="Scan interval in seconds (default: 3600s)")
    parser.add_argument("--mode", type=str, choices=["auto", "get", "walk"], default="auto", help="SNMP Scan Mode (auto/get/walk)")
    args = parser.parse_args()

    print("============================================================")
    print(f"  PartnerOn Windows SNMP Agent ({AGENT_VERSION}) - Mode: {args.mode.upper()}")
    print("============================================================")

    config_mgr = ConfigManager()
    cfg = config_mgr.load_config()

    server_url = args.server or cfg.get("server_url", "http://localhost:8000")
    api_client = ApiClient(server_url=server_url)

    # 1. Handle Custom IP Addition if specified
    if args.add_ip:
        custom_ips = cfg.get("custom_ips", [])
        if args.add_ip not in custom_ips:
            custom_ips.append(args.add_ip)
            cfg["custom_ips"] = custom_ips
            config_mgr.save_config(cfg)
            print(f"[SUCCESS] 수동 IP [{args.add_ip}]가 암호화 설정에 등록되었습니다.")
        else:
            print(f"[INFO] IP [{args.add_ip}]는 이미 등록되어 있습니다.")

    # 2. Initial Auth Code Activation
    if args.auth or not cfg.get("agent_token"):
        auth_code = args.auth
        if not auth_code:
            print("\n" + "=" * 60)
            print("  [PartnerOn Windows SNMP Agent - 수집기 최초 설정]")
            print("  파트너온 웹 화면 [자산 및 입출고 > 수집기/에이전트 관리]에서")
            print("  발급받으신 8자리 인증 코드 (예: AST-8A9F2K)를 입력해 주세요.")
            print("=" * 60)
            auth_code = input(">> 8자리 인증 코드 입력: ").strip()

        print(f"\n[INFO] 인증 코드 [{auth_code}]로 파트너온 클라우드 서버에 접속을 시도합니다...")
        try:
            res = api_client.authenticate_code(auth_code)
            token = res.get("token") or f"agent_token_{auth_code}"
            cfg["agent_token"] = token
            cfg["server_url"] = server_url
            config_mgr.save_config(cfg)
            print("[SUCCESS] 에이전트 인증 성공! 수집기 토큰이 Windows DPAPI로 암호화 저장되었습니다.\n")
        except Exception as e:
            print(f"[ERROR] 인증 실패: {e}")
            sys.exit(1)

    agent_token = cfg.get("agent_token")
    custom_ips = cfg.get("custom_ips", [])

    print(f"[INFO] 에이전트 상주 수집기를 시작합니다. (스캔 주기: {args.interval}초, 등록 수동 IP: {len(custom_ips)}개)")

    # 3. Main Ingestion Loop
    while True:
        try:
            print(f"\n[{time.strftime('%Y-%m-%d %H:%M:%S')}] 최신 OID 다운로드 및 LAN 스캔 시작...")
            
            # Fetch dynamic OIDs from Server
            oid_map = api_client.fetch_latest_oids(agent_token)
            
            # Perform multi-threaded SNMP scan with chosen mode (AUTO / GET / WALK)
            scanner = SNMPScanner(custom_ips=custom_ips, oid_map=oid_map, mode=args.mode)
            scanned_devices = scanner.scan_all()

            print(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] 스캔 완료: 총 {len(scanned_devices)}대 복합기/프린터 감지됨.")

            if scanned_devices:
                # Batch HTTPS Upload
                upload_res = api_client.upload_batch_data(agent_token, scanned_devices)
                print(f"[SUCCESS] 클라우드 배치 업로드 완료: {upload_res.get('detail', '성공')}")

        except KeyboardInterrupt:
            print("\n[INFO] 사용자에 의해 에이전트가 종료됩니다. 서버에 오프라인 상태를 통보합니다...")
            try:
                api_client.update_status(agent_token, "OFFLINE")
            except Exception:
                pass
            print("[INFO] 에이전트가 안전하게 종료되었습니다.")
            break
        except Exception as e:
            print(f"[WARNING] 주기 수집 중 오류 발생 (다음 주기에 재시도): {e}")

        time.sleep(args.interval)

if __name__ == "__main__":
    main()
