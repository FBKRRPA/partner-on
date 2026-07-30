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

    # 2FA Policy Enforcements by 4 Roles
    enforce_2fa_owner = models.BooleanField(default=False)
    enforce_2fa_admin_staff = models.BooleanField(default=False)
    enforce_2fa_sales = models.BooleanField(default=False)
    enforce_2fa_ce = models.BooleanField(default=False)

    # Backward Compatibility
    enforce_2fa_manager = models.BooleanField(default=False)
    enforce_2fa_employee = models.BooleanField(default=False)

    class Meta:
        ordering = ["name"]

    def __str__(self) -> str:
        return self.name


class User(AbstractUser):
    class Role(models.TextChoices):
        OWNER = "OWNER", "관리자(대표)"
        ADMIN_STAFF = "ADMIN_STAFF", "관리자(사무직원)"
        SALES = "SALES", "영업"
        CE = "CE", "CE"

    username = None
    email = models.EmailField(unique=True)
    name = models.CharField(max_length=80)
    role = models.CharField(max_length=15, choices=Role.choices, default=Role.CE)
    workplace = models.ForeignKey(
        Workplace, on_delete=models.PROTECT, null=True, blank=True, related_name="users"
    )

    # 2FA Settings per user
    is_2fa_enabled = models.BooleanField(default=False)
    totp_secret = models.CharField(max_length=64, blank=True, null=True)
    otp_code = models.CharField(max_length=6, blank=True, null=True)
    otp_created_at = models.DateTimeField(blank=True, null=True)
    backup_codes = models.JSONField(default=list, blank=True)

    # Invitation Flow fields
    invite_code = models.CharField(max_length=32, blank=True, null=True, unique=True)
    invite_created_at = models.DateTimeField(blank=True, null=True)
    is_invite_accepted = models.BooleanField(default=True)

    objects = PartneronUserManager()
    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["name"]

    def is_admin(self) -> bool:
        """Check if user has full admin access (관리자 대표 or 관리자 사무직원)"""
        return self.role in [self.Role.OWNER, self.Role.ADMIN_STAFF] or self.is_superuser

    def requires_2fa(self) -> bool:
        """Check if 2FA is required either by user setting or workplace role enforcement"""
        if self.is_2fa_enabled:
            return True
        if self.workplace:
            if self.role == self.Role.OWNER and self.workplace.enforce_2fa_owner:
                return True
            if self.role == self.Role.ADMIN_STAFF and self.workplace.enforce_2fa_admin_staff:
                return True
            if self.role == self.Role.SALES and self.workplace.enforce_2fa_sales:
                return True
            if self.role == self.Role.CE and self.workplace.enforce_2fa_ce:
                return True
            # Legacy checks
            if self.workplace.enforce_2fa_manager or self.workplace.enforce_2fa_employee:
                if self.role not in [self.Role.OWNER, self.Role.ADMIN_STAFF]:
                    return True
        return False


class RoleMenuPermission(models.Model):
    workplace = models.ForeignKey(Workplace, on_delete=models.CASCADE, related_name="menu_permissions")
    role = models.CharField(max_length=15, choices=User.Role.choices)
    menu_key = models.CharField(max_length=100)
    is_allowed = models.BooleanField(default=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("workplace", "role", "menu_key")

    def __str__(self) -> str:
        return f"[{self.workplace.name}] {self.role} -> {self.menu_key}: {self.is_allowed}"


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
