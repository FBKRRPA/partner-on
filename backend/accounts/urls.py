from django.urls import path
from .views import (
    AgentAuthView,
    AgentFetchOidsView,
    AgentIngestBatchView,
    AgentStatusUpdateView,
    CollectorCodeGenerateView,
    CollectorListView,
    DeviceActionView,
    DeviceDetailView,
    DeviceListApprovalView,
    LoginView,
    MemberDetailView,
    MemberInviteView,
    MemberListCreateView,
    MemberReinviteView,
    MemberBackupCodesView,
    MonitoringSuppliesView,
    MonitoringUsageView,
    PasswordResetConfirmView,
    PasswordResetRequestView,
    PrinterAssetListCreateView,
    RoleMenuPermissionView,
    SetupTOTPView,
    SignUpView,
    SignUpWithInviteView,
    Toggle2FAView,
    UserProfileView,
    Verify2FAView,
    Workplace2FAPolicyView,
)

urlpatterns = [
    path("auth/login/", LoginView.as_view(), name="login"),
    path("auth/signup/", SignUpView.as_view(), name="signup"),
    path("auth/signup-with-invite/", SignUpWithInviteView.as_view(), name="signup-with-invite"),
    path("auth/password-reset/request/", PasswordResetRequestView.as_view(), name="password-reset-request"),
    path("auth/password-reset/confirm/", PasswordResetConfirmView.as_view(), name="password-reset-confirm"),
    path("auth/profile/", UserProfileView.as_view(), name="profile"),
    path("auth/verify-2fa/", Verify2FAView.as_view(), name="verify-2fa"),
    path("auth/2fa/setup-totp/", SetupTOTPView.as_view(), name="setup-totp"),
    path("auth/2fa/toggle/", Toggle2FAView.as_view(), name="toggle-2fa"),
    path("workplace/members/", MemberListCreateView.as_view(), name="member-list-create"),
    path("workplace/members/invite/", MemberInviteView.as_view(), name="member-invite"),
    path("workplace/members/<int:pk>/reinvite/", MemberReinviteView.as_view(), name="member-reinvite"),
    path("workplace/members/<int:pk>/backup-codes/", MemberBackupCodesView.as_view(), name="member-backup-codes"),
    path("workplace/members/<int:pk>/", MemberDetailView.as_view(), name="member-detail"),
    
    # Workplace Printer Assets (Devices)
    path("workplace/printers/", PrinterAssetListCreateView.as_view(), name="printer-asset-list-create"),

    path("workplace/devices/", DeviceListApprovalView.as_view(), name="device-list"),
    path("workplace/devices/<int:pk>/", DeviceDetailView.as_view(), name="device-detail"),
    path("workplace/devices/<int:pk>/<str:action>/", DeviceActionView.as_view(), name="device-action"),
    path("workplace/2fa-policy/", Workplace2FAPolicyView.as_view(), name="2fa-policy"),
    path("workplace/permissions/", RoleMenuPermissionView.as_view(), name="menu-permissions"),
    
    # Workplace Agent/Collector Management APIs
    path("workplace/collectors/", CollectorListView.as_view(), name="collector-list"),
    path("workplace/collectors/generate-code/", CollectorCodeGenerateView.as_view(), name="collector-generate-code"),

    # Monitoring APIs
    path("monitoring/usage/", MonitoringUsageView.as_view(), name="monitoring-usage"),
    path("monitoring/supplies/", MonitoringSuppliesView.as_view(), name="monitoring-supplies"),

    # Agent REST APIs
    path("agent/authenticate/", AgentAuthView.as_view(), name="agent-authenticate"),
    path("agent/status/", AgentStatusUpdateView.as_view(), name="agent-status"),
    path("agent/oids/", AgentFetchOidsView.as_view(), name="agent-oids"),
    path("agent/ingest/", AgentIngestBatchView.as_view(), name="agent-ingest"),
]
