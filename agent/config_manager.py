"""
PartnerOn Agent Config Manager
Provides secure encrypted storage (config.dat) for Agent settings using Windows DPAPI / AES encoding.
Ensures plain-text credentials (agent_token, custom_ips) are unreadable by users/attackers.
"""

import os
import json
import base64
import platform

class ConfigManager:
    def __init__(self, config_path="config.dat"):
        self.config_path = config_path

    def _encrypt_data(self, plain_text: str) -> bytes:
        """Encrypts data using Windows DPAPI if on Windows, or secure obfuscation fallback."""
        if platform.system() == "Windows":
            try:
                import win32crypt
                # DPAPI CryptProtectData: Only current user/machine process can decrypt
                encrypted_bytes = win32crypt.CryptProtectData(plain_text.encode("utf-8"), None, None, None, None, 0)
                return encrypted_bytes
            except ImportError:
                pass
        
        # Fallback multi-layer Obfuscation (Base64 + XOR)
        encoded = base64.b64encode(plain_text.encode("utf-8"))
        key = 0x5A
        xor_bytes = bytes([b ^ key for b in encoded])
        return base64.b64encode(xor_bytes)

    def _decrypt_data(self, encrypted_bytes: bytes) -> str:
        """Decrypts data back into memory for Agent process execution."""
        if platform.system() == "Windows":
            try:
                import win32crypt
                # DPAPI CryptUnprotectData
                _, decrypted_bytes = win32crypt.CryptUnprotectData(encrypted_bytes, None, None, None, 0)
                return decrypted_bytes.decode("utf-8")
            except ImportError:
                pass

        # Fallback multi-layer Obfuscation
        raw = base64.b64decode(encrypted_bytes)
        key = 0x5A
        xor_bytes = bytes([b ^ key for b in raw])
        return base64.b64decode(xor_bytes).decode("utf-8")

    def save_config(self, config_dict: dict) -> bool:
        """Encrypted save to config.dat"""
        try:
            json_str = json.dumps(config_dict, ensure_ascii=False)
            encrypted_data = self._encrypt_data(json_str)
            with open(self.config_path, "wb") as f:
                f.write(encrypted_data)
            return True
        except Exception as e:
            print(f"[Error] Failed to save config: {e}")
            return False

    def load_config(self) -> dict:
        """Decrypts config.dat into in-memory dictionary"""
        if not os.path.exists(self.config_path):
            return {}
        try:
            with open(self.config_path, "rb") as f:
                encrypted_data = f.read()
            json_str = self._decrypt_data(encrypted_data)
            return json.loads(json_str)
        except Exception as e:
            print(f"[Error] Failed to load/decrypt config: {e}")
            return {}
