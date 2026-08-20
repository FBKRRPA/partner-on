from django.core.management.base import BaseCommand
from accounts.models import MonitoringCustomer, Workplace

class Command(BaseCommand):
    help = "Seeds rich sample customers for all workplaces in Customer Master Ledger (/crm/customers)"

    def handle(self, *args, **options):
        self.stdout.write("--- Seeding Customers for All Workplaces ---")

        workplaces = Workplace.objects.all()
        if not workplaces.exists():
            self.stdout.write(self.style.WARNING("No workplaces found. Skipping customer seeding."))
            return

        customer_samples = [
            {"name": "A사 본사", "customer_id": 101, "employee_count": 120, "pc": 100, "mfp": 12, "printer": 5, "other_info": "VIP 주계약 고객사 (정식 계약 체결)"},
            {"name": "B사 서울 지사", "customer_id": 102, "employee_count": 45, "pc": 40, "mfp": 4, "printer": 2, "other_info": "월 정기 방문 고객사 (가계약 진행 중)"},
            {"name": "C사 연구소", "customer_id": 103, "employee_count": 80, "pc": 75, "mfp": 8, "printer": 4, "other_info": "소모품 자동 교체 고객사 (상담 대기)"},
        ]

        added_count = 0
        for wp in workplaces:
            for sample in customer_samples:
                cid = sample["customer_id"] + (wp.id * 10)
                c, created = MonitoringCustomer.objects.get_or_create(
                    workplace=wp,
                    customer_id=cid,
                    defaults={
                        "name": f"{wp.name} - {sample['name']}",
                        "employee_count": sample["employee_count"],
                        "pc": sample["pc"],
                        "mfp": sample["mfp"],
                        "printer": sample["printer"],
                        "other_info": sample["other_info"],
                    }
                )
                if created:
                    added_count += 1

        self.stdout.write(self.style.SUCCESS(f"Successfully seeded {added_count} customer records across {workplaces.count()} workplaces."))
