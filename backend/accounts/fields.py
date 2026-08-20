import base64
from cryptography.fernet import Fernet
from django.conf import settings
from django.db import models


def get_fernet() -> Fernet:
    """
    Returns Fernet cipher instance using settings.FERNET_KEY or derived 32-byte key.
    """
    key_str = getattr(settings, "FERNET_KEY", "u27P8B9vS3_Q1Z4x5k7L8m9N0p1Q2r3S4t5U6v7W8x9=")
    if isinstance(key_str, str):
        key_bytes = key_str.encode("utf-8")
    else:
        key_bytes = key_str
    
    # Ensure key is valid 32-byte urlsafe base64
    if len(key_bytes) != 44:
        # Fallback pad/truncate to 32 bytes for Fernet
        raw_key = (key_bytes + b"0" * 32)[:32]
        key_bytes = base64.urlsafe_b64encode(raw_key)
        
    return Fernet(key_bytes)


class EncryptedCharField(models.CharField):
    """
    Django Field that encrypts sensitive data transparently on DB write
    and decrypts on DB read using Fernet symmetric encryption.
    """
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

    def from_db_value(self, value, expression, connection):
        if value is None or value == "":
            return value
        # If value is already plaintext (legacy migration compatibility)
        if not value.startswith("gAAAAA"):
            return value
        try:
            cipher = get_fernet()
            decrypted = cipher.decrypt(value.encode("utf-8")).decode("utf-8")
            return decrypted
        except Exception:
            return value

    def to_python(self, value):
        if isinstance(value, str) and value.startswith("gAAAAA"):
            try:
                cipher = get_fernet()
                return cipher.decrypt(value.encode("utf-8")).decode("utf-8")
            except Exception:
                return value
        return value

    def get_prep_value(self, value):
        value = super().get_prep_value(value)
        if value is None or value == "":
            return value
        if isinstance(value, str) and value.startswith("gAAAAA"):
            return value
        cipher = get_fernet()
        encrypted = cipher.encrypt(value.encode("utf-8")).decode("utf-8")
        return encrypted
