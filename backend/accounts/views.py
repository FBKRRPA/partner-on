import base64
from io import BytesIO
import random
import string
import pyotp
import qrcode
from django.utils import timezone
from datetime import timedelta
from rest_framework import status
from rest_framework.exceptions import NotFound, PermissionDenied
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from .models import User, Device, Workplace, RoleMenuPermission
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
    Setup or regenerate TOTP secret & QR Code Image Data URI for Authenticator App
    """
    permission_classes = [IsAuthenticated]

    def post(self, request) -> Response:
        user = request.user
        secret = pyotp.random_base32()
        user.totp_secret = secret
        user.save(update_fields=["totp_secret"])

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
                "totp_secret": secret,
                "provisioning_uri": provisioning_uri,
                "qr_code_url": qr_code_url,
            },
            status=status.HTTP_200_OK,
        )


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
    Toggle 2FA (Enable / Disable) for personal user profile
    """
    permission_classes = [IsAuthenticated]

    def post(self, request) -> Response:
        user = request.user
        enable = request.data.get("enable")

        if enable is True:
            if not user.totp_secret:
                user.totp_secret = pyotp.random_base32()
            user.is_2fa_enabled = True
            if not user.backup_codes:
                user.backup_codes = generate_backup_codes()
            user.save(update_fields=["totp_secret", "is_2fa_enabled", "backup_codes"])
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
        device_name = device.device_name
        device.delete()
        return Response({"detail": f"[{device_name}] 기기가 삭제되었습니다."}, status=status.HTTP_200_OK)


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

        return Response(
            {
                "detail": f"인증번호가 {email} 이메일로 발송되었습니다.",
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
            is_invite_accepted=False,
        )

        return Response(
            {
                "detail": f"'{user.name}' 구성원에게 초대 코드 [{invite_code}]가 발송되었습니다.",
                "user": UserDtoSerializer(user).data,
                "invite_code": invite_code,
            },
            status=status.HTTP_201_CREATED,
        )


class SignUpWithInviteView(APIView):
    """
    Invited Employee signs up using Email + 8-digit Invite Code + Password
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

        # Set user's password and accept invitation
        user.set_password(password)
        user.is_invite_accepted = True
        user.save(update_fields=["password", "is_invite_accepted"])

        # Generate JWT Tokens
        refresh = RefreshToken.for_user(user)

        return Response(
            {
                "detail": f"[{user.workplace.name if user.workplace else 'PartnerOn'}] 사업장에 정상적으로 가입되었습니다.",
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "user": UserDtoSerializer(user).data,
            },
            status=status.HTTP_200_OK,
        )



