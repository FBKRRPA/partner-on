from django.contrib.auth.base_user import BaseUserManager
from django.contrib.auth.models import AbstractUser
from django.db import models


class PartneronUserManager(BaseUserManager):
    def create_user(
        self, email: str, password: str | None = None, **extra_fields
    ) -> "User":
        if not email:
            raise ValueError("이메일은 필수입니다.")
        user = self.model(email=self.normalize_email(email), **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(
        self, email: str, password: str | None = None, **extra_fields
    ) -> "User":
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("role", User.Role.OWNER)
        if not extra_fields.get("is_staff") or not extra_fields.get("is_superuser"):
            raise ValueError("슈퍼유저는 is_staff 및 is_superuser가 필요합니다.")
        return self.create_user(email, password, **extra_fields)


class Workplace(models.Model):
    name = models.CharField(max_length=120, unique=True)
    address = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    # 2FA Policy Enforcements by Role (Default: Opt-in, configurable by OWNER)
    enforce_2fa_owner = models.BooleanField(default=False)
    enforce_2fa_manager = models.BooleanField(default=False)
    enforce_2fa_employee = models.BooleanField(default=False)

    class Meta:
        ordering = ["name"]

    def __str__(self) -> str:
        return self.name


class User(AbstractUser):
    class Role(models.TextChoices):
        OWNER = "OWNER", "대표"
        MANAGER = "MANAGER", "매니저"
        EMPLOYEE = "EMPLOYEE", "사원"

    username = None
    email = models.EmailField(unique=True)
    name = models.CharField(max_length=80)
    role = models.CharField(max_length=10, choices=Role.choices, default=Role.EMPLOYEE)
    workplace = models.ForeignKey(
        Workplace, on_delete=models.PROTECT, null=True, blank=True, related_name="users"
    )

    # 2FA Settings per user
    is_2fa_enabled = models.BooleanField(default=False)
    totp_secret = models.CharField(max_length=64, blank=True, null=True)
    otp_code = models.CharField(max_length=6, blank=True, null=True)
    otp_created_at = models.DateTimeField(blank=True, null=True)
    backup_codes = models.JSONField(default=list, blank=True)

    objects = PartneronUserManager()
    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["name"]

    def requires_2fa(self) -> bool:
        """Check if 2FA is required either by user setting or workplace role enforcement"""
        if self.is_2fa_enabled:
            return True
        if self.workplace:
            if self.role == self.Role.OWNER and self.workplace.enforce_2fa_owner:
                return True
            if self.role == self.Role.MANAGER and self.workplace.enforce_2fa_manager:
                return True
            if self.role == self.Role.EMPLOYEE and self.workplace.enforce_2fa_employee:
                return True
        return False


class Device(models.Model):
    class Status(models.TextChoices):
        PENDING = "PENDING", "승인 대기"
        APPROVED = "APPROVED", "승인됨"
        REJECTED = "REJECTED", "거절됨"

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="devices")
    device_uuid = models.CharField(max_length=100)
    device_name = models.CharField(max_length=150, default="Desktop Browser")
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.PENDING)
    requested_at = models.DateTimeField(auto_now_add=True)
    approved_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ("user", "device_uuid")
        ordering = ["-requested_at"]

    def __str__(self) -> str:
        return f"{self.user.email} - {self.device_name} ({self.status})"
