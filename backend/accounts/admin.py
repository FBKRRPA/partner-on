from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, Workplace, Device, RoleMenuPermission

@admin.register(Workplace)
class WorkplaceAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "address", "enforce_2fa_owner", "enforce_2fa_admin_staff", "enforce_2fa_sales", "enforce_2fa_ce")
    search_fields = ("name", "address")

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ("id", "email", "name", "role", "workplace", "is_2fa_enabled", "is_staff", "is_superuser")
    list_filter = ("role", "is_2fa_enabled", "is_staff", "is_superuser")
    fieldsets = (
        (None, {"fields": ("email", "password")}),
        ("개인정보", {"fields": ("name", "role", "workplace")}),
        ("보안 (2FA)", {"fields": ("is_2fa_enabled", "totp_secret", "otp_code", "backup_codes")}),
        ("권한", {"fields": ("is_active", "is_staff", "is_superuser", "groups", "user_permissions")}),
    )
    add_fieldsets = (
        (None, {
            "classes": ("wide",),
            "fields": ("email", "name", "role"),
        }),
    )
    search_fields = ("email", "name")
    ordering = ("email",)
    filter_horizontal = ("groups", "user_permissions")

@admin.register(Device)
class DeviceAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "device_name", "device_uuid", "ip_address", "status", "requested_at")
    list_filter = ("status",)
    search_fields = ("device_name", "device_uuid", "user__email", "user__name")

@admin.register(RoleMenuPermission)
class RoleMenuPermissionAdmin(admin.ModelAdmin):
    list_display = ("id", "workplace", "role", "menu_key", "is_allowed", "updated_at")
    list_filter = ("role", "is_allowed", "workplace")
    search_fields = ("menu_key", "workplace__name")
