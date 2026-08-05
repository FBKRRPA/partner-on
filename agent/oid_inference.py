"""
PartnerOn Intelligent OID Inference Engine for Agent Scanner
"""
import re
from typing import Dict, Any

class OidInferenceEngine:
    VENDOR_OIDS = {
        "Fujifilm": {
            "serial_no": "1.3.6.1.4.1.2988.1.1.12.1.1.101",
            "model_name": "1.3.6.1.4.1.2988.1.1.12.1.1.102",
            "count_total": "1.3.6.1.4.1.2988.1.1.12.1.1.201",
            "count_color": "1.3.6.1.4.1.2988.1.1.12.1.1.202",
            "count_mono": "1.3.6.1.4.1.2988.1.1.12.1.1.203",
            "toner_c": "1.3.6.1.4.1.2988.1.1.12.1.1.301",
            "toner_m": "1.3.6.1.4.1.2988.1.1.12.1.1.302",
            "toner_y": "1.3.6.1.4.1.2988.1.1.12.1.1.303",
            "toner_k": "1.3.6.1.4.1.2988.1.1.12.1.1.304",
            "drum_k": "1.3.6.1.4.1.2988.1.1.12.1.1.305",
        },
        "Canon": {
            "serial_no": "1.3.6.1.4.1.1608.1.1.1.1.1.1",
            "model_name": "1.3.6.1.2.1.1.1.0",
            "count_total": "1.3.6.1.4.1.1608.1.2.1.2.1",
            "count_color": "1.3.6.1.4.1.1608.1.2.1.2.2",
            "count_mono": "1.3.6.1.4.1.1608.1.2.1.2.3",
            "toner_k": "1.3.6.1.4.1.1608.1.3.1.1.1",
        },
        "Ricoh": {
            "serial_no": "1.3.6.1.4.1.367.1.1.1.1.1",
            "model_name": "1.3.6.1.2.1.1.1.0",
            "count_total": "1.3.6.1.4.1.367.1.2.1.2.1",
            "count_color": "1.3.6.1.4.1.367.1.2.1.2.2",
            "count_mono": "1.3.6.1.4.1.367.1.2.1.2.3",
        },
        "HP": {
            "serial_no": "1.3.6.1.4.1.11.2.3.9.4.2.1.1.3",
            "model_name": "1.3.6.1.2.1.1.1.0",
            "count_total": "1.3.6.1.2.1.43.10.2.1.4.1.1",
            "toner_k": "1.3.6.1.2.1.43.11.1.1.9.1.1",
        },
        "Standard": {
            "serial_no": "1.3.6.1.2.1.43.5.1.1.17.1",
            "model_name": "1.3.6.1.2.1.1.1.0",
            "count_total": "1.3.6.1.2.1.43.10.2.1.4.1.1",
            "toner_k": "1.3.6.1.2.1.43.11.1.1.9.1.1",
        }
    }

    @classmethod
    def detect_vendor(cls, sys_descr: str, raw_model: str) -> str:
        combined = f"{sys_descr} {raw_model}".upper()
        if "FUJIFILM" in combined or "FUJI" in combined or "XEROX" in combined or "APEOS" in combined or "DOCUCENTRE" in combined:
            return "Fujifilm"
        elif "CANON" in combined or "IR-ADV" in combined or "IMAGERUNNER" in combined:
            return "Canon"
        elif "RICOH" in combined or "SAVIN" in combined or "LANIER" in combined:
            return "Ricoh"
        elif "HP" in combined or "HEWLETT" in combined or "LASERJET" in combined:
            return "HP"
        return "Standard"

    @classmethod
    def infer_clean_model(cls, sys_descr: str, raw_model: str) -> str:
        source = raw_model.strip() if raw_model and raw_model.strip() != "Standard MFP" else sys_descr.strip()
        if not source:
            return "Standard Network MFP"

        source = re.sub(r'^(Software\s+Release|Ver\.|Firmware\s+Version|System\s+Description:?)\s*', '', source, flags=re.I)
        model_match = re.search(r'([A-Za-z0-9\-_]+(?:\s+[A-Za-z0-9\-_]+){1,3})', source)
        if model_match:
            candidate = model_match.group(1).strip()
            if len(candidate) >= 3 and not candidate.startswith("Linux") and not candidate.startswith("VxWorks"):
                return candidate
        return source[:50]

    @classmethod
    def infer_device_data(cls, device_payload: Dict[str, Any]) -> Dict[str, Any]:
        inferred = dict(device_payload)
        sys_descr = inferred.get("sysDescr", "")
        raw_model = inferred.get("model_name", "")
        
        vendor = cls.detect_vendor(sys_descr, raw_model)
        inferred["vendor_name"] = vendor

        if not inferred.get("model_name") or inferred["model_name"] == "Standard MFP":
            inferred["model_name"] = cls.infer_clean_model(sys_descr, raw_model)

        if not inferred.get("serial_no"):
            s_match = re.search(r'(FX-[0-9A-Z]{5,15}|[A-Z0-9]{8,15})', sys_descr)
            if s_match:
                inferred["serial_no"] = s_match.group(1)

        c_total = inferred.get("count_total", 0)
        c_color = inferred.get("count_color", 0)
        c_mono = inferred.get("count_mono", 0)

        if c_total == 0 and (c_color > 0 or c_mono > 0):
            inferred["count_total"] = c_color + c_mono
        elif c_total > 0 and c_color == 0 and c_mono == 0:
            inferred["count_mono"] = int(c_total * 0.75)
            inferred["count_color"] = int(c_total * 0.25)

        for supply_key in ["toner_c", "toner_m", "toner_y", "toner_k", "drum_k"]:
            if inferred.get(supply_key) is None or inferred.get(supply_key) == 0:
                inferred[supply_key] = 100

        return inferred
