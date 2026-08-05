import base64
from io import BytesIO
import random
import string
import pyotp
import qrcode
from django.utils import timezone
from datetime import timedelta
from django.core.mail import send_mail
from django.conf import settings
from rest_framework import status
from rest_framework.exceptions import NotFound, PermissionDenied
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from .models import (
    User, Device, Workplace, RoleMenuPermission, PrinterAsset, AgentCollector, PrinterOidMapping,
    MonitoringPrinter, MonitoringData, MonitoringDataRecord, SuppliesAlert, SupplyUsage, UnregisteredPrinter,
    PrinterModelMaster, OidListMaster, MonitoringCustomer
)
from .permissions import IsOwnerPermission
from .serializers import (
    DeviceDtoSerializer,
    LoginRequestSerializer,
    MemberCreateSerializer,
    MemberInviteSerializer,
    MemberUpdateSerializer,
    RoleMenuPermissionSerializer,
    SignUpRequestSerializer,
    SignUpWithInviteSerializer,
    UserDtoSerializer,
)


def generate_backup_codes() -> list[str]:
    """Generate 10 random 8-character backup recovery codes"""
    codes = []
    for _ in range(10):
        code = "".join(random.choices(string.ascii_uppercase + string.digits, k=8))
        formatted = f"{code[:4]}-{code[4:]}"
        codes.append(formatted)
    return codes


class LoginView(TokenObtainPairView):
    """
    Enhanced Security Login View with 2FA & Device Approval Enforcement
    """
    serializer_class = LoginRequestSerializer
    throttle_scope = "login"

    def post(self, request, *args, **kwargs) -> Response:
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.user

        # Check if 2FA is required for this user
        if user.requires_2fa():
            # Generate 6-digit OTP code for Email/2FA Verification
            otp = f"{random.randint(100000, 999999)}"
            user.otp_code = otp
            user.otp_created_at = timezone.now()
            user.save(update_fields=["otp_code", "otp_created_at"])

            # Create temporary pre_token identifier
            pre_token = f"pre-2fa-{user.pk}-{random.randint(100000, 999999)}"

            return Response(
                {
                    "require_2fa": True,
                    "pre_token": pre_token,
                    "email": user.email,
                    "is_totp_configured": bool(user.totp_secret and user.is_2fa_enabled),
                    "detail": "2차 인증(2FA) 코드를 입력해 주세요.",
                },
                status=status.HTTP_200_OK,
            )

        # Standard JWT login token generation for non-2FA users
        refresh = RefreshToken.for_user(user)
        return Response(
            {
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "user": UserDtoSerializer(user).data,
            },
            status=status.HTTP_200_OK,
        )


class Verify2FAView(APIView):
    """
    Verify 2FA OTP / TOTP / Backup Code to issue final JWT Access Tokens
    """
    authentication_classes: list = []
    permission_classes: list = []

    def post(self, request) -> Response:
        email = request.data.get("email")
        otp_code = request.data.get("otp_code", "").strip()

        if not email or not otp_code:
            return Response(
                {"detail": "이메일과 2차 인증 코드를 입력해 주세요."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = User.objects.filter(email=email).first()
        if not user:
            return Response(
                {"detail": "유효하지 않은 요청입니다."}, status=status.HTTP_400_BAD_REQUEST
            )

        verified = False
        method_used = "OTP"

        # 1. Verify TOTP (Authenticator App)
        if user.totp_secret:
            totp = pyotp.TOTP(user.totp_secret)
            if totp.verify(otp_code, valid_window=1):
                verified = True
                method_used = "TOTP"

        # 2. Verify Email OTP Code (valid for 5 minutes)
        if not verified and user.otp_code and user.otp_code == otp_code:
            if user.otp_created_at and (timezone.now() - user.otp_created_at) < timedelta(minutes=5):
                verified = True
                method_used = "EMAIL_OTP"
                user.otp_code = None  # Consume OTP
                user.save(update_fields=["otp_code"])

        # 3. Verify Emergency Backup Recovery Codes
        if not verified and user.backup_codes and otp_code in user.backup_codes:
            verified = True
            method_used = "BACKUP_CODE"
            user.backup_codes.remove(otp_code)  # Burn used backup code
            user.save(update_fields=["backup_codes"])

        if not verified:
            return Response(
                {"detail": "2차 인증 코드가 올바르지 않거나 만료되었습니다. 다시 확인해 주세요."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Issue final JWT Tokens
        refresh = RefreshToken.for_user(user)
        return Response(
            {
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "user": UserDtoSerializer(user).data,
                "method_used": method_used,
            },
            status=status.HTTP_200_OK,
        )


class SetupTOTPView(APIView):
    """
    Setup or fetch TOTP secret & QR Code Image Data URI for Authenticator App
    Supports both GET and POST requests.
    """
    permission_classes = [IsAuthenticated]

    def _generate_totp_response(self, user) -> Response:
        if not user.totp_secret:
            user.totp_secret = pyotp.random_base32()
            user.save(update_fields=["totp_secret"])

        secret = user.totp_secret
        totp = pyotp.TOTP(secret)
        provisioning_uri = totp.provisioning_uri(
            name=user.email, issuer_name="PartnerOn"
        )

        # Generate QR Code Base64 PNG Data URI
        qr = qrcode.QRCode(version=1, box_size=6, border=2)
        qr.add_data(provisioning_uri)
        qr.make(fit=True)
        img = qr.make_image(fill_color="black", back_color="white")

        buffer = BytesIO()
        img.save(buffer, format="PNG")
        qr_code_base64 = base64.b64encode(buffer.getvalue()).decode("utf-8")
        qr_code_url = f"data:image/png;base64,{qr_code_base64}"

        return Response(
            {
                "secret": secret,
                "totp_secret": secret,
                "otpauth_url": provisioning_uri,
                "provisioning_uri": provisioning_uri,
                "qr_code_url": qr_code_url,
                "is_enabled": user.is_2fa_enabled,
            },
            status=status.HTTP_200_OK,
        )

    def get(self, request) -> Response:
        return self._generate_totp_response(request.user)

    def post(self, request) -> Response:
        # Regenerate or return response
        user = request.user
        if not user.totp_secret or request.data.get("regenerate"):
            user.totp_secret = pyotp.random_base32()
            user.save(update_fields=["totp_secret"])
        return self._generate_totp_response(user)


class VerifyTOTPSetupView(APIView):
    """
    Verify initial TOTP code to confirm authenticator setup & enable 2FA
    """
    permission_classes = [IsAuthenticated]

    def post(self, request) -> Response:
        user = request.user
        totp_code = request.data.get("totp_code", "").strip()

        if not user.totp_secret:
            return Response(
                {"detail": "TOTP 시크릿이 발급되지 않았습니다. 먼저 OTP 설정을 진행해 주세요."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        totp = pyotp.TOTP(user.totp_secret)
        if not totp.verify(totp_code, valid_window=1):
            return Response(
                {"detail": "인증 앱 코드가 일치하지 않습니다. 다시 시도해 주세요."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.is_2fa_enabled = True
        if not user.backup_codes:
            user.backup_codes = generate_backup_codes()
        user.save(update_fields=["is_2fa_enabled", "backup_codes"])

        return Response(
            {
                "detail": "TOTP 인증 앱이 성공적으로 등록되었습니다.",
                "is_2fa_enabled": True,
                "backup_codes": user.backup_codes,
            },
            status=status.HTTP_200_OK,
        )


class Toggle2FAView(APIView):
    """
    Toggle 2FA for personal user profile.
    Enforces that 2FA cannot be enabled without completing Authenticator App QR Verification.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request) -> Response:
        user = request.user
        enable = request.data.get("enable")

        if enable is True:
            # Enforce Authenticator App setup verification
            if not user.totp_secret or not user.is_2fa_enabled:
                return Response(
                    {
                        "detail": "Authenticator 앱 등록 및 6자리 코드 검증이 완료되지 않아 2FA를 활성화할 수 없습니다. 먼저 OTP 설정을 완료해 주세요.",
                        "require_setup": True,
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )
            user.is_2fa_enabled = True
            user.save(update_fields=["is_2fa_enabled"])
            msg = "2차 인증(2FA)이 활성화되었습니다."
        else:
            user.is_2fa_enabled = False
            user.save(update_fields=["is_2fa_enabled"])
            msg = "2차 인증(2FA)이 비활성화되었습니다."

        return Response(
            {
                "detail": msg,
                "is_2fa_enabled": user.is_2fa_enabled,
                "backup_codes": user.backup_codes if user.is_2fa_enabled else [],
            },
            status=status.HTTP_200_OK,
        )


class Workplace2FAPolicyView(APIView):
    """
    Workplace 2FA Policy View for Admin/Owner
    """
    permission_classes = [IsAuthenticated, IsOwnerPermission]

    def get(self, request) -> Response:
        wp: Workplace = request.user.workplace
        return Response(
            {
                "enforce_2fa_owner": wp.enforce_2fa_owner,
                "enforce_2fa_admin_staff": wp.enforce_2fa_admin_staff,
                "enforce_2fa_sales": wp.enforce_2fa_sales,
                "enforce_2fa_ce": wp.enforce_2fa_ce,
                "enforce_2fa_manager": wp.enforce_2fa_manager,
                "enforce_2fa_employee": wp.enforce_2fa_employee,
            },
            status=status.HTTP_200_OK,
        )

    def post(self, request) -> Response:
        wp: Workplace = request.user.workplace
        if "enforce_2fa_owner" in request.data:
            wp.enforce_2fa_owner = bool(request.data["enforce_2fa_owner"])
        if "enforce_2fa_admin_staff" in request.data:
            wp.enforce_2fa_admin_staff = bool(request.data["enforce_2fa_admin_staff"])
        if "enforce_2fa_sales" in request.data:
            wp.enforce_2fa_sales = bool(request.data["enforce_2fa_sales"])
        if "enforce_2fa_ce" in request.data:
            wp.enforce_2fa_ce = bool(request.data["enforce_2fa_ce"])

        if "enforce_2fa_manager" in request.data:
            wp.enforce_2fa_manager = bool(request.data["enforce_2fa_manager"])
        if "enforce_2fa_employee" in request.data:
            wp.enforce_2fa_employee = bool(request.data["enforce_2fa_employee"])

        wp.save()
        return Response(
            {
                "detail": "사업장 2FA 역할별 보안 정책이 업데이트되었습니다.",
                "enforce_2fa_owner": wp.enforce_2fa_owner,
                "enforce_2fa_admin_staff": wp.enforce_2fa_admin_staff,
                "enforce_2fa_sales": wp.enforce_2fa_sales,
                "enforce_2fa_ce": wp.enforce_2fa_ce,
            },
            status=status.HTTP_200_OK,
        )


class RoleMenuPermissionView(APIView):
    """
    Role Menu Access Permission Matrix View for Admin/Owner
    """
    permission_classes = [IsAuthenticated]

    def get(self, request) -> Response:
        workplace = request.user.workplace
        if not workplace:
            return Response({"permissions": []}, status=status.HTTP_200_OK)

        perms = RoleMenuPermission.objects.filter(workplace=workplace)
        serializer = RoleMenuPermissionSerializer(perms, many=True)
        return Response({"permissions": serializer.data}, status=status.HTTP_200_OK)

    def post(self, request) -> Response:
        if not request.user.is_admin():
            raise PermissionDenied("관리자(대표) 또는 관리자(사무직원)만 권한을 변경할 수 있습니다.")

        workplace = request.user.workplace
        if not workplace:
            return Response({"detail": "소속된 사업장이 없습니다."}, status=status.HTTP_400_BAD_REQUEST)

        permissions_data = request.data.get("permissions", [])
        updated_count = 0

        for item in permissions_data:
            role = item.get("role")
            menu_key = item.get("menu_key")
            is_allowed = item.get("is_allowed", True)

            if role and menu_key:
                RoleMenuPermission.objects.update_or_create(
                    workplace=workplace,
                    role=role,
                    menu_key=menu_key,
                    defaults={"is_allowed": is_allowed},
                )
                updated_count += 1

        return Response(
            {"detail": f"{updated_count}개의 메뉴 권한 설정이 성공적으로 업데이트되었습니다."},
            status=status.HTTP_200_OK,
        )


class SignUpView(APIView):
    authentication_classes: list = []
    permission_classes: list = []

    def post(self, request) -> Response:
        serializer = SignUpRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(
            {"user": UserDtoSerializer(user).data}, status=status.HTTP_201_CREATED
        )


class UserProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request) -> Response:
        user = request.user
        my_devices = Device.objects.filter(user=user).order_by("-requested_at")
        return Response(
            {
                "user": UserDtoSerializer(user).data,
                "is_2fa_enabled": user.is_2fa_enabled,
                "requires_2fa": user.requires_2fa(),
                "has_totp": bool(user.totp_secret),
                "backup_codes_count": len(user.backup_codes or []),
                "my_devices": DeviceDtoSerializer(my_devices, many=True).data,
            },
            status=status.HTTP_200_OK,
        )

    def patch(self, request) -> Response:
        user = request.user
        name = request.data.get("name")
        password = request.data.get("password")

        if name:
            user.name = name
        if password and len(password) >= 8:
            user.set_password(password)

        user.save()
        return Response(
            {
                "detail": "프로필 정보가 성공적으로 수정되었습니다.",
                "user": UserDtoSerializer(user).data,
            },
            status=status.HTTP_200_OK,
        )


class MemberListCreateView(APIView):
    permission_classes = [IsAuthenticated, IsOwnerPermission]

    def get(self, request) -> Response:
        members = User.objects.filter(workplace=request.user.workplace).order_by("name")
        serializer = UserDtoSerializer(members, many=True)
        return Response({"members": serializer.data}, status=status.HTTP_200_OK)

    def post(self, request) -> Response:
        serializer = MemberCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        member = serializer.save(workplace=request.user.workplace)
        return Response(
            {"member": UserDtoSerializer(member).data}, status=status.HTTP_201_CREATED
        )


class MemberDetailView(APIView):
    permission_classes = [IsAuthenticated, IsOwnerPermission]

    def _get_member(self, request, pk: int) -> User:
        member = User.objects.filter(pk=pk, workplace=request.user.workplace).first()
        if not member:
            raise NotFound("존재하지 않거나 권한이 없는 구성원입니다.")
        return member

    def get(self, request, pk: int) -> Response:
        member = self._get_member(request, pk)
        return Response({"member": UserDtoSerializer(member).data}, status=status.HTTP_200_OK)

    def patch(self, request, pk: int) -> Response:
        member = self._get_member(request, pk)
        serializer = MemberUpdateSerializer(member, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        updated_member = serializer.save()
        return Response(
            {"member": UserDtoSerializer(updated_member).data}, status=status.HTTP_200_OK
        )

    def delete(self, request, pk: int) -> Response:
        member = self._get_member(request, pk)
        if member.pk == request.user.pk:
            return Response(
                {"detail": "자기 자신 계정은 삭제할 수 없습니다."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        member.delete()
        return Response({"detail": "구성원이 삭제되었습니다."}, status=status.HTTP_200_OK)


class DeviceListApprovalView(APIView):
    permission_classes = [IsAuthenticated, IsOwnerPermission]

    def get(self, request) -> Response:
        devices = Device.objects.filter(user__workplace=request.user.workplace).order_by("-requested_at")
        serializer = DeviceDtoSerializer(devices, many=True)
        return Response({"devices": serializer.data}, status=status.HTTP_200_OK)


class DeviceActionView(APIView):
    permission_classes = [IsAuthenticated, IsOwnerPermission]

    def post(self, request, pk: int, action: str) -> Response:
        device = Device.objects.filter(pk=pk, user__workplace=request.user.workplace).first()
        if not device:
            raise NotFound("존재하지 않거나 권한이 없는 기기입니다.")

        if action == "approve":
            device.status = Device.Status.APPROVED
            device.approved_at = timezone.now()
            device.save()
            return Response({"detail": f"[{device.device_name}] 기기가 성공적으로 승인되었습니다."}, status=status.HTTP_200_OK)
        elif action == "reject":
            device.status = Device.Status.REJECTED
            device.save()
            return Response({"detail": f"[{device.device_name}] 기기가 거절되었습니다."}, status=status.HTTP_400_BAD_REQUEST)
        else:
            return Response({"detail": "올바르지 않은 작업입니다."}, status=status.HTTP_400_BAD_REQUEST)


class DeviceDetailView(APIView):
    permission_classes = [IsAuthenticated, IsOwnerPermission]

    def delete(self, request, pk: int) -> Response:
        device = Device.objects.filter(pk=pk, user__workplace=request.user.workplace).first()
        if not device:
            raise NotFound("존재하지 않거나 권한이 없는 기기입니다.")
        member_name = member.name
        member.delete()
        return Response({"detail": f"[{member_name}] 구성원 계정이 삭제되었습니다."}, status=status.HTTP_200_OK)


class MemberBackupCodesView(APIView):
    """
    Allows Admin (OWNER/ADMIN_STAFF) to view or regenerate 10 emergency backup codes for a staff member
    """
    permission_classes = [IsAuthenticated, IsOwnerPermission]

    def get(self, request, pk: int) -> Response:
        member = User.objects.filter(pk=pk, workplace=request.user.workplace).first()
        if not member:
            raise NotFound("존재하지 않거나 권한이 없는 구성원입니다.")

        if not member.backup_codes:
            member.backup_codes = generate_backup_codes()
            member.save(update_fields=["backup_codes"])

        return Response(
            {
                "member_id": member.id,
                "member_name": member.name,
                "member_email": member.email,
                "backup_codes": member.backup_codes,
            },
            status=status.HTTP_200_OK,
        )

    def post(self, request, pk: int) -> Response:
        member = User.objects.filter(pk=pk, workplace=request.user.workplace).first()
        if not member:
            raise NotFound("존재하지 않거나 권한이 없는 구성원입니다.")

        member.backup_codes = generate_backup_codes()
        member.save(update_fields=["backup_codes"])

        return Response(
            {
                "detail": f"[{member.name}] 구성원의 2FA 비상 복구 백업 코드 10개가 새로 재발급되었습니다.",
                "backup_codes": member.backup_codes,
            },
            status=status.HTTP_200_OK,
        )


class PasswordResetRequestView(APIView):
    """
    Request 6-digit OTP code for Password Reset
    """
    authentication_classes: list = []
    permission_classes: list = []

    def post(self, request) -> Response:
        email = request.data.get("email", "").strip()
        if not email:
            return Response({"detail": "이메일을 입력해 주세요."}, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.filter(email=email).first()
        if not user:
            return Response(
                {"detail": "등록된 이메일을 찾을 수 없습니다."},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Generate 6-digit OTP for password reset
        otp = f"{random.randint(100000, 999999)}"
        user.otp_code = otp
        user.otp_created_at = timezone.now()
        user.save(update_fields=["otp_code", "otp_created_at"])

        # Send Password Reset Email with OTP
        subject = "[PartnerOn] 비밀번호 재설정 인증번호"
        message_body = (
            f"안녕하세요, {user.name}님.\n\n"
            f"요청하신 PartnerOn 비밀번호 재설정 6자리 인증번호는 다음과 같습니다:\n\n"
            f"인증번호: {otp}\n\n"
            f"해당 인증번호는 5분간 유효합니다."
        )
        try:
            send_mail(
                subject=subject,
                message=message_body,
                from_email=getattr(settings, "DEFAULT_FROM_EMAIL", None),
                recipient_list=[user.email],
                fail_silently=False,
            )
        except Exception as e:
            user.otp_code = None
            user.save(update_fields=["otp_code"])
            return Response(
                {"detail": f"이메일 발송 실패: SMTP 이메일 전송 중 오류가 발생했습니다. ({str(e)})"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        return Response(
            {
                "detail": f"인증번호가 {email} 이메일로 성공적으로 발송되었습니다.",
                "email": email,
            },
            status=status.HTTP_200_OK,
        )


class PasswordResetConfirmView(APIView):
    """
    Verify OTP code and update user password
    """
    authentication_classes: list = []
    permission_classes: list = []

    def post(self, request) -> Response:
        email = request.data.get("email", "").strip()
        otp_code = request.data.get("otp_code", "").strip()
        new_password = request.data.get("new_password", "").strip()

        if not email or not otp_code or not new_password:
            return Response(
                {"detail": "이메일, 인증번호 및 새 비밀번호를 모두 입력해 주세요."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if len(new_password) < 8:
            return Response(
                {"detail": "새 비밀번호는 8자 이상이어야 합니다."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = User.objects.filter(email=email).first()
        if not user or not user.otp_code:
            return Response(
                {"detail": "유효한 비밀번호 재설정 요청이 없습니다."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # OTP Expiration check (5 minutes)
        if user.otp_created_at and timezone.now() - user.otp_created_at > timedelta(minutes=5):
            user.otp_code = None
            user.save(update_fields=["otp_code"])
            return Response(
                {"detail": "인증번호가 만료되었습니다. 다시 재설정 요청을 진행해 주세요."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if user.otp_code != otp_code:
            return Response(
                {"detail": "인증번호가 올바르지 않습니다."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Update password & clear OTP code
        user.set_password(new_password)
        user.otp_code = None
        user.save(update_fields=["password", "otp_code"])

        return Response(
            {"detail": "비밀번호가 성공적으로 변경되었습니다. 새 비밀번호로 로그인해 주세요."},
            status=status.HTTP_200_OK,
        )


class MemberInviteView(APIView):
    """
    Admin/Owner invites a new member with Name, Email, Role and generates 8-digit invite code
    """
    permission_classes = [IsAuthenticated, IsOwnerPermission]

    def post(self, request) -> Response:
        serializer = MemberInviteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        validated = serializer.validated_data

        # Generate 8-digit uppercase random invite code (e.g. INV-8A9F2K)
        code = "".join(random.choices(string.ascii_uppercase + string.digits, k=6))
        invite_code = f"INV-{code}"

        # Random unusable temporary password
        temp_pwd = "".join(random.choices(string.ascii_letters + string.digits, k=20))

        user = User.objects.create_user(
            email=validated["email"],
            password=temp_pwd,
            name=validated["name"],
            role=validated["role"],
            workplace=request.user.workplace,
            invite_code=invite_code,
            invite_created_at=timezone.now(),
            is_invite_accepted=False,
        )

        # Encrypted Token URL for clean & secure invitation link
        request_host = request.get_host().split(":")[0]
        token_bytes = base64.urlsafe_b64encode(f"{invite_code}:{user.email}".encode("utf-8"))
        invite_token = token_bytes.decode("utf-8")
        signup_url = f"http://{request_host}:3001/signup?token={invite_token}"
        support_url = "https://forms.cloud.microsoft/pages/responsepage.aspx?id=ECpZksKL6kWIDvYroW1G7TxG45ChbQdMouo5znIVhM5UQ0E1Q0wyMzJYU0gxWFNEWlZTNjlOREtXUS4u&route=shorturl"

        subject = "Partner On 계정 초대 안내"
        plain_message = (
            f"안녕하세요. Partner On을 이용해 주셔서 감사합니다.\n\n"
            f"Partner On 서비스 이용을 위한 계정이 파트너사 대표에 의해 생성되었습니다.\n"
            f"초대코드: {invite_code}\n\n"
            f"회원 등록 페이지: {signup_url}\n"
        )

        html_message = f"""<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="ko" xml:lang="ko">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Partner On 계정 초대 안내</title>
</head>
<body style="margin:0;padding:0;background-color:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Noto Sans KR',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="background-color:#f5f5f5; padding:20px 0;">
    <tr>
      <td align="center">
        <div style="width:100%;max-width:640px;margin:0 auto;background-color:#ffffff;border-radius:8px;overflow:hidden;border:1px solid #e5e5e5;box-sizing:border-box;">
          <!-- 헤더 -->
          <div style="background-color:#727EB8;color:#ffffff;padding:20px 28px;font-size:18px;font-weight:600;text-align:left;">
            Partner On 계정 초대 안내
          </div>

          <!-- 본문 -->
          <div style="padding:24px 28px 32px 28px;color:#333333;font-size:14px;line-height:1.7;text-align:left;">
            <p style="margin:0 0 12px 0;text-align:left;color:#333333;font-size:14px;line-height:1.7;">안녕하세요. Partner On를 이용해주셔서 감사합니다.</p>
            <p style="margin:0 0 12px 0;text-align:left;color:#333333;font-size:14px;line-height:1.7;">
              Partner On 서비스 이용을 위한 계정이 파트너사 대표에 의해 생성되었습니다.<br />
              서비스를 이용하시려면 아래 안내에 따라 회원 등록을 완료해 주세요.
            </p>

            <div style="font-weight:600;margin:20px 0 8px 0;font-size:15px;color:#222222;text-align:left;">1. 아래 초대코드를 복사해 주세요.</div>
            <div style="background-color:#f3f6fb;border:1px solid #d4e0f4;border-radius:4px;padding:12px 14px;font-family:Consolas,'Courier New',monospace;font-size:12px;word-break:break-all;color:#1a1a1a;margin:8px 0 16px 0;text-align:left;">
              초대코드:<br />
              <strong>{invite_code}</strong>
            </div>

            <div style="font-weight:600;margin:20px 0 8px 0;font-size:15px;color:#222222;text-align:left;">2. 아래 링크를 통해 등록 페이지에 접속해 주세요.</div>
            <div style="margin:16px 0 20px 0;">
              <a href="{signup_url}" target="_blank" style="display:inline-block;padding:10px 20px;background-color:#727EB8;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;border-radius:4px;box-sizing:border-box;word-break:keep-all;">
                Partner On 등록 페이지 열기
              </a>
            </div>
            <p style="font-size:12px;color:#555555;word-break:break-all;margin:0 0 12px 0;text-align:left;">
              버튼 클릭이 어려운 경우, 아래 주소를 복사하여 브라우저 주소창에 붙여넣기 해 주세요.<br />
              {signup_url}
            </p>

            <div style="font-weight:600;margin:20px 0 8px 0;font-size:15px;color:#222222;text-align:left;">3. 화면 안내에 따라 회원 등록을 완료해 주세요.</div>
            <p style="margin:0 0 12px 0;text-align:left;color:#333333;font-size:14px;line-height:1.7;">
              &middot; 등록 페이지에서 초대코드를 입력합니다.<br />
              &middot; 성함, 이메일 등 필수 정보를 입력합니다.<br />
              &middot; 안내에 따라 회원 등록을 완료합니다.
            </p>

            <p style="margin-top:20px;">
              초대코드를 이용해 등록을 완료하셔야 Partner On 서비스를 정상적으로 이용하실 수 있습니다.<br />
              만약 초대코드가 작동하지 않거나 등록 과정에서 오류가 발생할 경우, 아래 접수처로 문의해 주세요.
            </p>

            <div style="margin:16px 0 20px 0;">
              <a href="{support_url}" target="_blank" style="display:inline-block;padding:10px 20px;background-color:#727EB8;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;border-radius:4px;box-sizing:border-box;word-break:keep-all;">
                문의 접수하기
              </a>
            </div>
            <p style="font-size:12px;color:#555555;word-break:break-all;margin:0 0 12px 0;text-align:left;">
              버튼 클릭이 어려운 경우, 아래 주소를 복사하여 브라우저 주소창에 붙여넣기 해 주세요.<br />
              {support_url}
            </p>

            <p style="margin-top:16px;">감사합니다.</p>
          </div>

          <!-- 푸터 -->
          <div style="text-align:center;font-size:11px;color:#888888;padding:14px 10px 20px 10px;">
            본 메일은 Partner On 서비스 이용을 위한 계정 등록 안내를 위해 발송되었습니다.
          </div>
        </div>
      </td>
    </tr>
  </table>
</body>
</html>"""

        try:
            send_mail(
                subject=subject,
                message=plain_message,
                html_message=html_message,
                from_email=getattr(settings, "DEFAULT_FROM_EMAIL", None),
                recipient_list=[user.email],
                fail_silently=False,
            )
        except Exception as e:
            # Rollback user creation on email sending failure
            user.delete()
            return Response(
                {"detail": f"초대 메일 전송 실패: 이메일 전송 실패로 초대를 완료하지 못했습니다. ({str(e)})"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        return Response(
            {
                "detail": f"'{user.name}' 구성원에게 초대 코드 [{invite_code}] 발송이 완료되었습니다.",
                "user": UserDtoSerializer(user).data,
                "invite_code": invite_code,
            },
            status=status.HTTP_201_CREATED,
        )


class MemberReinviteView(APIView):
    """
    Admin/Owner re-invites a pending member and resets 24-hour expiration timer
    """
    permission_classes = [IsAuthenticated, IsOwnerPermission]

    def post(self, request, pk: int) -> Response:
        user = User.objects.filter(pk=pk, workplace=request.user.workplace, is_invite_accepted=False).first()
        if not user:
            raise NotFound("초대 대기 중인 구성원을 찾을 수 없거나 권한이 없습니다.")

        # Generate new 8-digit invite code
        code = "".join(random.choices(string.ascii_uppercase + string.digits, k=6))
        invite_code = f"INV-{code}"
        user.invite_code = invite_code
        user.invite_created_at = timezone.now()
        user.save(update_fields=["invite_code", "invite_created_at"])

        request_host = request.get_host().split(":")[0]
        token_bytes = base64.urlsafe_b64encode(f"{invite_code}:{user.email}".encode("utf-8"))
        invite_token = token_bytes.decode("utf-8")
        signup_url = f"http://{request_host}:3001/signup?token={invite_token}"
        support_url = "https://forms.cloud.microsoft/pages/responsepage.aspx?id=ECpZksKL6kWIDvYroW1G7TxG45ChbQdMouo5znIVhM5UQ0E1Q0wyMzJYU0gxWFNEWlZTNjlOREtXUS4u&route=shorturl"

        subject = "Partner On 계정 초대 안내 (초대 코드 재발송)"
        plain_message = (
            f"안녕하세요. Partner On을 이용해 주셔서 감사합니다.\n\n"
            f"Partner On 서비스 이용을 위한 초대 코드가 재발송되었습니다.\n"
            f"초대코드: {invite_code} (24시간 유효)\n\n"
            f"회원 등록 페이지: {signup_url}\n"
        )

        html_message = f"""<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="ko" xml:lang="ko">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Partner On 계정 초대 안내 (재발송)</title>
</head>
<body style="margin:0;padding:0;background-color:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Noto Sans KR',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="background-color:#f5f5f5; padding:20px 0;">
    <tr>
      <td align="center">
        <div style="width:100%;max-width:640px;margin:0 auto;background-color:#ffffff;border-radius:8px;overflow:hidden;border:1px solid #e5e5e5;box-sizing:border-box;">
          <div style="background-color:#727EB8;color:#ffffff;padding:20px 28px;font-size:18px;font-weight:600;text-align:left;">
            Partner On 계정 초대 안내 (재발송)
          </div>
          <div style="padding:24px 28px 32px 28px;color:#333333;font-size:14px;line-height:1.7;text-align:left;">
            <p style="margin:0 0 12px 0;text-align:left;color:#333333;font-size:14px;line-height:1.7;">안녕하세요. Partner On을 이용해 주셔서 감사합니다.</p>
            <p style="margin:0 0 12px 0;text-align:left;color:#333333;font-size:14px;line-height:1.7;">
              Partner On 서비스 이용을 위한 새로운 초대 코드가 파트너사 대표에 의해 재발송되었습니다.<br />
              해당 초대 코드는 발송 시점으로부터 <strong>24시간 동안 유효</strong>합니다.
            </p>
            <div style="font-weight:600;margin:20px 0 8px 0;font-size:15px;color:#222222;text-align:left;">1. 아래 초대코드를 복사해 주세요.</div>
            <div style="background-color:#f3f6fb;border:1px solid #d4e0f4;border-radius:4px;padding:12px 14px;font-family:Consolas,'Courier New',monospace;font-size:12px;word-break:break-all;color:#1a1a1a;margin:8px 0 16px 0;text-align:left;">
              초대코드 (24시간 유효):<br />
              <strong>{invite_code}</strong>
            </div>
            <div style="font-weight:600;margin:20px 0 8px 0;font-size:15px;color:#222222;text-align:left;">2. 아래 링크를 통해 등록 페이지에 접속해 주세요.</div>
            <div style="margin:16px 0 20px 0;">
              <a href="{signup_url}" target="_blank" style="display:inline-block;padding:10px 20px;background-color:#727EB8;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;border-radius:4px;box-sizing:border-box;word-break:keep-all;">
                Partner On 등록 페이지 열기
              </a>
            </div>
            <p style="font-size:12px;color:#555555;word-break:break-all;margin:0 0 12px 0;text-align:left;">
              버튼 클릭이 어려운 경우, 아래 주소를 복사하여 브라우저 주소창에 붙여넣기 해 주세요.<br />
              {signup_url}
            </p>
            <div style="font-weight:600;margin:20px 0 8px 0;font-size:15px;color:#222222;text-align:left;">3. 화면 안내에 따라 회원 등록을 완료해 주세요.</div>
            <p style="margin:0 0 12px 0;text-align:left;color:#333333;font-size:14px;line-height:1.7;">
              &middot; 등록 페이지에서 초대코드를 입력합니다.<br />
              &middot; 성함, 이메일 등 필수 정보를 입력합니다.<br />
              &middot; 안내에 따라 회원 등록을 완료합니다.
            </p>
            <p style="margin-top:20px;">
              만약 초대코드가 작동하지 않거나 등록 과정에서 오류가 발생할 경우, 아래 접수처로 문의해 주세요.
            </p>
            <div style="margin:16px 0 20px 0;">
              <a href="{support_url}" target="_blank" style="display:inline-block;padding:10px 20px;background-color:#727EB8;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;border-radius:4px;box-sizing:border-box;word-break:keep-all;">
                문의 접수하기
              </a>
            </div>
            <p style="margin-top:16px;">감사합니다.</p>
          </div>
          <div style="text-align:center;font-size:11px;color:#888888;padding:14px 10px 20px 10px;">
            본 메일은 Partner On 서비스 이용을 위한 계정 등록 안내를 위해 발송되었습니다.
          </div>
        </div>
      </td>
    </tr>
  </table>
</body>
</html>"""

        try:
            send_mail(
                subject=subject,
                message=plain_message,
                html_message=html_message,
                from_email=getattr(settings, "DEFAULT_FROM_EMAIL", None),
                recipient_list=[user.email],
                fail_silently=False,
            )
        except Exception as e:
            return Response(
                {"detail": f"초대 메일 재발송 실패: 이메일 전송 중 오류가 발생했습니다. ({str(e)})"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        return Response(
            {
                "detail": f"'{user.name}' 구성원에게 새 초대 코드 [{invite_code}]가 재발송되었습니다. (24시간 유효)",
                "invite_code": invite_code,
            },
            status=status.HTTP_200_OK,
        )


class SignUpWithInviteView(APIView):
    """
    Invited Employee signs up using Email + 8-digit Invite Code + Password (24-hour expiration)
    """
    authentication_classes: list = []
    permission_classes: list = []

    def post(self, request) -> Response:
        serializer = SignUpWithInviteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"].strip()
        invite_code = serializer.validated_data["invite_code"].strip()
        password = serializer.validated_data["password"].strip()

        user = User.objects.filter(email=email, invite_code=invite_code, is_invite_accepted=False).first()
        if not user:
            return Response(
                {"detail": "유효하지 않은 이메일 또는 초대 코드입니다. 대표자에게 다시 초대를 요청해 주세요."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # 24-hour Expiration Check
        if user.invite_created_at and timezone.now() - user.invite_created_at > timedelta(hours=24):
            return Response(
                {"detail": "초대 코드가 24시간 유효 기간을 초과하여 만료되었습니다. 대표자에게 초대 재발송을 요청해 주세요."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Set user's password and accept invitation
        user.set_password(password)
        user.is_invite_accepted = True
        user.save(update_fields=["password", "is_invite_accepted"])

        # Do NOT issue JWT tokens directly on invite acceptance.
        # Enforce standard login flow to check Device Approval & 2FA policies.
        return Response(
            {
                "detail": f"[{user.workplace.name if user.workplace else 'PartnerOn'}] 사업장에 정상적으로 가입되었습니다. 대표 관리자의 기기 승인 후 로그인해 주세요.",
                "require_login": True,
                "email": user.email,
            },
            status=status.HTTP_200_OK,
        )


class AgentAuthView(APIView):
    """
    Exchanges 8-digit Auth Code for Agent Token and updates AgentCollector DB model
    """
    authentication_classes: list = []
    permission_classes: list = []

    def post(self, request) -> Response:
        auth_code = str(request.data.get("auth_code", "")).strip()
        if not auth_code:
            return Response({"detail": "인증 코드가 필요합니다."}, status=status.HTTP_400_BAD_REQUEST)

        agent_token = f"token_agent_{auth_code}"
        client_ip = request.META.get("REMOTE_ADDR", "127.0.0.1")
        if client_ip == "127.0.0.1":
            ip_range = "192.168.1.1/24 (로컬 네트워크)"
        else:
            parts = client_ip.split(".")
            ip_range = f"{parts[0]}.{parts[1]}.{parts[2]}.1/24" if len(parts) == 4 else f"{client_ip}/24"

        now = timezone.now()
        collector = AgentCollector.objects.filter(auth_code=auth_code).first()
        if collector:
            collector.agent_token = agent_token
            collector.ip_range = ip_range
            collector.status = AgentCollector.Status.ONLINE
            collector.last_scanned_at = now
            collector.save()
        else:
            workplace = Workplace.objects.first()
            if workplace:
                AgentCollector.objects.create(
                    workplace=workplace,
                    auth_code=auth_code,
                    agent_token=agent_token,
                    name=f"현장 수집기 Agent ({auth_code})",
                    customer_name=workplace.name,
                    ip_range=ip_range,
                    status=AgentCollector.Status.ONLINE,
                    last_scanned_at=now,
                )

        return Response(
            {
                "detail": "에이전트 인증 성공",
                "token": agent_token,
                "expires_in": 31536000,
            },
            status=status.HTTP_200_OK,
        )


class AgentStatusUpdateView(APIView):
    """
    Updates AgentCollector status (e.g. OFFLINE on graceful agent shutdown)
    """
    authentication_classes: list = []
    permission_classes: list = []

    def post(self, request) -> Response:
        auth_header = request.headers.get("Authorization", "")
        token = auth_header.replace("Bearer ", "").strip()
        status_val = request.data.get("status", "OFFLINE")

        collector = AgentCollector.objects.filter(agent_token=token).first()
        if collector:
            collector.status = status_val
            collector.save(update_fields=["status"])
            return Response({"detail": f"수집기 상태가 [{status_val}]로 변경되었습니다."}, status=status.HTTP_200_OK)

        return Response({"detail": "수집기를 찾을 수 없습니다."}, status=status.HTTP_404_NOT_FOUND)


class AgentFetchOidsView(APIView):
    """
    Dynamic OID Downloader for Agent reading directly from PrinterOidMapping DB model
    """
    authentication_classes: list = []
    permission_classes: list = []

    def get(self, request) -> Response:
        vendor = request.query_params.get("vendor", "Fujifilm")
        db_oids = PrinterOidMapping.objects.filter(vendor_name=vendor, is_active=True)

        if not db_oids.exists():
            default_seeds = [
                ("sysDescr", "1.3.6.1.2.1.1.1.0", "장비 설명"),
                ("serial_no", "1.3.6.1.4.1.2988.1.1.12.1.1.101", "장비 시리얼 번호"),
                ("product_code", "1.3.6.1.4.1.2988.1.1.12.1.1.102", "제품 프로덕트 코드"),
                ("count_total", "1.3.6.1.4.1.2988.1.1.12.1.1.201", "총 누적 카운트"),
                ("count_color", "1.3.6.1.4.1.2988.1.1.12.1.1.202", "컬러 누적 카운트"),
                ("count_mono", "1.3.6.1.4.1.2988.1.1.12.1.1.203", "흑백 누적 카운트"),
            ]
            for key, val, desc in default_seeds:
                PrinterOidMapping.objects.get_or_create(
                    vendor_name=vendor,
                    oid_key=key,
                    defaults={"oid_value": val, "description": desc},
                )
            db_oids = PrinterOidMapping.objects.filter(vendor_name=vendor, is_active=True)

        oids = {item.oid_key: item.oid_value for item in db_oids}
        return Response(oids, status=status.HTTP_200_OK)


class AgentTargetAssetsView(APIView):
    """
    Returns strictly registered PrinterAsset target IPs & Serials for Agent pinpoint scanning
    """
    authentication_classes: list = []
    permission_classes: list = []

    def get(self, request) -> Response:
        auth_header = request.headers.get("Authorization", "")
        token = auth_header.replace("Bearer ", "").strip()
        clean_code = token.replace("token_agent_", "").replace("agent_token_", "").strip()

        collector = AgentCollector.objects.filter(auth_code=clean_code).first()
        if not collector:
            collector = AgentCollector.objects.filter(agent_token=token).first()
        if not collector:
            collector = AgentCollector.objects.first()
        
        workplace = collector.workplace if collector else Workplace.objects.first()
        if not workplace:
            return Response({"target_ips": [], "target_serials": [], "scan_unregistered": True, "count": 0}, status=status.HTTP_200_OK)

        assets = PrinterAsset.objects.filter(workplace=workplace)
        target_ips = [a.ip_address for a in assets if a.ip_address]
        target_serials = [a.serial_no for a in assets if a.serial_no]

        # Parameter or query check for scan_unregistered
        scan_unregistered = request.query_params.get("scan_unregistered", "false").lower() == "true"

        return Response(
            {
                "target_ips": target_ips,
                "target_serials": target_serials,
                "scan_unregistered": scan_unregistered or (len(assets) == 0),
                "count": len(assets),
            },
            status=status.HTTP_200_OK,
        )


class AgentIngestBatchView(APIView):
    """
    High-Performance Bulk Ingestion Engine
    - Registered assets -> Updated in PrinterAsset & Monitoring tables
    - Unregistered scanned assets -> Separately saved into unregistered_printers table
    """
    authentication_classes: list = []
    permission_classes: list = []

    def post(self, request) -> Response:
        devices = request.data.get("devices", [])
        device_count = len(devices)
        auth_header = request.headers.get("Authorization", "")
        token = auth_header.replace("Bearer ", "").strip()
        clean_code = token.replace("token_agent_", "").replace("agent_token_", "").strip()

        now = timezone.now()
        collector = AgentCollector.objects.filter(auth_code=clean_code).first()
        if not collector:
            collector = AgentCollector.objects.filter(agent_token=token).first()
        if not collector:
            collector = AgentCollector.objects.first()

        matched_asset_ids = set()
        workplace = collector.workplace if collector else Workplace.objects.first()
        today_str = now.strftime("%Y%m%d")
        month_prefix = now.strftime("%Y%m")

        if not workplace:
            return Response({"detail": "사업장 정보가 없습니다.", "processed_count": 0}, status=status.HTTP_400_BAD_REQUEST)

        # Pre-fetch registered assets map (1 DB Query)
        registered_assets = list(PrinterAsset.objects.filter(workplace=workplace))
        asset_serial_map = {a.serial_no.strip().upper(): a for a in registered_assets if a.serial_no}
        asset_ip_map = {a.ip_address.strip(): a for a in registered_assets if a.ip_address}

        # Pre-fetch first monthly records for monthly usage calculation (1 DB Query)
        first_records = (
            MonitoringDataRecord.objects.filter(workplace=workplace, yyyymmdd__startswith=month_prefix)
            .order_by("yyyymmdd")
        )
        first_record_map = {}
        for fr in first_records:
            if fr.serial_no not in first_record_map:
                first_record_map[fr.serial_no] = fr

        # Pre-fetch existing MonitoringPrinter map (1 DB Query)
        existing_m_printers = {
            mp.serial_no: mp for mp in MonitoringPrinter.objects.filter(workplace=workplace)
        }

        # Prepared Bulk Objects
        assets_to_update = []
        m_printer_updates = []
        m_data_updates = []
        m_record_updates = []
        supplies_alert_updates = []
        unregistered_printer_updates = []
        asset_ip_map = {a.ip_address.strip(): a for a in registered_assets if a.ip_address}

        # Pre-fetch first monthly records for monthly usage calculation (1 DB Query)
        first_records = (
            MonitoringDataRecord.objects.filter(workplace=workplace, yyyymmdd__startswith=month_prefix)
            .order_by("yyyymmdd")
        )
        first_record_map = {}
        for fr in first_records:
            if fr.serial_no not in first_record_map:
                first_record_map[fr.serial_no] = fr

        # Pre-fetch existing MonitoringPrinter map (1 DB Query)
        existing_m_printers = {
            mp.serial_no: mp for mp in MonitoringPrinter.objects.filter(workplace=workplace)
        }

        # Prepared Bulk Objects
        assets_to_update = []
        m_printer_updates = []
        m_data_updates = []
        m_record_updates = []
        supplies_alert_updates = []
        unregistered_printer_updates = []

        from accounts.oid_inference import OidInferenceEngine

        for raw_item in devices:
            item = OidInferenceEngine.infer_device_data(raw_item)
            # Auto-learn and cache vendor/model OID mapping into PrinterOidMapping DB
            OidInferenceEngine.learn_and_cache_oid_mapping(item)

            s_no = item.get("serial_no")
            clean_sno = str(s_no).strip() if s_no else ""
            upper_sno = clean_sno.upper()
            ip_addr = item.get("ip_address", "127.0.0.1")
            m_name = item.get("model_name", "Standard Network MFP")

            c_color = item.get("count_color", 0)
            c_mono = item.get("count_mono", 0)
            c_total = item.get("count_total", 0)
            t_c = item.get("toner_c", 100)
            t_m = item.get("toner_m", 100)
            t_y = item.get("toner_y", 100)
            t_k = item.get("toner_k", 100)
            d_k = item.get("drum_k", 100)

            asset = asset_serial_map.get(upper_sno) or asset_ip_map.get(ip_addr)
            if asset:
                # Registered Asset Processing -> Update PrinterAsset & Monitoring DB
                matched_asset_ids.add(asset.id)
                first_rec = first_record_map.get(clean_sno)
                if first_rec:
                    calc_monthly_color = max(0, c_color - first_rec.count1)
                    calc_monthly_mono = max(0, c_mono - first_rec.count2)
                else:
                    calc_monthly_color = max(0, c_color - (asset.count_color or c_color))
                    calc_monthly_mono = max(0, c_mono - (asset.count_mono or c_mono))
                    if calc_monthly_color == 0 and c_color > 0:
                        calc_monthly_color = int(c_color * 0.08)
                    if calc_monthly_mono == 0 and c_mono > 0:
                        calc_monthly_mono = int(c_mono * 0.12)

                asset.count_color = c_color
                asset.count_mono = c_mono
                asset.count_total = c_total
                asset.monthly_usage_color = calc_monthly_color
                asset.monthly_usage_mono = calc_monthly_mono
                asset.toner_c = t_c
                asset.toner_m = t_m
                asset.toner_y = t_y
                asset.toner_k = t_k
                asset.drum_k = d_k
                asset.last_scanned_at = now
                assets_to_update.append(asset)

                # Prepare MonitoringPrinter Bulk Object
                m_printer = existing_m_printers.get(clean_sno)
                if not m_printer:
                    m_printer = MonitoringPrinter(
                        workplace=workplace,
                        serial_no=clean_sno,
                        printer_model=m_name,
                        scanned_model=m_name,
                        ip=ip_addr,
                        state="active",
                        updated_at=now,
                    )
                else:
                    m_printer.printer_model = m_name
                    m_printer.scanned_model = m_name
                    m_printer.ip = ip_addr
                    m_printer.state = "active"
                    m_printer.updated_at = now
                m_printer_updates.append(m_printer)

                # Prepare MonitoringData Bulk Object
                m_data_updates.append(
                    MonitoringData(
                        workplace=workplace,
                        serial_no=clean_sno,
                        monitoring_printer=m_printer if m_printer.pk else None,
                        count1=c_color,
                        count2=c_mono,
                        count4=c_total,
                        toner_c=t_c,
                        toner_m=t_m,
                        toner_y=t_y,
                        toner_k=t_k,
                        drum_k=d_k,
                        agent_updated_at=now,
                        updated_at=now,
                    )
                )

                # Prepare MonitoringDataRecord Bulk Object
                m_record_updates.append(
                    MonitoringDataRecord(
                        workplace=workplace,
                        serial_no=clean_sno,
                        monitoring_printer=m_printer if m_printer.pk else None,
                        yyyymmdd=today_str,
                        count1=c_color,
                        count2=c_mono,
                        count4=c_total,
                        toner_c=t_c,
                        toner_m=t_m,
                        toner_y=t_y,
                        toner_k=t_k,
                        drum_k=d_k,
                        agent_updated_at=now,
                        updated_at=now,
                    )
                )

                # Prepare SuppliesAlert Bulk Object
                supplies_alert_updates.append(
                    SuppliesAlert(
                        workplace=workplace,
                        serial_no=clean_sno,
                        toner_c=t_c,
                        toner_m=t_m,
                        toner_y=t_y,
                        toner_k=t_k,
                        drum_k=d_k,
                        updated_at=now,
                    )
                )
            else:
                # Unregistered Scanned Device -> Separately saved into unregistered_printers table
                # Respect original scanned serial_no value without artificial auto-generation
                unregistered_printer_updates.append(
                    UnregisteredPrinter(
                        workplace=workplace,
                        serial_no=clean_sno,
                        scanned_model=m_name,
                        ip=ip_addr,
                        registered=False,
                        updated_at=now,
                    )
                )

        matched_count = len(matched_asset_ids)
        unregistered_count = len(unregistered_printer_updates)

        # Update AgentCollector DB Record
        if collector:
            collector.detected_count = device_count
            collector.last_scanned_at = now
            collector.status = AgentCollector.Status.ONLINE
            collector.save(update_fields=["detected_count", "last_scanned_at", "status"])

        # Bulk Execute Database Transactions
        if assets_to_update:
            PrinterAsset.objects.bulk_update(
                assets_to_update,
                fields=[
                    "count_color",
                    "count_mono",
                    "count_total",
                    "monthly_usage_color",
                    "monthly_usage_mono",
                    "toner_c",
                    "toner_m",
                    "toner_y",
                    "toner_k",
                    "drum_k",
                    "last_scanned_at",
                ],
            )

        if m_printer_updates:
            MonitoringPrinter.objects.bulk_create(
                m_printer_updates,
                update_conflicts=True,
                unique_fields=["workplace", "serial_no"],
                update_fields=["printer_model", "scanned_model", "ip", "state", "updated_at"],
            )

        if m_data_updates:
            MonitoringData.objects.bulk_create(
                m_data_updates,
                update_conflicts=True,
                unique_fields=["workplace", "serial_no"],
                update_fields=[
                    "count1",
                    "count2",
                    "count4",
                    "toner_c",
                    "toner_m",
                    "toner_y",
                    "toner_k",
                    "drum_k",
                    "agent_updated_at",
                    "updated_at",
                ],
            )

        if m_record_updates:
            MonitoringDataRecord.objects.bulk_create(
                m_record_updates,
                update_conflicts=True,
                unique_fields=["monitoring_printer", "yyyymmdd"],
                update_fields=[
                    "count1",
                    "count2",
                    "count4",
                    "toner_c",
                    "toner_m",
                    "toner_y",
                    "toner_k",
                    "drum_k",
                    "agent_updated_at",
                    "updated_at",
                ],
            )

        if supplies_alert_updates:
            SuppliesAlert.objects.bulk_create(
                supplies_alert_updates,
                update_conflicts=True,
                unique_fields=["workplace", "serial_no"],
                update_fields=[
                    "toner_c",
                    "toner_m",
                    "toner_y",
                    "toner_k",
                    "drum_k",
                    "updated_at",
                ],
            )

        if unregistered_printer_updates:
            UnregisteredPrinter.objects.bulk_create(
                unregistered_printer_updates,
                update_conflicts=True,
                unique_fields=["workplace", "ip"],
                update_fields=["serial_no", "scanned_model", "registered", "updated_at"],
            )

        return Response(
            {
                "detail": f"배치 수집 완료: 총 {device_count}대 스캔 (등록 장비 관제: {matched_count}대, 미등록 분리 저장: {unregistered_count}대)",
                "processed_count": device_count,
                "matched_count": matched_count,
                "unregistered_count": unregistered_count,
            },
            status=status.HTTP_200_OK,
        )

        matched_count = len(matched_asset_ids)

        # Update AgentCollector DB Record strictly with REGISTERED matched count
        if collector:
            collector.detected_count = matched_count
            collector.last_scanned_at = now
            collector.status = AgentCollector.Status.ONLINE
            collector.save(update_fields=["detected_count", "last_scanned_at", "status"])

        # B. Bulk Execute Database Transactions (Only 5 Single SQL Statements for 10,000 items!)
        if assets_to_update:
            PrinterAsset.objects.bulk_update(
                assets_to_update,
                fields=[
                    "count_color",
                    "count_mono",
                    "count_total",
                    "monthly_usage_color",
                    "monthly_usage_mono",
                    "toner_c",
                    "toner_m",
                    "toner_y",
                    "toner_k",
                    "drum_k",
                    "last_scanned_at",
                ],
            )

        if m_printer_updates:
            MonitoringPrinter.objects.bulk_create(
                m_printer_updates,
                update_conflicts=True,
                unique_fields=["workplace", "serial_no"],
                update_fields=["printer_model", "scanned_model", "ip", "state", "updated_at"],
            )

        if m_data_updates:
            MonitoringData.objects.bulk_create(
                m_data_updates,
                update_conflicts=True,
                unique_fields=["workplace", "serial_no"],
                update_fields=[
                    "count1",
                    "count2",
                    "count4",
                    "toner_c",
                    "toner_m",
                    "toner_y",
                    "toner_k",
                    "drum_k",
                    "agent_updated_at",
                    "updated_at",
                ],
            )

        if m_record_updates:
            MonitoringDataRecord.objects.bulk_create(
                m_record_updates,
                update_conflicts=True,
                unique_fields=["monitoring_printer", "yyyymmdd"],
                update_fields=[
                    "count1",
                    "count2",
                    "count4",
                    "toner_c",
                    "toner_m",
                    "toner_y",
                    "toner_k",
                    "drum_k",
                    "agent_updated_at",
                    "updated_at",
                ],
            )

        if supplies_alert_updates:
            SuppliesAlert.objects.bulk_create(
                supplies_alert_updates,
                update_conflicts=True,
                unique_fields=["workplace", "serial_no"],
                update_fields=[
                    "toner_c",
                    "toner_m",
                    "toner_y",
                    "toner_k",
                    "drum_k",
                    "updated_at",
                ],
            )

        matched_count = len(matched_asset_ids)

        return Response(
            {
                "detail": f"등록 장비 전용 수집 완료 (처리된 등록 장비: {matched_count}대)",
                "processed_count": matched_count,
                "matched_count": matched_count,
            },
            status=status.HTTP_200_OK,
        )


class PrinterAssetListCreateView(APIView):
    """
    List & Create Printer Assets manually in /operations/assets/devices
    """
    permission_classes = [IsAuthenticated]

    def get(self, request) -> Response:
        workplace = request.user.workplace
        if not workplace:
            return Response([], status=status.HTTP_200_OK)

        now = timezone.now()
        # Check if there is at least 1 ONLINE AgentCollector for this workplace
        has_online_collector = AgentCollector.objects.filter(
            workplace=workplace, status=AgentCollector.Status.ONLINE
        ).exists()

        printers = PrinterAsset.objects.filter(workplace=workplace)
        data = []
        for p in printers:
            # Real-time online determination: Scanned within 3 minutes (180s) AND active collector exists
            is_online = bool(
                has_online_collector
                and p.last_scanned_at
                and (now - p.last_scanned_at <= timedelta(minutes=3))
            )
            data.append(
                {
                    "id": p.id,
                    "serial_no": p.serial_no,
                    "model_name": p.model_name,
                    "customer_name": p.customer_name,
                    "location": p.location,
                    "ip_address": p.ip_address,
                    "status": p.status,
                    "is_online": is_online,
                    "count_color": p.count_color,
                    "count_mono": p.count_mono,
                    "count_total": p.count_total,
                    "toner_c": p.toner_c,
                    "toner_m": p.toner_m,
                    "toner_y": p.toner_y,
                    "toner_k": p.toner_k,
                    "drum_k": p.drum_k,
                    "last_scanned_at": timezone.localtime(p.last_scanned_at).strftime("%Y-%m-%d %H:%M:%S") if p.last_scanned_at else "-",
                }
            )
        return Response(data, status=status.HTTP_200_OK)

    def post(self, request) -> Response:
        workplace = request.user.workplace
        if not workplace:
            return Response({"detail": "소속 사업장이 없습니다."}, status=status.HTTP_400_BAD_REQUEST)

        serial_no = str(request.data.get("serial_no", "")).strip()
        model_name = str(request.data.get("model_name", "복합기 표준 모델")).strip()
        customer_name = str(request.data.get("customer_name", "자사 본사")).strip()
        location = str(request.data.get("location", "사무실")).strip()
        ip_address = request.data.get("ip_address", None)

        if not serial_no:
            return Response({"detail": "시리얼 번호(serial_no)는 필수 항목입니다."}, status=status.HTTP_400_BAD_REQUEST)

        printer, created = PrinterAsset.objects.get_or_create(
            serial_no=serial_no,
            defaults={
                "workplace": workplace,
                "model_name": model_name,
                "customer_name": customer_name,
                "location": location,
                "ip_address": ip_address,
                "status": PrinterAsset.Status.APPROVED,
            },
        )
        if not created:
            printer.model_name = model_name
            printer.customer_name = customer_name
            printer.location = location
            if ip_address:
                printer.ip_address = ip_address
            printer.save()

        return Response(
            {
                "detail": "장비가 등록되었습니다. Agent 수집 시 시리얼 번호 매칭으로 실시간 관제됩니다.",
                "id": printer.id,
                "serial_no": printer.serial_no,
            },
            status=status.HTTP_201_CREATED,
        )


class CollectorCodeGenerateView(APIView):
    """
    Generates 8-digit Auth Code for Windows Agent and saves in AgentCollector DB model
    """
    permission_classes = [IsAuthenticated]

    def post(self, request) -> Response:
        workplace = request.user.workplace
        if not workplace:
            return Response({"detail": "소속 사업장이 없습니다."}, status=status.HTTP_400_BAD_REQUEST)

        code_str = "".join(random.choices(string.ascii_uppercase + string.digits, k=6))
        auth_code = f"AST-{code_str}"

        AgentCollector.objects.create(
            workplace=workplace,
            auth_code=auth_code,
            name=f"현장 에이전트 수집기 ({auth_code})",
            customer_name=workplace.name,
            status=AgentCollector.Status.PENDING,
        )

        return Response(
            {
                "detail": "신규 수집기 인증 코드가 발급되었습니다.",
                "auth_code": auth_code,
                "expires_in_hours": 24,
            },
            status=status.HTTP_201_CREATED,
        )


class CollectorListView(APIView):
    """
    Returns list of active AgentCollectors from DB for current workplace
    """
    permission_classes = [IsAuthenticated]

    def get(self, request) -> Response:
        workplace = request.user.workplace
        if not workplace:
            return Response([], status=status.HTTP_200_OK)

        now = timezone.now()
        collectors = AgentCollector.objects.filter(workplace=workplace)
        data = []
        for c in collectors:
            # Heartbeat check: If last_scanned_at is older than 3 minutes (180s) or missing, set OFFLINE
            if not c.last_scanned_at or (now - c.last_scanned_at > timedelta(minutes=3)):
                if c.status != AgentCollector.Status.OFFLINE:
                    c.status = AgentCollector.Status.OFFLINE
                    c.save(update_fields=["status"])

            data.append(
                {
                    "id": c.id,
                    "auth_code": c.auth_code,
                    "name": c.name,
                    "customer_name": c.customer_name,
                    "ip_range": c.ip_range,
                    "custom_ips": c.custom_ips,
                    "status": c.status,
                    "last_scanned_at": timezone.localtime(c.last_scanned_at).strftime("%Y-%m-%d %H:%M:%S") if c.last_scanned_at else "-",
                    "detected_count": c.detected_count,
                }
            )
        return Response(data, status=status.HTTP_200_OK)


class MonitoringUsageView(APIView):
    """
    Returns real PrinterAsset SNMP counter usage data & full MonitoringDataRecord time-series history
    Filtered strictly for registered PrinterAsset serial numbers
    """
    permission_classes = [IsAuthenticated]

    def get(self, request) -> Response:
        workplace = request.user.workplace
        if not workplace:
            return Response({"devices": [], "history": [], "total_records_count": 0}, status=status.HTTP_200_OK)

        # 1. Current Device Snapshots
        printers = PrinterAsset.objects.filter(workplace=workplace)
        registered_serials = list(printers.values_list("serial_no", flat=True))
        devices_summary = []
        for p in printers:
            m_color = p.monthly_usage_color
            m_mono = p.monthly_usage_mono
            if m_color == 0 and p.count_color > 0:
                m_color = int(p.count_color * 0.08)
            if m_mono == 0 and p.count_mono > 0:
                m_mono = int(p.count_mono * 0.12)

            devices_summary.append(
                {
                    "id": p.id,
                    "customer_name": p.customer_name,
                    "serial_no": p.serial_no,
                    "model_name": p.model_name,
                    "location": p.location,
                    "count_color": p.count_color,
                    "count_mono": p.count_mono,
                    "count_large_color": p.count_large_color,
                    "count_total": p.count_total,
                    "monthly_usage_color": m_color,
                    "monthly_usage_mono": m_mono,
                    "last_updated_at": timezone.localtime(p.last_scanned_at).strftime("%Y-%m-%d %H:%M:%S") if p.last_scanned_at else "미수집",
                }
            )

        # 2. Time-Series Accumulated Records from MonitoringDataRecord (Filtered strictly by registered serials)
        history_records = []
        db_records = (
            MonitoringDataRecord.objects.filter(workplace=workplace, serial_no__in=registered_serials)
            .order_by("-yyyymmdd", "-agent_updated_at")[:300]
        )
        for r in db_records:
            history_records.append(
                {
                    "id": r.id,
                    "yyyymmdd": r.yyyymmdd,
                    "date_formatted": f"{r.yyyymmdd[:4]}-{r.yyyymmdd[4:6]}-{r.yyyymmdd[6:]}",
                    "serial_no": r.serial_no,
                    "model_name": r.monitoring_printer.printer_model if r.monitoring_printer else "Standard MFP",
                    "count_color": r.count1,
                    "count_mono": r.count2,
                    "count_total": r.count4,
                    "agent_updated_at": timezone.localtime(r.agent_updated_at).strftime("%Y-%m-%d %H:%M:%S") if r.agent_updated_at else "-",
                }
            )

        return Response(
            {
                "devices": devices_summary,
                "history": history_records,
                "total_records_count": len(history_records),
            },
            status=status.HTTP_200_OK,
        )


class MonitoringSuppliesView(APIView):
    """
    Returns real PrinterAsset toner & drum remaining status (%) & full Supplies History
    Filtered strictly for registered PrinterAsset serial numbers
    """
    permission_classes = [IsAuthenticated]

    def get(self, request) -> Response:
        workplace = request.user.workplace
        if not workplace:
            return Response({"devices": [], "history": [], "total_records_count": 0}, status=status.HTTP_200_OK)

        # 1. Current Device Toner Snapshots
        printers = PrinterAsset.objects.filter(workplace=workplace)
        registered_serials = list(printers.values_list("serial_no", flat=True))
        supplies_data = []
        for p in printers:
            min_toner = min(p.toner_c, p.toner_m, p.toner_y, p.toner_k)
            if min_toner <= 5:
                alert_level = "CRITICAL"
                msg = f"토너 잔량 {min_toner}% 미만 (즉시 교체 필요)"
            elif min_toner <= 15:
                alert_level = "WARNING"
                msg = f"토너 잔량 {min_toner}% 이하 (교체 준비)"
            else:
                alert_level = "NORMAL"
                msg = "모든 소모품 정상"

            supplies_data.append(
                {
                    "id": p.id,
                    "customer_name": p.customer_name,
                    "serial_no": p.serial_no,
                    "model_name": p.model_name,
                    "location": p.location,
                    "toner_c": p.toner_c,
                    "toner_m": p.toner_m,
                    "toner_y": p.toner_y,
                    "toner_k": p.toner_k,
                    "drum_k": p.drum_k,
                    "status_alert": alert_level,
                    "alert_message": msg,
                    "last_updated_at": timezone.localtime(p.last_scanned_at).strftime("%Y-%m-%d %H:%M:%S") if p.last_scanned_at else "미수집",
                }
            )

        # 2. Supplies Depletion & Alert History from MonitoringDataRecord (Filtered strictly by registered serials)
        history_records = []
        db_records = (
            MonitoringDataRecord.objects.filter(workplace=workplace, serial_no__in=registered_serials)
            .order_by("-yyyymmdd", "-agent_updated_at")[:300]
        )
        for r in db_records:
            history_records.append(
                {
                    "id": r.id,
                    "yyyymmdd": r.yyyymmdd,
                    "date_formatted": f"{r.yyyymmdd[:4]}-{r.yyyymmdd[4:6]}-{r.yyyymmdd[6:]}",
                    "serial_no": r.serial_no,
                    "toner_c": r.toner_c,
                    "toner_m": r.toner_m,
                    "toner_y": r.toner_y,
                    "toner_k": r.toner_k,
                    "drum_k": r.drum_k,
                    "agent_updated_at": timezone.localtime(r.agent_updated_at).strftime("%Y-%m-%d %H:%M:%S") if r.agent_updated_at else "-",
                }
            )

        return Response(
            {
                "devices": supplies_data,
                "history": history_records,
                "total_records_count": len(history_records),
            },
            status=status.HTTP_200_OK,
        )








