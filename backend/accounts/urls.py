from django.urls import path
from .views import (
    DeviceActionView,
    DeviceListApprovalView,
    LoginView,
    MemberDetailView,
    MemberListCreateView,
    RoleMenuPermissionView,
    SetupTOTPView,
    SignUpView,
    Toggle2FAView,
    UserProfileView,
    Verify2FAView,
    Workplace2FAPolicyView,
)

urlpatterns = [
    path("auth/login/", LoginView.as_view(), name="login"),
    path("auth/signup/", SignUpView.as_view(), name="signup"),
    path("auth/profile/", UserProfileView.as_view(), name="profile"),
    path("auth/verify-2fa/", Verify2FAView.as_view(), name="verify-2fa"),
    path("auth/2fa/setup-totp/", SetupTOTPView.as_view(), name="setup-totp"),
    path("auth/2fa/toggle/", Toggle2FAView.as_view(), name="toggle-2fa"),
    path("workplace/members/", MemberListCreateView.as_view(), name="member-list-create"),
    path("workplace/members/<int:pk>/", MemberDetailView.as_view(), name="member-detail"),
    path("workplace/devices/", DeviceListApprovalView.as_view(), name="device-list"),
    path("workplace/devices/<int:pk>/<str:action>/", DeviceActionView.as_view(), name="device-action"),
    path("workplace/2fa-policy/", Workplace2FAPolicyView.as_view(), name="2fa-policy"),
    path("workplace/permissions/", RoleMenuPermissionView.as_view(), name="menu-permissions"),
]
