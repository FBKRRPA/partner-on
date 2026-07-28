from rest_framework.permissions import BasePermission
from .models import User


class IsOwnerPermission(BasePermission):
    """
    대표(OWNER) 권한을 가지고 있고 사업장(Workplace)이 할당되어 있는 유저만 허용합니다.
    """

    def has_permission(self, request, view) -> bool:
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role == User.Role.OWNER
            and request.user.workplace is not None
        )
