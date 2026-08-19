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
        HEADQUARTERS = "HEADQUARTERS", "본사 총괄 관리자"
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

    def is_headquarters(self) -> bool:
        """Check if user is Headquarter Master System Admin"""
        return self.role == self.Role.HEADQUARTERS or self.is_superuser

    def is_admin(self) -> bool:
        """Check if user has full admin access (본사, 대표, 사무직원)"""
        return self.role in [self.Role.HEADQUARTERS, self.Role.OWNER, self.Role.ADMIN_STAFF] or self.is_superuser

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


class PrinterAsset(models.Model):
    """
    Printer/Multifunction Printer Asset Model matched with Agent SNMP Ingestion
    """
    class Status(models.TextChoices):
        APPROVED = "APPROVED", "등록 승인"
        PENDING = "PENDING", "수집 대기"
        INACTIVE = "INACTIVE", "비활성"

    workplace = models.ForeignKey(Workplace, on_delete=models.CASCADE, related_name="printers")
    serial_no = models.CharField(max_length=120, unique=True, help_text="장비 고유 시리얼 번호")
    model_name = models.CharField(max_length=120, default="복합기 표준 모델")
    customer_name = models.CharField(max_length=120, default="자사 본사")
    location = models.CharField(max_length=150, blank=True, default="사무실")
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.APPROVED)

    # Counter Metrics
    count_color = models.IntegerField(default=0)
    count_mono = models.IntegerField(default=0)
    count_large_color = models.IntegerField(default=0)
    count_total = models.IntegerField(default=0)
    monthly_usage_color = models.IntegerField(default=0)
    monthly_usage_mono = models.IntegerField(default=0)

    # Toner & Drum Supplies (%)
    toner_c = models.IntegerField(default=100)
    toner_m = models.IntegerField(default=100)
    toner_y = models.IntegerField(default=100)
    toner_k = models.IntegerField(default=100)
    drum_k = models.IntegerField(default=100)

    created_at = models.DateTimeField(auto_now_add=True)
    last_scanned_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"[{self.serial_no}] {self.model_name} - {self.customer_name}"


class AgentCollector(models.Model):
    """
    Agent Collector Database Model for tracking installed Windows SNMP Agents
    """
    class Status(models.TextChoices):
        ONLINE = "ONLINE", "온라인 (수집중)"
        OFFLINE = "OFFLINE", "오프라인 (중단)"
        PENDING = "PENDING", "인증 대기"

    workplace = models.ForeignKey(Workplace, on_delete=models.CASCADE, related_name="collectors")
    customer = models.ForeignKey("MonitoringCustomer", on_delete=models.SET_NULL, null=True, blank=True, related_name="collectors", help_text="매칭된 사업장 하위 특정 고객사")
    auth_code = models.CharField(max_length=32, unique=True, help_text="8자리 수집기 인증 코드 (AST-XXXXXX)")
    agent_token = models.CharField(max_length=120, blank=True, null=True)
    name = models.CharField(max_length=150, default="현장 수집기 Agent")
    customer_name = models.CharField(max_length=120, default="자사 본사")
    ip_range = models.CharField(max_length=100, default="192.168.1.1/24")
    custom_ips = models.JSONField(default=list, blank=True, help_text="수동 지정 IP 목록")
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    detected_count = models.IntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)
    last_scanned_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"[{self.auth_code}] {self.name} ({self.status})"





class OidListMaster(models.Model):
    """
    oid_lists: 제조사 및 모델별 OID 세부 목록 마스터
    """
    manufacturer = models.CharField(max_length=256, blank=True, null=True, help_text="제조사")
    printer_model = models.CharField(max_length=256, blank=True, null=True, help_text="프린터 모델")
    serial_no = models.CharField(max_length=256, blank=True, null=True, help_text="시리얼번호 OID")
    count1 = models.CharField(max_length=256, blank=True, null=True, help_text="컬러 카운트 OID")
    count2 = models.CharField(max_length=256, blank=True, null=True, help_text="흑백 카운트 OID")
    count3 = models.CharField(max_length=256, blank=True, null=True, help_text="큰컬러 카운트 OID")
    count3_k = models.CharField(max_length=256, blank=True, null=True, help_text="큰흑백 카운트 OID")
    count4 = models.CharField(max_length=256, blank=True, null=True, help_text="전체 카운트 OID")
    toner_c = models.CharField(max_length=256, blank=True, null=True, help_text="시안 토너 OID")
    toner_m = models.CharField(max_length=256, blank=True, null=True, help_text="마젠타 토너 OID")
    toner_y = models.CharField(max_length=256, blank=True, null=True, help_text="옐로 토너 OID")
    toner_k = models.CharField(max_length=256, blank=True, null=True, help_text="블랙 토너 OID")
    toner_k2 = models.CharField(max_length=256, blank=True, null=True, help_text="블랙2 토너 OID")
    toner_c_max = models.CharField(max_length=256, blank=True, null=True, help_text="시안 토너 최대값 OID")
    toner_m_max = models.CharField(max_length=256, blank=True, null=True, help_text="마젠타 토너 최대값 OID")
    toner_y_max = models.CharField(max_length=256, blank=True, null=True, help_text="옐로 토너 최대값 OID")
    toner_k_max = models.CharField(max_length=256, blank=True, null=True, help_text="블랙 토너 최대값 OID")
    toner_k2_max = models.CharField(max_length=256, blank=True, null=True, help_text="블랙2 토너 최대값 OID")
    toner_recovery = models.CharField(max_length=256, blank=True, null=True, help_text="회수 토너 OID")
    toner_recovery_max = models.CharField(max_length=256, blank=True, null=True, help_text="회수 토너 최대값 OID")
    drum_c = models.CharField(max_length=256, blank=True, null=True, help_text="시안 드럼 OID")
    drum_m = models.CharField(max_length=256, blank=True, null=True, help_text="마젠타 드럼 OID")
    drum_y = models.CharField(max_length=256, blank=True, null=True, help_text="옐로 드럼 OID")
    drum_k = models.CharField(max_length=256, blank=True, null=True, help_text="블랙 드럼 OID")
    drum_c_max = models.CharField(max_length=256, blank=True, null=True, help_text="시안 드럼 최대값 OID")
    drum_m_max = models.CharField(max_length=256, blank=True, null=True, help_text="마젠타 드럼 최대값 OID")
    drum_y_max = models.CharField(max_length=256, blank=True, null=True, help_text="옐로 드럼 최대값 OID")
    drum_k_max = models.CharField(max_length=256, blank=True, null=True, help_text="블랙 드럼 최대값 OID")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    deleted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "oid_lists"

    def __str__(self) -> str:
        return f"[{self.manufacturer}] {self.printer_model}"


class TempOidListMaster(models.Model):
    """
    temp_oid_lists: 검색 에이전트가 탐지/추론한 1차 임시 OID 스테이징 레코드
    """
    class Status(models.TextChoices):
        PENDING = "PENDING", "검증 대기"
        CONFIRMED = "CONFIRMED", "마스터 이관 완료"
        REJECTED = "REJECTED", "거절됨"

    workplace = models.ForeignKey(Workplace, on_delete=models.CASCADE, related_name="temp_oid_lists", null=True, blank=True)
    manufacturer = models.CharField(max_length=256, blank=True, null=True, help_text="제조사")
    printer_model = models.CharField(max_length=256, blank=True, null=True, help_text="프린터 모델명")
    scanned_ip = models.CharField(max_length=256, blank=True, null=True, help_text="스캔된 IP")
    
    serial_no = models.CharField(max_length=256, blank=True, null=True, help_text="시리얼 OID 후보")
    count1 = models.CharField(max_length=256, blank=True, null=True, help_text="컬러 카운트 OID 후보")
    count2 = models.CharField(max_length=256, blank=True, null=True, help_text="흑백 카운트 OID 후보")
    count3 = models.CharField(max_length=256, blank=True, null=True, help_text="큰컬러 카운트 OID 후보")
    count3_k = models.CharField(max_length=256, blank=True, null=True, help_text="큰흑백 카운트 OID 후보")
    count4 = models.CharField(max_length=256, blank=True, null=True, help_text="전체 카운트 OID 후보")
    
    toner_c = models.CharField(max_length=256, blank=True, null=True, help_text="시안 토너 OID 후보")
    toner_m = models.CharField(max_length=256, blank=True, null=True, help_text="마젠타 토너 OID 후보")
    toner_y = models.CharField(max_length=256, blank=True, null=True, help_text="옐로 토너 OID 후보")
    toner_k = models.CharField(max_length=256, blank=True, null=True, help_text="블랙 토너 OID 후보")
    toner_recovery = models.CharField(max_length=256, blank=True, null=True, help_text="회수 토너 OID 후보")
    
    drum_c = models.CharField(max_length=256, blank=True, null=True, help_text="시안 드럼 OID 후보")
    drum_m = models.CharField(max_length=256, blank=True, null=True, help_text="마젠타 드럼 OID 후보")
    drum_y = models.CharField(max_length=256, blank=True, null=True, help_text="옐로 드럼 OID 후보")
    drum_k = models.CharField(max_length=256, blank=True, null=True, help_text="블랙 드럼 OID 후보")

    raw_walk_dump = models.JSONField(default=dict, blank=True, help_text="Raw MIB Tree Dump JSON")
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "temp_oid_lists"
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"TempOID([{self.scanned_ip}] {self.manufacturer} {self.printer_model} - {self.status})"





class MonitoringCustomer(models.Model):
    """
    monitoring_customers: 사업장별 모니터링 대상 고객사
    """
    workplace = models.ForeignKey(Workplace, on_delete=models.CASCADE, related_name="monitoring_customers")
    customer_id = models.BigIntegerField(null=True, blank=True, help_text="고객사 FK")
    name = models.CharField(max_length=120, default="고객사", help_text="고객사명")
    employee_count = models.IntegerField(default=0, help_text="종업원 수")
    pc = models.IntegerField(default=0, help_text="PC 대수")
    mfp = models.IntegerField(default=0, help_text="복합기 대수")
    printer = models.IntegerField(default=0, help_text="프린터 대수")
    other_info = models.TextField(blank=True, null=True, help_text="기타 정보")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    deleted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "monitoring_customers"
        unique_together = ("workplace", "customer_id")

    def __str__(self) -> str:
        return f"MonitoringCustomer(Workplace: {self.workplace_id}, Customer: {self.customer_id})"


class MonitoringPrinter(models.Model):
    """
    monitoring_printers: 모니터링 복합기/프린터 장비
    """
    workplace = models.ForeignKey(Workplace, on_delete=models.CASCADE, related_name="monitoring_printers")
    license = models.CharField(max_length=256, blank=True, null=True, help_text="라이센스")
    printer_model = models.CharField(max_length=256, blank=True, null=True, help_text="프린터 모델명")
    scanned_model = models.CharField(max_length=256, blank=True, null=True, help_text="스캔된 모델명")
    device_type = models.CharField(max_length=256, blank=True, null=True, help_text="장치 유형")
    contract_type = models.IntegerField(null=True, blank=True, help_text="계약 유형")
    sl = models.CharField(max_length=256, blank=True, null=True, help_text="SL")
    serial_no = models.CharField(max_length=256, help_text="시리얼번호")
    customer_id = models.BigIntegerField(null=True, blank=True, help_text="고객사 FK")
    ip = models.CharField(max_length=256, blank=True, null=True, help_text="IP 주소")
    location = models.CharField(max_length=256, blank=True, null=True, help_text="설치 위치")
    state = models.CharField(max_length=256, default="active", help_text="상태 (active/inactive/excluded)")
    note = models.CharField(max_length=256, blank=True, null=True, help_text="비고")
    installed_time = models.CharField(max_length=256, blank=True, null=True, help_text="설치일")
    contract_start_date = models.CharField(max_length=256, blank=True, null=True, help_text="계약 시작일")
    contract_end_date = models.CharField(max_length=256, blank=True, null=True, help_text="계약 종료일")
    operation_company_id = models.BigIntegerField(null=True, blank=True, help_text="관리사업자 FK")
    custom_equipment_model_id = models.BigIntegerField(null=True, blank=True, help_text="사용자정의 모델 FK")
    asset_number = models.BigIntegerField(null=True, blank=True, help_text="자산번호")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    deleted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "monitoring_printers"
        unique_together = ("workplace", "serial_no")

    def __str__(self) -> str:
        return f"[{self.serial_no}] {self.printer_model} ({self.ip})"


class MonitoringData(models.Model):
    """
    monitoring_data: 실시간 최신 관제 카운터 및 소모품 데이터
    """
    workplace = models.ForeignKey(Workplace, on_delete=models.CASCADE, related_name="monitoring_data")
    serial_no = models.CharField(max_length=256, help_text="시리얼번호")
    monitoring_printer = models.OneToOneField(MonitoringPrinter, on_delete=models.CASCADE, related_name="realtime_data")
    count1 = models.IntegerField(default=0, help_text="컬러 카운트")
    count2 = models.IntegerField(default=0, help_text="흑백 카운트")
    count3 = models.IntegerField(default=0, help_text="큰컬러 카운트")
    count3_k = models.IntegerField(default=0, help_text="큰흑백 카운트")
    count4 = models.IntegerField(default=0, help_text="전체 카운트")

    toner_c = models.IntegerField(default=100, help_text="시안 토너 잔량")
    toner_m = models.IntegerField(default=100, help_text="마젠타 토너 잔량")
    toner_y = models.IntegerField(default=100, help_text="옐로 토너 잔량")
    toner_k = models.IntegerField(default=100, help_text="블랙 토너 잔량")
    toner_k2 = models.IntegerField(default=100, help_text="블랙2 토너 잔량")
    toner_recovery = models.IntegerField(default=100, help_text="회수 토너 잔량")

    drum_c = models.IntegerField(default=100, help_text="시안 드럼 잔량")
    drum_m = models.IntegerField(default=100, help_text="마젠타 드럼 잔량")
    drum_y = models.IntegerField(default=100, help_text="옐로 드럼 잔량")
    drum_k = models.IntegerField(default=100, help_text="블랙 드럼 잔량")

    toner_c_max = models.IntegerField(default=100)
    toner_m_max = models.IntegerField(default=100)
    toner_y_max = models.IntegerField(default=100)
    toner_k_max = models.IntegerField(default=100)
    toner_k2_max = models.IntegerField(default=100)
    toner_recovery_max = models.IntegerField(default=100)

    drum_c_max = models.IntegerField(default=100)
    drum_m_max = models.IntegerField(default=100)
    drum_y_max = models.IntegerField(default=100)
    drum_k_max = models.IntegerField(default=100)

    manufacturer = models.CharField(max_length=256, blank=True, null=True, help_text="제조사")
    source = models.CharField(max_length=256, default="agent", help_text="수집 출처")
    email_updated_at = models.DateTimeField(null=True, blank=True)
    agent_updated_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    deleted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "monitoring_data"
        unique_together = ("workplace", "serial_no")

    def __str__(self) -> str:
        return f"MonitoringData([{self.serial_no}] Total: {self.count4})"


class MonitoringDataRecord(models.Model):
    """
    monitoring_data_records: 모니터링 데이터 일별/월별 이력 레코드
    """
    workplace = models.ForeignKey(Workplace, on_delete=models.CASCADE, related_name="monitoring_records")
    serial_no = models.CharField(max_length=256, help_text="시리얼번호")
    monitoring_printer = models.ForeignKey(MonitoringPrinter, on_delete=models.CASCADE, related_name="data_records")
    count1 = models.IntegerField(default=0)
    count2 = models.IntegerField(default=0)
    count3 = models.IntegerField(default=0)
    count3_k = models.IntegerField(default=0)
    count4 = models.IntegerField(default=0)

    toner_c = models.IntegerField(default=100)
    toner_m = models.IntegerField(default=100)
    toner_y = models.IntegerField(default=100)
    toner_k = models.IntegerField(default=100)
    toner_k2 = models.IntegerField(default=100)
    toner_recovery = models.IntegerField(default=100)

    drum_c = models.IntegerField(default=100)
    drum_m = models.IntegerField(default=100)
    drum_y = models.IntegerField(default=100)
    drum_k = models.IntegerField(default=100)

    toner_c_max = models.IntegerField(default=100)
    toner_m_max = models.IntegerField(default=100)
    toner_y_max = models.IntegerField(default=100)
    toner_k_max = models.IntegerField(default=100)
    toner_k2_max = models.IntegerField(default=100)
    toner_recovery_max = models.IntegerField(default=100)

    drum_c_max = models.IntegerField(default=100)
    drum_m_max = models.IntegerField(default=100)
    drum_y_max = models.IntegerField(default=100)
    drum_k_max = models.IntegerField(default=100)

    manufacturer = models.CharField(max_length=256, blank=True, null=True)
    source = models.CharField(max_length=256, default="agent")
    email_updated_at = models.DateTimeField(null=True, blank=True)
    agent_updated_at = models.DateTimeField(null=True, blank=True)
    yyyymmdd = models.CharField(max_length=256, help_text="기준일자 (YYYYMMDD)")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    deleted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "monitoring_data_records"
        unique_together = ("monitoring_printer", "yyyymmdd")

    def __str__(self) -> str:
        return f"Record([{self.serial_no}] {self.yyyymmdd})"


class SuppliesAlert(models.Model):
    """
    supplies: 소모품 잔량 알림 및 상태
    """
    workplace = models.ForeignKey(Workplace, on_delete=models.CASCADE, related_name="supplies_alerts")
    serial_no = models.CharField(max_length=256, help_text="시리얼번호")

    toner_c = models.IntegerField(default=100)
    toner_m = models.IntegerField(default=100)
    toner_y = models.IntegerField(default=100)
    toner_k = models.IntegerField(default=100)
    toner_k2 = models.IntegerField(default=100)
    toner_recovery = models.IntegerField(default=100)

    drum_c = models.IntegerField(default=100)
    drum_m = models.IntegerField(default=100)
    drum_y = models.IntegerField(default=100)
    drum_k = models.IntegerField(default=100)

    toner_c_max = models.IntegerField(default=100)
    toner_m_max = models.IntegerField(default=100)
    toner_y_max = models.IntegerField(default=100)
    toner_k_max = models.IntegerField(default=100)
    toner_k2_max = models.IntegerField(default=100)
    toner_recovery_max = models.IntegerField(default=100)

    drum_c_max = models.IntegerField(default=100)
    drum_m_max = models.IntegerField(default=100)
    drum_y_max = models.IntegerField(default=100)
    drum_k_max = models.IntegerField(default=100)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    deleted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "supplies"
        unique_together = ("workplace", "serial_no")

    def __str__(self) -> str:
        return f"SuppliesAlert([{self.serial_no}])"





class UnregisteredPrinter(models.Model):
    """
    unregistered_printers: 미등록 탐지 프린터
    """
    workplace = models.ForeignKey(Workplace, on_delete=models.CASCADE, related_name="unregistered_printers")
    serial_no = models.CharField(max_length=256, help_text="시리얼번호")
    confirmed_serial_no = models.CharField(max_length=256, blank=True, null=True, help_text="확인된 시리얼번호")
    scanned_model = models.CharField(max_length=256, blank=True, null=True, help_text="스캔된 모델명")
    vendor_name = models.CharField(max_length=120, blank=True, null=True, help_text="제조사명 (Fujifilm/Canon/HP 등)")
    mac_address = models.CharField(max_length=64, blank=True, null=True, help_text="MAC 주소")
    printer_id = models.BigIntegerField(null=True, blank=True, help_text="프린터 모델 FK")
    customer_id = models.BigIntegerField(null=True, blank=True, help_text="고객사 FK")
    ip = models.CharField(max_length=256, blank=True, null=True, help_text="IP 주소")
    location = models.CharField(max_length=256, blank=True, null=True, help_text="위치")
    registered = models.BooleanField(default=False, help_text="등록 완료 여부")

    # Scanned Counter & Supplies Data
    count_total = models.IntegerField(default=0, help_text="탐지된 총 카운터")
    count_color = models.IntegerField(default=0, help_text="탐지된 컬러 카운터")
    count_mono = models.IntegerField(default=0, help_text="탐지된 흑백 카운터")
    toner_k = models.IntegerField(default=0, help_text="K 토너 잔량 (%)")
    toner_c = models.IntegerField(default=0, help_text="C 토너 잔량 (%)")
    toner_m = models.IntegerField(default=0, help_text="M 토너 잔량 (%)")
    toner_y = models.IntegerField(default=0, help_text="Y 토너 잔량 (%)")
    last_scanned_at = models.DateTimeField(null=True, blank=True, help_text="최근 탐지 시각")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    deleted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "unregistered_printers"
        unique_together = ("workplace", "ip")

    def __str__(self) -> str:
        return f"UnregisteredPrinter([{self.serial_no}] {self.scanned_model})"


class AIChatLog(models.Model):
    """
    AIChatLog: 유저별 AI 페어 프로그래밍 대화 및 기술 의사결정 로그 기록 모델 (HR 담당)
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="ai_chat_logs")
    prompt_intent = models.CharField(max_length=255, help_text="프롬프트 의도 요약")
    ai_response = models.TextField(help_text="AI 응답 요약 내용")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "ai_chat_logs"
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"AIChatLog({self.user.email} - {self.prompt_intent[:20]})"


class DeviceMaintenanceRecord(models.Model):
    """
    DeviceMaintenanceRecord: 복합기 장비 정기점검 및 CE 정비 이력 모델 (Dev B 담당)
    """
    printer = models.ForeignKey(PrinterAsset, on_delete=models.CASCADE, related_name="maintenance_records")
    technician_name = models.CharField(max_length=100, help_text="정비 담당 CE 성함")
    inspection_notes = models.TextField(help_text="점검 내용 및 교체 부품 코멘트")
    inspected_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "device_maintenance_records"
        ordering = ["-inspected_at"]

    def __str__(self) -> str:
        return f"Maintenance({self.printer.serial_no} - {self.technician_name})"





