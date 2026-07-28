from rest_framework.permissions import BasePermission
from .models import User


class IsOwnerPermission(BasePermission):
    """
    관리자 대표(OWNER) 또는 관리자 사무직원(ADMIN_STAFF) 권한을 가지고 있고 사업장(Workplace)이 할당되어 있는 유저만 허용합니다.
    """

    def has_permission(self, request, view) -> bool:
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.is_admin()
            and request.user.workplace is not None
        )


class IsAdminPermission(IsOwnerPermission):
    """
    Alias for IsOwnerPermission (OWNER or ADMIN_STAFF)
    """
    pass
