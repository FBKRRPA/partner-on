from django.utils import timezone
from rest_framework import serializers
from rest_framework.exceptions import AuthenticationFailed, PermissionDenied
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import User, Workplace, Device


class WorkplaceDtoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Workplace
        fields = ("id", "name", "enforce_2fa_owner", "enforce_2fa_manager", "enforce_2fa_employee")


class UserDtoSerializer(serializers.ModelSerializer):
    workplace = WorkplaceDtoSerializer(read_only=True)
    workplace_name = serializers.CharField(source="workplace.name", read_only=True, default="")
    requires_2fa = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            "id",
            "email",
            "name",
            "role",
            "is_2fa_enabled",
            "requires_2fa",
            "workplace",
            "workplace_name",
        )

    def get_requires_2fa(self, obj: User) -> bool:
        return obj.requires_2fa()


class DeviceDtoSerializer(serializers.ModelSerializer):
    user_email = serializers.CharField(source="user.email", read_only=True)
    user_name = serializers.CharField(source="user.name", read_only=True)
    user_role = serializers.CharField(source="user.role", read_only=True)

    class Meta:
        model = Device
        fields = (
            "id",
            "device_uuid",
            "device_name",
            "ip_address",
            "user_agent",
            "status",
            "requested_at",
            "approved_at",
            "user_email",
            "user_name",
            "user_role",
        )


class LoginRequestSerializer(TokenObtainPairSerializer):
    username_field = User.EMAIL_FIELD
    device_uuid = serializers.CharField(required=False, write_only=True, default="")
    device_name = serializers.CharField(required=False, write_only=True, default="Desktop Browser")

    def validate(self, attrs: dict) -> dict:
        device_uuid = attrs.pop("device_uuid", "")
        device_name = attrs.pop("device_name", "Desktop Browser")

        data = super().validate(attrs)
        user: User = self.user

        # Device approval check logic
        if device_uuid:
            device, created = Device.objects.get_or_create(
                user=user,
                device_uuid=device_uuid,
                defaults={
                    "device_name": device_name,
                    "status": Device.Status.APPROVED if user.role == User.Role.OWNER else Device.Status.PENDING,
                    "approved_at": timezone.now() if user.role == User.Role.OWNER else None,
                },
            )

            if not created and device.device_name != device_name:
                device.device_name = device_name
                device.save(update_fields=["device_name"])

            # Check approval status
            if device.status == Device.Status.PENDING:
                raise PermissionDenied(
                    "승인되지 않은 기기입니다. 사업장 대표(OWNER)에게 승인을 요청했습니다. 승인 후 로그인 가능합니다."
                )
            elif device.status == Device.Status.REJECTED:
                raise PermissionDenied(
                    "승인이 거절된 기기입니다. 사업장 대표에게 문의하세요."
                )

        data["user"] = UserDtoSerializer(user).data
        return data


class SignUpRequestSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=80)
    email = serializers.EmailField()
    password = serializers.CharField(min_length=8, max_length=128, write_only=True)
    workplace_name = serializers.CharField(max_length=120)

    def validate_email(self, value: str) -> str:
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("이미 사용 중인 이메일입니다.")
        return value

    def validate_workplace_name(self, value: str) -> str:
        if Workplace.objects.filter(name=value).exists():
            raise serializers.ValidationError(
                "이미 등록된 사업장입니다. 사업장 관리자에게 초대를 요청해 주세요."
            )
        return value

    def create(self, validated_data: dict) -> User:
        workplace = Workplace.objects.create(name=validated_data.pop("workplace_name"))
        return User.objects.create_user(
            **validated_data, role=User.Role.OWNER, workplace=workplace
        )


class MemberCreateSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=80)
    email = serializers.EmailField()
    password = serializers.CharField(min_length=8, max_length=128, write_only=True)
    role = serializers.ChoiceField(
        choices=[User.Role.MANAGER, User.Role.EMPLOYEE],
        default=User.Role.EMPLOYEE,
    )

    def validate_email(self, value: str) -> str:
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("이미 사용 중인 이메일입니다.")
        return value

    def create(self, validated_data: dict) -> User:
        return User.objects.create_user(**validated_data)


class MemberUpdateSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=80, required=False)
    email = serializers.EmailField(required=False)
    role = serializers.ChoiceField(
        choices=[User.Role.MANAGER, User.Role.EMPLOYEE],
        required=False,
    )
    password = serializers.CharField(
        min_length=8, max_length=128, required=False, write_only=True
    )

    def validate_email(self, value: str) -> str:
        instance = getattr(self, "instance", None)
        qs = User.objects.filter(email=value)
        if instance:
            qs = qs.exclude(pk=instance.pk)
        if qs.exists():
            raise serializers.ValidationError("이미 사용 중인 이메일입니다.")
        return value

    def update(self, instance: User, validated_data: dict) -> User:
        password = validated_data.pop("password", None)
        if password:
            instance.set_password(password)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        instance.save()
        return instance
