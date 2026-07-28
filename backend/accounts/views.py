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
from .models import User, Device, Workplace
from .permissions import IsOwnerPermission
from .serializers import (
    DeviceDtoSerializer,
    LoginRequestSerializer,
    MemberCreateSerializer,
    MemberUpdateSerializer,
    SignUpRequestSerializer,
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
                "method": method_used,
            },
            status=status.HTTP_200_OK,
        )


class SetupTOTPView(APIView):
    """
    Setup TOTP (Authenticator App) & Generate Secret + QR Uri
    """
    permission_classes = [IsAuthenticated]

    def get(self, request) -> Response:
        user = request.user
        secret = user.totp_secret or pyotp.random_base32()
        user.totp_secret = secret
        user.save(update_fields=["totp_secret"])

        totp = pyotp.TOTP(secret)
        provisioning_uri = totp.provisioning_uri(name=user.email, issuer_name="FUJIFILM PartnerOn")

        # Generate Base64 PNG QR code image
        qr_img = qrcode.make(provisioning_uri)
        buffer = BytesIO()
        qr_img.save(buffer, format="PNG")
        qr_code_base64 = base64.b64encode(buffer.getvalue()).decode("utf-8")
        qr_code_url = f"data:image/png;base64,{qr_code_base64}"

        return Response(
            {
                "secret": secret,
                "otpauth_url": provisioning_uri,
                "qr_code_url": qr_code_url,
                "is_enabled": user.is_2fa_enabled,
            },
            status=status.HTTP_200_OK,
        )

    def post(self, request) -> Response:
        """Verify first TOTP 6-digit code to complete TOTP 2FA activation"""
        user = request.user
        otp_code = request.data.get("otp_code", "").strip()

        if not user.totp_secret:
            return Response(
                {"detail": "TOTP 설정 정보가 존재하지 않습니다."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        totp = pyotp.TOTP(user.totp_secret)
        if not totp.verify(otp_code, valid_window=1):
            return Response(
                {"detail": "입력하신 6자리 TOTP 번호가 올바르지 않습니다."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Activate 2FA & Generate 10 Emergency Backup Codes
        user.is_2fa_enabled = True
        backup_codes = generate_backup_codes()
        user.backup_codes = backup_codes
        user.save(update_fields=["is_2fa_enabled", "backup_codes"])

        return Response(
            {
                "detail": "2차 인증 (TOTP) 설정이 성공적으로 활성화되었습니다.",
                "backup_codes": backup_codes,
            },
            status=status.HTTP_200_OK,
        )


class Toggle2FAView(APIView):
    """
    Toggle 2FA On/Off for logged in user
    """
    permission_classes = [IsAuthenticated]

    def post(self, request) -> Response:
        user = request.user
        enable = request.data.get("enable")

        if enable is None:
            enable = not user.is_2fa_enabled

        # Check workplace policy enforcement
        if not enable and user.workplace:
            if user.role == User.Role.OWNER and user.workplace.enforce_2fa_owner:
                return Response(
                    {"detail": "사업장 보안 정책상 대표(OWNER) 계정은 2FA를 해제할 수 없습니다."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            if user.role == User.Role.MANAGER and user.workplace.enforce_2fa_manager:
                return Response(
                    {"detail": "사업장 보안 정책상 매니저 계정은 2FA를 해제할 수 없습니다."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            if user.role == User.Role.EMPLOYEE and user.workplace.enforce_2fa_employee:
                return Response(
                    {"detail": "사업장 보안 정책상 사원 계정은 2FA를 해제할 수 없습니다."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        user.is_2fa_enabled = bool(enable)
        if user.is_2fa_enabled and not user.backup_codes:
            user.backup_codes = generate_backup_codes()
        user.save(update_fields=["is_2fa_enabled", "backup_codes"])

        return Response(
            {
                "is_2fa_enabled": user.is_2fa_enabled,
                "backup_codes": user.backup_codes if user.is_2fa_enabled else [],
                "detail": f"2차 인증(2FA)이 {'활성화' if user.is_2fa_enabled else '비활성화'}되었습니다.",
            },
            status=status.HTTP_200_OK,
        )


class Workplace2FAPolicyView(APIView):
    """
    Manage Workplace Mandatory 2FA Policies by Role (Owner Only)
    """
    permission_classes = [IsAuthenticated, IsOwnerPermission]

    def get(self, request) -> Response:
        wp: Workplace = request.user.workplace
        return Response(
            {
                "enforce_2fa_owner": wp.enforce_2fa_owner,
                "enforce_2fa_manager": wp.enforce_2fa_manager,
                "enforce_2fa_employee": wp.enforce_2fa_employee,
            },
            status=status.HTTP_200_OK,
        )

    def post(self, request) -> Response:
        wp: Workplace = request.user.workplace
        if "enforce_2fa_owner" in request.data:
            wp.enforce_2fa_owner = bool(request.data["enforce_2fa_owner"])
        if "enforce_2fa_manager" in request.data:
            wp.enforce_2fa_manager = bool(request.data["enforce_2fa_manager"])
        if "enforce_2fa_employee" in request.data:
            wp.enforce_2fa_employee = bool(request.data["enforce_2fa_employee"])

        wp.save()
        return Response(
            {
                "detail": "사업장 2FA 역할별 보안 정책이 업데이트되었습니다.",
                "enforce_2fa_owner": wp.enforce_2fa_owner,
                "enforce_2fa_manager": wp.enforce_2fa_manager,
                "enforce_2fa_employee": wp.enforce_2fa_employee,
            },
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
    """
    My Profile API:
    - GET: Fetch logged-in user profile & my devices
    - PATCH: Update name or password
    """
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
                {"detail": "자기 자신(대표) 계정은 삭제할 수 없습니다."},
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
            return Response({"detail": f"[{device.device_name}] 기기가 거절되었습니다."}, status=status.HTTP_200_OK)
        else:
            return Response({"detail": "올바르지 않은 작업입니다."}, status=status.HTTP_400_BAD_REQUEST)
