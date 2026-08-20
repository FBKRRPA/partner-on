from django.urls import path
from .views import (
    AgentAuthView,
    AgentFetchOidsView,
    AgentIngestBatchView,
    AgentStatusUpdateView,
    AgentTargetAssetsView,
    CollectorCodeGenerateView,
    CollectorCustomerLookupView,
    CollectorListView,
    CRMCustomerListCreateView,
    CRMContractConversionView,
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
    PrinterAssetDetailView,
    RoleMenuPermissionView,
    SetupTOTPView,
    SignUpView,
    SignUpWithInviteView,
    TempOidListInspectionView,
    TempOidListActionView,
    UnregisteredPrinterView,
    UnregisteredPrinterRegisterView,
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
    
    # CRM Customer Master Ledger APIs
    path("crm/customers/", CRMCustomerListCreateView.as_view(), name="crm-customer-list-create"),
    path("crm/customers/convert-to-contract/", CRMContractConversionView.as_view(), name="crm-customer-convert-to-contract"),
    
    # Workplace Printer Assets (Devices)
    path("workplace/printers/", PrinterAssetListCreateView.as_view(), name="printer-asset-list-create"),
    path("workplace/printers/<int:pk>/", PrinterAssetDetailView.as_view(), name="printer-asset-detail"),

    path("workplace/devices/", DeviceListApprovalView.as_view(), name="device-list"),
    path("workplace/devices/<int:pk>/", DeviceDetailView.as_view(), name="device-detail"),
    path("workplace/devices/<int:pk>/<str:action>/", DeviceActionView.as_view(), name="device-action"),
    path("workplace/2fa-policy/", Workplace2FAPolicyView.as_view(), name="2fa-policy"),
    path("workplace/permissions/", RoleMenuPermissionView.as_view(), name="menu-permissions"),
    
    # Workplace Agent/Collector Management APIs
    path("workplace/collectors/", CollectorListView.as_view(), name="collector-list"),
    path("workplace/collectors/generate-code/", CollectorCodeGenerateView.as_view(), name="collector-generate-code"),
    path("workplace/collectors/by-customer/", CollectorCustomerLookupView.as_view(), name="collector-by-customer"),
    path("workplace/oid-inspection/", TempOidListInspectionView.as_view(), name="oid-inspection-list"),
    path("workplace/oid-inspection/<int:pk>/<str:action>/", TempOidListActionView.as_view(), name="oid-inspection-action"),

    path("workplace/unregistered-printers/", UnregisteredPrinterView.as_view(), name="unregistered-printer-list"),
    path("workplace/unregistered-printers/<int:pk>/register/", UnregisteredPrinterRegisterView.as_view(), name="unregistered-printer-register"),

    # Monitoring APIs
    path("monitoring/usage/", MonitoringUsageView.as_view(), name="monitoring-usage"),
    path("monitoring/supplies/", MonitoringSuppliesView.as_view(), name="monitoring-supplies"),

    # Agent REST APIs
    path("agent/authenticate/", AgentAuthView.as_view(), name="agent-authenticate"),
    path("agent/status/", AgentStatusUpdateView.as_view(), name="agent-status"),
    path("agent/oids/", AgentFetchOidsView.as_view(), name="agent-oids"),
    path("agent/target-assets/", AgentTargetAssetsView.as_view(), name="agent-target-assets"),
    path("agent/ingest/", AgentIngestBatchView.as_view(), name="agent-ingest"),
]
