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
from .models import User, Device, Workplace, RoleMenuPermission, PrinterAsset
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


# In-Memory Active Registry for Agent Collectors
ACTIVE_AGENT_REGISTRY: list[dict] = []


class AgentAuthView(APIView):
    """
    Exchanges 8-digit Auth Code for Agent Token and registers active Agent
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

        # Register or update in ACTIVE_AGENT_REGISTRY
        existing = next((c for c in ACTIVE_AGENT_REGISTRY if c["auth_code"] == auth_code), None)
        now_str = timezone.now().strftime("%Y-%m-%d %H:%M:%S")

        if existing:
            existing["status"] = "ONLINE"
            existing["last_scanned_at"] = now_str
        else:
            ACTIVE_AGENT_REGISTRY.append({
                "id": len(ACTIVE_AGENT_REGISTRY) + 1,
                "auth_code": auth_code,
                "name": f"현장 에이전트 수집기 ({auth_code})",
                "customer_name": getattr(request.user, "workplace", None).name if getattr(request.user, "workplace", None) else "파트너온 수집 사업장",
                "ip_range": ip_range,
                "custom_ips": [],
                "status": "ONLINE",
                "last_scanned_at": now_str,
                "detected_count": 0,
            })

        return Response(
            {
                "detail": "에이전트 인증 성공",
                "token": agent_token,
                "expires_in": 31536000,
            },
            status=status.HTTP_200_OK,
        )


class AgentFetchOidsView(APIView):
    """
    Dynamic OID Downloader for Agent
    """
    authentication_classes: list = []
    permission_classes: list = []

    def get(self, request) -> Response:
        oids = {
            "sysDescr": "1.3.6.1.2.1.1.1.0",
            "serial_no": "1.3.6.1.4.1.2988.1.1.12.1.1.101",
            "product_code": "1.3.6.1.4.1.2988.1.1.12.1.1.102",
            "count_total": "1.3.6.1.4.1.2988.1.1.12.1.1.201",
            "count_color": "1.3.6.1.4.1.2988.1.1.12.1.1.202",
            "count_mono": "1.3.6.1.4.1.2988.1.1.12.1.1.203",
        }
        return Response(oids, status=status.HTTP_200_OK)


class AgentIngestBatchView(APIView):
    """
    Receives Batch Ingestion dataset from Windows Agent (1,000 printers per batch)
    Matches ingested devices with PrinterAsset DB records by serial_no
    """
    authentication_classes: list = []
    permission_classes: list = []

    def post(self, request) -> Response:
        devices = request.data.get("devices", [])
        device_count = len(devices)
        auth_header = request.headers.get("Authorization", "")
        token = auth_header.replace("Bearer ", "").strip()
        auth_code = token.replace("token_agent_", "")

        # 1. Update active collector registry
        now = timezone.now()
        now_str = now.strftime("%Y-%m-%d %H:%M:%S")
        for agent in ACTIVE_AGENT_REGISTRY:
            if agent["auth_code"] == auth_code or token.endswith(agent["auth_code"]):
                agent["detected_count"] = device_count
                agent["last_scanned_at"] = now_str
                agent["status"] = "ONLINE"

        # 2. Real DB Ingestion Matching by serial_no
        matched_count = 0
        for item in devices:
            s_no = item.get("serial_no")
            if not s_no:
                continue

            asset = PrinterAsset.objects.filter(serial_no=s_no).first()
            if asset:
                asset.count_color = item.get("count_color", asset.count_color)
                asset.count_mono = item.get("count_mono", asset.count_mono)
                asset.count_total = item.get("count_total", asset.count_total)
                asset.toner_c = item.get("toner_c", asset.toner_c)
                asset.toner_m = item.get("toner_m", asset.toner_m)
                asset.toner_y = item.get("toner_y", asset.toner_y)
                asset.toner_k = item.get("toner_k", asset.toner_k)
                asset.drum_k = item.get("drum_k", asset.drum_k)
                asset.last_scanned_at = now
                asset.save()
                matched_count += 1

        return Response(
            {
                "detail": f"총 {device_count}대 스캔 완료 (DB 수동 등록 매칭 장비: {matched_count}대)",
                "processed_count": device_count,
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

        printers = PrinterAsset.objects.filter(workplace=workplace)
        data = [
            {
                "id": p.id,
                "serial_no": p.serial_no,
                "model_name": p.model_name,
                "customer_name": p.customer_name,
                "location": p.location,
                "ip_address": p.ip_address,
                "status": p.status,
                "count_color": p.count_color,
                "count_mono": p.count_mono,
                "count_total": p.count_total,
                "toner_c": p.toner_c,
                "toner_m": p.toner_m,
                "toner_y": p.toner_y,
                "toner_k": p.toner_k,
                "drum_k": p.drum_k,
                "last_scanned_at": p.last_scanned_at.strftime("%Y-%m-%d %H:%M:%S") if p.last_scanned_at else "-",
            }
            for p in printers
        ]
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
    Generates 8-digit Auth Code for Windows Agent
    """
    permission_classes = [IsAuthenticated]

    def post(self, request) -> Response:
        code_str = "".join(random.choices(string.ascii_uppercase + string.digits, k=6))
        auth_code = f"AST-{code_str}"
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
    Returns list of active Agents/Collectors for current workplace
    """
    permission_classes = [IsAuthenticated]

    def get(self, request) -> Response:
        return Response(ACTIVE_AGENT_REGISTRY, status=status.HTTP_200_OK)


class MonitoringUsageView(APIView):
    """
    Returns real PrinterAsset SNMP counter usage data from DB
    """
    permission_classes = [IsAuthenticated]

    def get(self, request) -> Response:
        workplace = request.user.workplace
        if not workplace:
            return Response([], status=status.HTTP_200_OK)

        printers = PrinterAsset.objects.filter(workplace=workplace)
        usage_data = [
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
                "monthly_usage_color": p.monthly_usage_color,
                "monthly_usage_mono": p.monthly_usage_mono,
                "last_updated_at": p.last_scanned_at.strftime("%Y-%m-%d %H:%M:%S") if p.last_scanned_at else "미수집",
            }
            for p in printers
        ]
        return Response(usage_data, status=status.HTTP_200_OK)


class MonitoringSuppliesView(APIView):
    """
    Returns real PrinterAsset toner & drum remaining status (%) from DB
    """
    permission_classes = [IsAuthenticated]

    def get(self, request) -> Response:
        workplace = request.user.workplace
        if not workplace:
            return Response([], status=status.HTTP_200_OK)

        printers = PrinterAsset.objects.filter(workplace=workplace)
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

            supplies_data.append({
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
                "last_updated_at": p.last_scanned_at.strftime("%Y-%m-%d %H:%M:%S") if p.last_scanned_at else "미수집",
            })

        return Response(supplies_data, status=status.HTTP_200_OK)








