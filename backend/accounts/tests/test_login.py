from django.urls import reverse
from rest_framework.test import APITestCase
from accounts.models import User, Workplace


class LoginApiTests(APITestCase):
    def test_login_returns_dto_with_role_and_workplace(self) -> None:
        workplace = Workplace.objects.create(name="서울 본사")
        User.objects.create_user(
            email="owner@partneron.test",
            password="safe-password",
            name="홍길동",
            role=User.Role.OWNER,
            workplace=workplace,
        )
        response = self.client.post(
            reverse("login"),
            {"email": "owner@partneron.test", "password": "safe-password"},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["user"]["role"], "OWNER")
        self.assertEqual(response.data["user"]["workplace"]["name"], "서울 본사")

    def test_signup_creates_owner_and_workplace(self) -> None:
        response = self.client.post(
            reverse("signup"),
            {
                "name": "김대표",
                "email": "new@partneron.test",
                "password": "safe-password",
                "workplace_name": "부산 사업장",
            },
            format="json",
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["user"]["role"], "OWNER")
