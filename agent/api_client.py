"""
PartnerOn Agent API Client
Handles Auth Code authentication, downloading dynamic OIDs from Server, and Batch HTTPS Ingestion.
"""

import json
import urllib.request
import urllib.error
from typing import Dict, Any, List

class ApiClient:
    def __init__(self, server_url: str = "http://localhost:8000"):
        self.server_url = server_url.rstrip("/")

    def authenticate_code(self, auth_code: str) -> Dict[str, Any]:
        """Exchanges 8-digit Auth Code for Agent Token from Server"""
        url = f"{self.server_url}/api/v1/agent/authenticate/"
        payload = json.dumps({"auth_code": auth_code}).encode("utf-8")
        req = urllib.request.Request(
            url,
            data=payload,
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        try:
            with urllib.request.urlopen(req, timeout=10) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                return data
        except Exception as e:
            raise Exception(f"인증에 실패했습니다: {e}")

    def fetch_latest_oids(self, agent_token: str) -> Dict[str, Any]:
        """Downloads latest OID mapping table dynamically from Server"""
        url = f"{self.server_url}/api/v1/agent/oids/"
        req = urllib.request.Request(
            url,
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {agent_token}",
            },
            method="GET",
        )
        try:
            with urllib.request.urlopen(req, timeout=10) as resp:
                return json.loads(resp.read().decode("utf-8"))
        except Exception:
            # Fallback to empty dict (uses default OIDs in scanner)
            return {}

    def upload_batch_data(self, agent_token: str, scanned_devices: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Batch uploads scanned printer dataset to Server in 1 HTTPS request"""
        url = f"{self.server_url}/api/v1/agent/ingest/"
        payload = json.dumps({"devices": scanned_devices}).encode("utf-8")
        req = urllib.request.Request(
            url,
            data=payload,
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {agent_token}",
            },
            method="POST",
        )
        try:
            with urllib.request.urlopen(req, timeout=15) as resp:
                return json.loads(resp.read().decode("utf-8"))
        except Exception as e:
            raise Exception(f"데이터 업로드 실패: {e}")

    def update_status(self, agent_token: str, status: str = "OFFLINE") -> Dict[str, Any]:
        """Notifies Server of Agent status change (e.g. OFFLINE on shutdown)"""
        url = f"{self.server_url}/api/v1/agent/status/"
        payload = json.dumps({"status": status}).encode("utf-8")
        req = urllib.request.Request(
            url,
            data=payload,
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {agent_token}",
            },
            method="POST",
        )
        try:
            with urllib.request.urlopen(req, timeout=5) as resp:
                return json.loads(resp.read().decode("utf-8"))
        except Exception:
            return {}
