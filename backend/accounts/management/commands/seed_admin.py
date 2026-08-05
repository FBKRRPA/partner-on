from django.core.management.base import BaseCommand
from accounts.models import User, Workplace, Device, RoleMenuPermission


class Command(BaseCommand):
    help = "Seed initial admin user and workplace in PostgreSQL DB for immediate login"

    def handle(self, *args, **options):
        # 1. Create Default Workplace
        workplace, created_wp = Workplace.objects.get_or_create(
            name="PartnerOn 본사",
            defaults={"address": "서울특별시 강남구 테헤란로 123"},
        )
        if created_wp:
            self.stdout.write(self.style.SUCCESS("초기 Workplace (PartnerOn 본사) 생성 완료."))

        # 2. Create Initial Owner Admin User
        admin_email = "admin@partneron.co.kr"
        admin_pass = "partneron123!"

        user = User.objects.filter(email=admin_email).first()
        if not user:
            user = User.objects.create(
                email=admin_email,
                name="최고관리자",
                role=User.Role.OWNER,
                workplace=workplace,
                is_staff=True,
                is_superuser=True,
                is_active=True,
                is_2fa_enabled=False,
            )
            user.set_password(admin_pass)
            user.save()
            self.stdout.write(self.style.SUCCESS(f"초기 OWNER 계정 생성 완료: {admin_email} / {admin_pass}"))
        else:
            user.workplace = workplace
            user.set_password(admin_pass)
            user.is_active = True
            user.save()
            self.stdout.write(self.style.SUCCESS(f"기존 OWNER 계정 비밀번호 재설정 완료: {admin_email} / {admin_pass}"))

        self.stdout.write(self.style.SUCCESS("PostgreSQL 초기 로그인 데이터 준비 완료!"))
