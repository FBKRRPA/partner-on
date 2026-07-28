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
        self.ce = User.objects.create_user(
            email="ce@partneron.test",
            password="safe-password-123",
            name="김기사",
            role=User.Role.CE,
            workplace=self.workplace,
        )
        self.url = reverse("member-list-create")

    def _authenticate(self, user: User) -> None:
        refresh = RefreshToken.for_user(user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {refresh.access_token}")

    def test_owner_can_create_admin_staff_sales_and_ce(self) -> None:
        self._authenticate(self.owner)

        # 1. 관리자(사무직원) 계정 생성
        res_admin = self.client.post(
            self.url,
            {
                "name": "박사무",
                "email": "admin_staff@partneron.test",
                "password": "admin-password-123",
                "role": "ADMIN_STAFF",
            },
            format="json",
        )
        self.assertEqual(res_admin.status_code, 201)
        self.assertEqual(res_admin.data["member"]["role"], "ADMIN_STAFF")
        self.assertEqual(res_admin.data["member"]["name"], "박사무")
        self.assertEqual(
            res_admin.data["member"]["workplace"]["name"], "파트너온 본사"
        )

        # 2. 영업 계정 생성
        res_sales = self.client.post(
            self.url,
            {
                "name": "이영업",
                "email": "sales@partneron.test",
                "password": "sales-password-123",
                "role": "SALES",
            },
            format="json",
        )
        self.assertEqual(res_sales.status_code, 201)
        self.assertEqual(res_sales.data["member"]["role"], "SALES")

    def test_ce_cannot_create_member(self) -> None:
        self._authenticate(self.ce)
        response = self.client.post(
            self.url,
            {
                "name": "시도사원",
                "email": "attempt@partneron.test",
                "password": "some-password-123",
                "role": "CE",
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
        detail_url = reverse("member-detail", kwargs={"pk": self.ce.pk})
        response = self.client.patch(
            detail_url,
            {"name": "김수정", "role": "SALES"},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["member"]["name"], "김수정")
        self.assertEqual(response.data["member"]["role"], "SALES")

    def test_owner_can_delete_member(self) -> None:
        self._authenticate(self.owner)
        detail_url = reverse("member-detail", kwargs={"pk": self.ce.pk})
        response = self.client.delete(detail_url)
        self.assertEqual(response.status_code, 200)
        self.assertFalse(User.objects.filter(pk=self.ce.pk).exists())

    def test_owner_cannot_delete_self(self) -> None:
        self._authenticate(self.owner)
        detail_url = reverse("member-detail", kwargs={"pk": self.owner.pk})
        response = self.client.delete(detail_url)
        self.assertEqual(response.status_code, 400)
        self.assertTrue(User.objects.filter(pk=self.owner.pk).exists())
