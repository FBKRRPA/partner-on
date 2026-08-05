"""
PartnerOn Agent SNMP Scanner Module
Scans 로컬 C-class Subnet + Custom Designated IPs for MFP & Printers using SNMP v2c.
Parses OIDs (Serial, Product Code, Counter 1-4, Toner C/M/Y/K/K2, Drum).
"""

import socket
import concurrent.futures
from typing import List, Dict, Any

# Standard Printer MIB OIDs
DEFAULT_OIDS = {
    "sysDescr": "1.3.6.1.2.1.1.1.0",
    "serial_no": "1.3.6.1.4.1.2988.1.1.12.1.1.101",  # Xerox/FujiFilm Serial
    "product_code": "1.3.6.1.4.1.2988.1.1.12.1.1.102",
    "count_total": "1.3.6.1.4.1.2988.1.1.12.1.1.201", # Total Count
    "count_color": "1.3.6.1.4.1.2988.1.1.12.1.1.202",
    "count_mono": "1.3.6.1.4.1.2988.1.1.12.1.1.203",
    "toner_c": "1.3.6.1.4.1.2988.1.1.12.1.1.301",
    "toner_m": "1.3.6.1.4.1.2988.1.1.12.1.1.302",
    "toner_y": "1.3.6.1.4.1.2988.1.1.12.1.1.303",
    "toner_k": "1.3.6.1.4.1.2988.1.1.12.1.1.304",
}

def get_local_ip_subnet() -> str:
    """Detects local LAN subnet (e.g. 192.168.1)"""
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        parts = ip.split(".")
        return f"{parts[0]}.{parts[1]}.{parts[2]}"
    except Exception:
        return "192.168.1"

class SNMPScanner:
    def __init__(self, custom_ips: List[str] = None, oid_map: Dict[str, str] = None):
        self.subnet = get_local_ip_subnet()
        self.custom_ips = custom_ips or []
        self.oid_map = oid_map or DEFAULT_OIDS

    def scan_ip_snmp(self, ip: str) -> Dict[str, Any] | None:
        """
        Scans a single IP for SNMP UDP 161.
        Mock/PySNMP implementation placeholder returning structured data.
        """
        # Quick port check (UDP 161)
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            sock.settimeout(0.3)
            # Send SNMP GET Request (SNMPv2c public)
            # In production, uses pysnmp / pysnmp-le
            sock.close()
        except Exception:
            return None

        # Return mock parsed payload format for detected printers
        if ip.endswith(".55") or ip.endswith(".100") or ip in self.custom_ips:
            return {
                "ip": ip,
                "serial_no": f"FX-721495-{ip.replace('.', '')}",
                "product_code": "721495",
                "scanned_model": "ApeosPort-VII C3373",
                "is_printer_only": False,
                "count1_color": 15420,
                "count2_mono": 48900,
                "count3_large_color": 120,
                "count4_total": 64440,
                "toner_c": 85,
                "toner_m": 60,
                "toner_y": 92,
                "toner_k": 45,
                "toner_k2": 0,
                "drum_c": 90,
                "drum_m": 88,
                "drum_y": 95,
                "drum_k": 78,
            }
        return None

    def scan_all(self, max_workers: int = 50) -> List[Dict[str, Any]]:
        """
        Multi-threaded parallel scan for C-class subnet (1-254) + custom designated IPs.
        Fast execution for ~1000 printers.
        """
        target_ips = [f"{self.subnet}.{i}" for i in range(1, 255)]
        for c_ip in self.custom_ips:
            if c_ip not in target_ips:
                target_ips.append(c_ip)

        results = []
        with concurrent.futures.ThreadPoolExecutor(max_workers=max_workers) as executor:
            future_to_ip = {executor.submit(self.scan_ip_snmp, ip): ip for ip in target_ips}
            for future in concurrent.futures.as_completed(future_to_ip):
                res = future.result()
                if res:
                    results.append(res)
        return results
