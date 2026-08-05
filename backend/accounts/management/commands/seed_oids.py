from django.core.management.base import BaseCommand
from accounts.models import PrinterOidMapping


class Command(BaseCommand):
    help = "Seed real & accurate SNMP MIB OID mappings for major MFP vendors into PostgreSQL DB"

    def handle(self, *args, **options):
        oids_data = [
            # =========================================================================
            # 1. Standard Printer MIB (RFC 3805 / RFC 1213 - 공통 범용 OID)
            # =========================================================================
            {"vendor": "Standard", "key": "sysDescr", "val": "1.3.6.1.2.1.1.1.0", "desc": "장비 디바이스 설명 (Standard)"},
            {"vendor": "Standard", "key": "sysUpTime", "val": "1.3.6.1.2.1.1.3.0", "desc": "장비 작동 시간 (Standard)"},
            {"vendor": "Standard", "key": "serial_no", "val": "1.3.6.1.2.1.43.5.1.1.17.1", "desc": "장비 시리얼 번호 (prtGeneralSerialNumber.1)"},
            {"vendor": "Standard", "key": "model_name", "val": "1.3.6.1.2.1.25.3.2.1.3.1", "desc": "장비 모델명 (hrDeviceDescr.1)"},
            {"vendor": "Standard", "key": "count_total", "val": "1.3.6.1.2.1.43.10.2.1.4.1.1", "desc": "총 누적 인쇄 카운트 (prtMarkerLifeCount.1.1)"},
            {"vendor": "Standard", "key": "toner_c", "val": "1.3.6.1.2.1.43.11.1.1.9.1.1", "desc": "시안(C) 토너 잔량 %"},
            {"vendor": "Standard", "key": "toner_m", "val": "1.3.6.1.2.1.43.11.1.1.9.1.2", "desc": "마젠타(M) 토너 잔량 %"},
            {"vendor": "Standard", "key": "toner_y", "val": "1.3.6.1.2.1.43.11.1.1.9.1.3", "desc": "옐로(Y) 토너 잔량 %"},
            {"vendor": "Standard", "key": "toner_k", "val": "1.3.6.1.2.1.43.11.1.1.9.1.4", "desc": "블랙(K) 토너 잔량 %"},
            {"vendor": "Standard", "key": "drum_k", "val": "1.3.6.1.2.1.43.11.1.1.9.1.5", "desc": "블랙(K) 드럼 잔량 %"},

            # =========================================================================
            # 2. Fujifilm / Fuji Xerox (후지필름 / 후지제록스 전용 Enterprise OID)
            # =========================================================================
            {"vendor": "Fujifilm", "key": "sysDescr", "val": "1.3.6.1.2.1.1.1.0", "desc": "시스템 설명"},
            {"vendor": "Fujifilm", "key": "serial_no", "val": "1.3.6.1.4.1.2988.1.1.12.1.1.101", "desc": "후지필름 시리얼 번호 (Enterprise)"},
            {"vendor": "Fujifilm", "key": "product_code", "val": "1.3.6.1.4.1.2988.1.1.12.1.1.102", "desc": "후지필름 프로덕트 코드"},
            {"vendor": "Fujifilm", "key": "count_total", "val": "1.3.6.1.4.1.2988.1.1.12.1.1.201", "desc": "후지필름 총 누적 카운트"},
            {"vendor": "Fujifilm", "key": "count_color", "val": "1.3.6.1.4.1.2988.1.1.12.1.1.202", "desc": "후지필름 컬러 누적 카운트"},
            {"vendor": "Fujifilm", "key": "count_mono", "val": "1.3.6.1.4.1.2988.1.1.12.1.1.203", "desc": "후지필름 흑백 누적 카운트"},
            {"vendor": "Fujifilm", "key": "toner_c", "val": "1.3.6.1.4.1.2988.1.1.12.1.1.301", "desc": "후지필름 C 토너 잔량 %"},
            {"vendor": "Fujifilm", "key": "toner_m", "val": "1.3.6.1.4.1.2988.1.1.12.1.1.302", "desc": "후지필름 M 토너 잔량 %"},
            {"vendor": "Fujifilm", "key": "toner_y", "val": "1.3.6.1.4.1.2988.1.1.12.1.1.303", "desc": "후지필름 Y 토너 잔량 %"},
            {"vendor": "Fujifilm", "key": "toner_k", "val": "1.3.6.1.4.1.2988.1.1.12.1.1.304", "desc": "후지필름 K 토너 잔량 %"},

            # =========================================================================
            # 3. Canon (캐논 imageRUNNER / ADVANCE)
            # =========================================================================
            {"vendor": "Canon", "key": "serial_no", "val": "1.3.6.1.4.1.1602.1.2.1.4.0", "desc": "캐논 전용 시리얼 번호"},
            {"vendor": "Canon", "key": "count_total", "val": "1.3.6.1.4.1.1602.1.11.1.3.1.4.101", "desc": "캐논 총 카운터 (Total Counter)"},
            {"vendor": "Canon", "key": "count_color", "val": "1.3.6.1.4.1.1602.1.11.1.3.1.4.102", "desc": "캐논 컬러 카운터 (Full Color)"},
            {"vendor": "Canon", "key": "count_mono", "val": "1.3.6.1.4.1.1602.1.11.1.3.1.4.103", "desc": "캐논 흑백 카운터 (Black & White)"},
            {"vendor": "Canon", "key": "toner_c", "val": "1.3.6.1.4.1.1602.1.11.2.1.1.3.1", "desc": "캐논 C 토너 잔량 %"},
            {"vendor": "Canon", "key": "toner_m", "val": "1.3.6.1.4.1.1602.1.11.2.1.1.3.2", "desc": "캐논 M 토너 잔량 %"},
            {"vendor": "Canon", "key": "toner_y", "val": "1.3.6.1.4.1.1602.1.11.2.1.1.3.3", "desc": "캐논 Y 토너 잔량 %"},
            {"vendor": "Canon", "key": "toner_k", "val": "1.3.6.1.4.1.1602.1.11.2.1.1.3.4", "desc": "캐논 K 토너 잔량 %"},

            # =========================================================================
            # 4. Ricoh (리코 / 신도리코)
            # =========================================================================
            {"vendor": "Ricoh", "key": "serial_no", "val": "1.3.6.1.4.1.367.3.2.1.2.1.4.0", "desc": "리코 전용 시리얼 번호"},
            {"vendor": "Ricoh", "key": "count_total", "val": "1.3.6.1.4.1.367.3.2.1.2.19.1.0", "desc": "리코 총 인쇄 카운터"},
            {"vendor": "Ricoh", "key": "count_color", "val": "1.3.6.1.4.1.367.3.2.1.2.19.2.0", "desc": "리코 컬러 카운터"},
            {"vendor": "Ricoh", "key": "count_mono", "val": "1.3.6.1.4.1.367.3.2.1.2.19.3.0", "desc": "리코 흑백 카운터"},

            # =========================================================================
            # 5. HP (휴렛팩커드 LaserJet / PageWide)
            # =========================================================================
            {"vendor": "HP", "key": "serial_no", "val": "1.3.6.1.4.1.11.2.3.9.4.2.1.1.3.3.0", "desc": "HP 전용 시리얼 번호"},
            {"vendor": "HP", "key": "count_total", "val": "1.3.6.1.4.1.11.2.3.9.4.2.1.4.1.2.5.0", "desc": "HP 페이지 생애 누적 카운터"},
            {"vendor": "HP", "key": "count_color", "val": "1.3.6.1.4.1.11.2.3.9.4.2.1.4.1.2.6.0", "desc": "HP 컬러 인쇄 카운터"},

            # =========================================================================
            # 6. Kyocera (교세라 TASKalfa / ECOSYS)
            # =========================================================================
            {"vendor": "Kyocera", "key": "serial_no", "val": "1.3.6.1.4.1.1347.43.5.1.1.17.1", "desc": "교세라 전용 시리얼 번호"},
            {"vendor": "Kyocera", "key": "count_total", "val": "1.3.6.1.4.1.1347.42.2.1.1.1", "desc": "교세라 총 인쇄 카운터"},
            {"vendor": "Kyocera", "key": "count_color", "val": "1.3.6.1.4.1.1347.42.2.1.1.2", "desc": "교세라 컬러 카운터"},

            # =========================================================================
            # 7. Konica Minolta (코니카미놀타 bizhub)
            # =========================================================================
            {"vendor": "KonicaMinolta", "key": "serial_no", "val": "1.3.6.1.4.1.18334.1.1.1.1.5.1", "desc": "코니카미놀타 시리얼 번호"},
            {"vendor": "KonicaMinolta", "key": "count_total", "val": "1.3.6.1.4.1.18334.1.1.1.5.7.1.1.1", "desc": "코니카미놀타 총 카운트"},
            {"vendor": "KonicaMinolta", "key": "count_color", "val": "1.3.6.1.4.1.18334.1.1.1.5.7.1.1.2", "desc": "코니카미놀타 컬러 카운트"},
        ]

        created_count = 0
        updated_count = 0

        for item in oids_data:
            obj, created = PrinterOidMapping.objects.get_or_create(
                vendor_name=item["vendor"],
                oid_key=item["key"],
                defaults={
                    "oid_value": item["val"],
                    "description": item["desc"],
                    "is_active": True,
                },
            )
            if created:
                created_count += 1
            else:
                obj.oid_value = item["val"]
                obj.description = item["desc"]
                obj.is_active = True
                obj.save()
                updated_count += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"총 {len(oids_data)}개의 주요 제조사(Fujifilm, Canon, Ricoh, HP, Kyocera, KonicaMinolta, Standard) OID 데이터 시드 완료! (신규: {created_count}개, 갱신: {updated_count}개)"
            )
        )
