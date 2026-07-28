from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken
from accounts.models import User, Workplace


class MemberApiTests(APITestCase):
    def setUp(self) -> None:
        self.workplace = Workplace.objects.create(name="파트너온 본사")
        self.owner = User.objects.create_user(
            email="owner@partneron.test",
            password="safe-password-123",
            name="홍대표",
            role=User.Role.OWNER,
            workplace=self.workplace,
        )
        self.employee = User.objects.create_user(
            email="employee@partneron.test",
            password="safe-password-123",
            name="김사원",
            role=User.Role.EMPLOYEE,
            workplace=self.workplace,
        )
        self.url = reverse("member-list-create")

    def _authenticate(self, user: User) -> None:
        refresh = RefreshToken.for_user(user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {refresh.access_token}")

    def test_owner_can_create_manager_and_employee(self) -> None:
        self._authenticate(self.owner)

        # 1. 매니저 계정 생성
        res_manager = self.client.post(
            self.url,
            {
                "name": "박매니저",
                "email": "manager@partneron.test",
                "password": "manager-password-123",
                "role": "MANAGER",
            },
            format="json",
        )
        self.assertEqual(res_manager.status_code, 201)
        self.assertEqual(res_manager.data["member"]["role"], "MANAGER")
        self.assertEqual(res_manager.data["member"]["name"], "박매니저")
        self.assertEqual(
            res_manager.data["member"]["workplace"]["name"], "파트너온 본사"
        )

        # 2. 사원 계정 생성
        res_emp = self.client.post(
            self.url,
            {
                "name": "이새사원",
                "email": "newemp@partneron.test",
                "password": "emp-password-123",
                "role": "EMPLOYEE",
            },
            format="json",
        )
        self.assertEqual(res_emp.status_code, 201)
        self.assertEqual(res_emp.data["member"]["role"], "EMPLOYEE")

    def test_employee_cannot_create_member(self) -> None:
        self._authenticate(self.employee)
        response = self.client.post(
            self.url,
            {
                "name": "시도사원",
                "email": "attempt@partneron.test",
                "password": "some-password-123",
                "role": "EMPLOYEE",
            },
            format="json",
        )
        self.assertEqual(response.status_code, 403)

    def test_unauthenticated_user_cannot_access(self) -> None:
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 401)

    def test_owner_can_list_members(self) -> None:
        self._authenticate(self.owner)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 200)
        members = response.data["members"]
        self.assertEqual(len(members), 2)

    def test_owner_can_update_member(self) -> None:
        self._authenticate(self.owner)
        detail_url = reverse("member-detail", kwargs={"pk": self.employee.pk})
        response = self.client.patch(
            detail_url,
            {"name": "김수정", "role": "MANAGER"},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["member"]["name"], "김수정")
        self.assertEqual(response.data["member"]["role"], "MANAGER")

    def test_owner_can_delete_member(self) -> None:
        self._authenticate(self.owner)
        detail_url = reverse("member-detail", kwargs={"pk": self.employee.pk})
        response = self.client.delete(detail_url)
        self.assertEqual(response.status_code, 200)
        self.assertFalse(User.objects.filter(pk=self.employee.pk).exists())

    def test_owner_cannot_delete_self(self) -> None:
        self._authenticate(self.owner)
        detail_url = reverse("member-detail", kwargs={"pk": self.owner.pk})
        response = self.client.delete(detail_url)
        self.assertEqual(response.status_code, 400)
        self.assertTrue(User.objects.filter(pk=self.owner.pk).exists())

