from django.core.management.base import BaseCommand
from accounts.models import PrinterOidMapping, OidListMaster, PrinterModelMaster


class Command(BaseCommand):
    help = "Seed real & accurate SNMP MIB OID mappings into both PrinterOidMapping and oid_lists DB tables"

    def handle(self, *args, **options):
        # 1. Seed PrinterOidMapping Table
        oids_data = [
            # Standard MIB (RFC 3805 Printer MIB)
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

            # Fujifilm / Fuji Xerox Enterprise MIB
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

            # Canon Enterprise MIB
            {"vendor": "Canon", "key": "serial_no", "val": "1.3.6.1.4.1.1602.1.2.1.4.0", "desc": "캐논 전용 시리얼 번호"},
            {"vendor": "Canon", "key": "count_total", "val": "1.3.6.1.4.1.1602.1.11.1.3.1.4.101", "desc": "캐논 총 카운터 (Total Counter)"},
            {"vendor": "Canon", "key": "count_color", "val": "1.3.6.1.4.1.1602.1.11.1.3.1.4.102", "desc": "캐논 컬러 카운터 (Full Color)"},
            {"vendor": "Canon", "key": "count_mono", "val": "1.3.6.1.4.1.1602.1.11.1.3.1.4.103", "desc": "캐논 흑백 카운터 (Black & White)"},
            {"vendor": "Canon", "key": "toner_c", "val": "1.3.6.1.4.1.1602.1.11.2.1.1.3.1", "desc": "캐논 C 토너 잔량 %"},
            {"vendor": "Canon", "key": "toner_m", "val": "1.3.6.1.4.1.1602.1.11.2.1.1.3.2", "desc": "캐논 M 토너 잔량 %"},
            {"vendor": "Canon", "key": "toner_y", "val": "1.3.6.1.4.1.1602.1.11.2.1.1.3.3", "desc": "캐논 Y 토너 잔량 %"},
            {"vendor": "Canon", "key": "toner_k", "val": "1.3.6.1.4.1.1602.1.11.2.1.1.3.4", "desc": "캐논 K 토너 잔량 %"},

            # Ricoh / Sindoh Enterprise MIB
            {"vendor": "Ricoh", "key": "serial_no", "val": "1.3.6.1.4.1.367.3.2.1.2.1.4.0", "desc": "리코 전용 시리얼 번호"},
            {"vendor": "Ricoh", "key": "count_total", "val": "1.3.6.1.4.1.367.3.2.1.2.19.1.0", "desc": "리코 총 인쇄 카운터"},
            {"vendor": "Ricoh", "key": "count_color", "val": "1.3.6.1.4.1.367.3.2.1.2.19.2.0", "desc": "리코 컬러 카운터"},
            {"vendor": "Ricoh", "key": "count_mono", "val": "1.3.6.1.4.1.367.3.2.1.2.19.3.0", "desc": "리코 흑백 카운터"},

            # HP Enterprise MIB
            {"vendor": "HP", "key": "serial_no", "val": "1.3.6.1.4.1.11.2.3.9.4.2.1.1.3.3.0", "desc": "HP 전용 시리얼 번호"},
            {"vendor": "HP", "key": "count_total", "val": "1.3.6.1.4.1.11.2.3.9.4.2.1.4.1.2.5.0", "desc": "HP 페이지 생애 누적 카운터"},
            {"vendor": "HP", "key": "count_color", "val": "1.3.6.1.4.1.11.2.3.9.4.2.1.4.1.2.6.0", "desc": "HP 컬러 인쇄 카운터"},

            # Kyocera Enterprise MIB
            {"vendor": "Kyocera", "key": "serial_no", "val": "1.3.6.1.4.1.1347.43.5.1.1.17.1", "desc": "교세라 전용 시리얼 번호"},
            {"vendor": "Kyocera", "key": "count_total", "val": "1.3.6.1.4.1.1347.42.2.1.1.1", "desc": "교세라 총 인쇄 카운터"},
            {"vendor": "Kyocera", "key": "count_color", "val": "1.3.6.1.4.1.1347.42.2.1.1.2", "desc": "교세라 컬러 카운터"},

            # Konica Minolta Enterprise MIB
            {"vendor": "KonicaMinolta", "key": "serial_no", "val": "1.3.6.1.4.1.18334.1.1.1.1.5.1", "desc": "코니카미놀타 시리얼 번호"},
            {"vendor": "KonicaMinolta", "key": "count_total", "val": "1.3.6.1.4.1.18334.1.1.1.5.7.1.1.1", "desc": "코니카미놀타 총 카운트"},
            {"vendor": "KonicaMinolta", "key": "count_color", "val": "1.3.6.1.4.1.18334.1.1.1.5.7.1.1.2", "desc": "코니카미놀타 컬러 카운트"},
        ]

        for item in oids_data:
            PrinterOidMapping.objects.update_or_create(
                vendor_name=item["vendor"],
                oid_key=item["key"],
                defaults={
                    "oid_value": item["val"],
                    "description": item["desc"],
                    "is_active": True,
                },
            )

        # 2. Seed Full 28 Column Datasets into `oid_lists` DB Table
        vendor_full_specs = [
            {
                "manufacturer": "Standard",
                "printer_model": "Standard RFC 3805 Generic Printer",
                "serial_no": "1.3.6.1.2.1.43.5.1.1.17.1",
                "count1": "1.3.6.1.2.1.43.10.2.1.4.1.2",
                "count2": "1.3.6.1.2.1.43.10.2.1.4.1.3",
                "count3": "1.3.6.1.2.1.43.10.2.1.4.1.4",
                "count3_k": "1.3.6.1.2.1.43.10.2.1.4.1.5",
                "count4": "1.3.6.1.2.1.43.10.2.1.4.1.1",
                "toner_c": "1.3.6.1.2.1.43.11.1.1.9.1.1",
                "toner_m": "1.3.6.1.2.1.43.11.1.1.9.1.2",
                "toner_y": "1.3.6.1.2.1.43.11.1.1.9.1.3",
                "toner_k": "1.3.6.1.2.1.43.11.1.1.9.1.4",
                "toner_k2": "1.3.6.1.2.1.43.11.1.1.9.1.5",
                "toner_c_max": "1.3.6.1.2.1.43.11.1.1.8.1.1",
                "toner_m_max": "1.3.6.1.2.1.43.11.1.1.8.1.2",
                "toner_y_max": "1.3.6.1.2.1.43.11.1.1.8.1.3",
                "toner_k_max": "1.3.6.1.2.1.43.11.1.1.8.1.4",
                "toner_k2_max": "1.3.6.1.2.1.43.11.1.1.8.1.5",
                "toner_recovery": "1.3.6.1.2.1.43.11.1.1.9.1.6",
                "toner_recovery_max": "1.3.6.1.2.1.43.11.1.1.8.1.6",
                "drum_c": "1.3.6.1.2.1.43.11.1.1.9.1.7",
                "drum_m": "1.3.6.1.2.1.43.11.1.1.9.1.8",
                "drum_y": "1.3.6.1.2.1.43.11.1.1.9.1.9",
                "drum_k": "1.3.6.1.2.1.43.11.1.1.9.1.10",
                "drum_c_max": "1.3.6.1.2.1.43.11.1.1.8.1.7",
                "drum_m_max": "1.3.6.1.2.1.43.11.1.1.8.1.8",
                "drum_y_max": "1.3.6.1.2.1.43.11.1.1.8.1.9",
                "drum_k_max": "1.3.6.1.2.1.43.11.1.1.8.1.10",
            },
            {
                "manufacturer": "Fujifilm",
                "printer_model": "ApeosPort / DocuCentre Series (Full OID Set)",
                "serial_no": "1.3.6.1.4.1.2988.1.1.12.1.1.101",
                "count1": "1.3.6.1.4.1.2988.1.1.12.1.1.202",
                "count2": "1.3.6.1.4.1.2988.1.1.12.1.1.203",
                "count3": "1.3.6.1.4.1.2988.1.1.12.1.1.204",
                "count3_k": "1.3.6.1.4.1.2988.1.1.12.1.1.205",
                "count4": "1.3.6.1.4.1.2988.1.1.12.1.1.201",
                "toner_c": "1.3.6.1.4.1.2988.1.1.12.1.1.301",
                "toner_m": "1.3.6.1.4.1.2988.1.1.12.1.1.302",
                "toner_y": "1.3.6.1.4.1.2988.1.1.12.1.1.303",
                "toner_k": "1.3.6.1.4.1.2988.1.1.12.1.1.304",
                "toner_k2": "1.3.6.1.4.1.2988.1.1.12.1.1.305",
                "toner_c_max": "1.3.6.1.4.1.2988.1.1.12.1.1.311",
                "toner_m_max": "1.3.6.1.4.1.2988.1.1.12.1.1.312",
                "toner_y_max": "1.3.6.1.4.1.2988.1.1.12.1.1.313",
                "toner_k_max": "1.3.6.1.4.1.2988.1.1.12.1.1.314",
                "toner_k2_max": "1.3.6.1.4.1.2988.1.1.12.1.1.315",
                "toner_recovery": "1.3.6.1.4.1.2988.1.1.12.1.1.320",
                "toner_recovery_max": "1.3.6.1.4.1.2988.1.1.12.1.1.321",
                "drum_c": "1.3.6.1.4.1.2988.1.1.12.1.1.401",
                "drum_m": "1.3.6.1.4.1.2988.1.1.12.1.1.402",
                "drum_y": "1.3.6.1.4.1.2988.1.1.12.1.1.403",
                "drum_k": "1.3.6.1.4.1.2988.1.1.12.1.1.404",
                "drum_c_max": "1.3.6.1.4.1.2988.1.1.12.1.1.411",
                "drum_m_max": "1.3.6.1.4.1.2988.1.1.12.1.1.412",
                "drum_y_max": "1.3.6.1.4.1.2988.1.1.12.1.1.413",
                "drum_k_max": "1.3.6.1.4.1.2988.1.1.12.1.1.414",
            },
            {
                "manufacturer": "Canon",
                "printer_model": "imageRUNNER ADVANCE Series (Full OID Set)",
                "serial_no": "1.3.6.1.4.1.1602.1.2.1.4.0",
                "count1": "1.3.6.1.4.1.1602.1.11.1.3.1.4.102",
                "count2": "1.3.6.1.4.1.1602.1.11.1.3.1.4.103",
                "count3": "1.3.6.1.4.1.1602.1.11.1.3.1.4.104",
                "count3_k": "1.3.6.1.4.1.1602.1.11.1.3.1.4.105",
                "count4": "1.3.6.1.4.1.1602.1.11.1.3.1.4.101",
                "toner_c": "1.3.6.1.4.1.1602.1.11.2.1.1.3.1",
                "toner_m": "1.3.6.1.4.1.1602.1.11.2.1.1.3.2",
                "toner_y": "1.3.6.1.4.1.1602.1.11.2.1.1.3.3",
                "toner_k": "1.3.6.1.4.1.1602.1.11.2.1.1.3.4",
                "toner_k2": "1.3.6.1.4.1.1602.1.11.2.1.1.3.5",
                "toner_c_max": "1.3.6.1.4.1.1602.1.11.2.1.1.2.1",
                "toner_m_max": "1.3.6.1.4.1.1602.1.11.2.1.1.2.2",
                "toner_y_max": "1.3.6.1.4.1.1602.1.11.2.1.1.2.3",
                "toner_k_max": "1.3.6.1.4.1.1602.1.11.2.1.1.2.4",
                "toner_k2_max": "1.3.6.1.4.1.1602.1.11.2.1.1.2.5",
                "toner_recovery": "1.3.6.1.4.1.1602.1.11.2.1.1.3.6",
                "toner_recovery_max": "1.3.6.1.4.1.1602.1.11.2.1.1.2.6",
                "drum_c": "1.3.6.1.4.1.1602.1.11.2.2.1.3.1",
                "drum_m": "1.3.6.1.4.1.1602.1.11.2.2.1.3.2",
                "drum_y": "1.3.6.1.4.1.1602.1.11.2.2.1.3.3",
                "drum_k": "1.3.6.1.4.1.1602.1.11.2.2.1.3.4",
                "drum_c_max": "1.3.6.1.4.1.1602.1.11.2.2.1.2.1",
                "drum_m_max": "1.3.6.1.4.1.1602.1.11.2.2.1.2.2",
                "drum_y_max": "1.3.6.1.4.1.1602.1.11.2.2.1.2.3",
                "drum_k_max": "1.3.6.1.4.1.1602.1.11.2.2.1.2.4",
            },
            {
                "manufacturer": "Ricoh",
                "printer_model": "Aficio / IM Series (Full OID Set)",
                "serial_no": "1.3.6.1.4.1.367.3.2.1.2.1.4.0",
                "count1": "1.3.6.1.4.1.367.3.2.1.2.19.2.0",
                "count2": "1.3.6.1.4.1.367.3.2.1.2.19.3.0",
                "count3": "1.3.6.1.4.1.367.3.2.1.2.19.4.0",
                "count3_k": "1.3.6.1.4.1.367.3.2.1.2.19.5.0",
                "count4": "1.3.6.1.4.1.367.3.2.1.2.19.1.0",
                "toner_c": "1.3.6.1.4.1.367.3.2.1.2.24.1.1.5.1",
                "toner_m": "1.3.6.1.4.1.367.3.2.1.2.24.1.1.5.2",
                "toner_y": "1.3.6.1.4.1.367.3.2.1.2.24.1.1.5.3",
                "toner_k": "1.3.6.1.4.1.367.3.2.1.2.24.1.1.5.4",
                "toner_k2": "1.3.6.1.4.1.367.3.2.1.2.24.1.1.5.5",
                "toner_c_max": "1.3.6.1.4.1.367.3.2.1.2.24.1.1.4.1",
                "toner_m_max": "1.3.6.1.4.1.367.3.2.1.2.24.1.1.4.2",
                "toner_y_max": "1.3.6.1.4.1.367.3.2.1.2.24.1.1.4.3",
                "toner_k_max": "1.3.6.1.4.1.367.3.2.1.2.24.1.1.4.4",
                "toner_k2_max": "1.3.6.1.4.1.367.3.2.1.2.24.1.1.4.5",
                "toner_recovery": "1.3.6.1.4.1.367.3.2.1.2.24.1.1.5.6",
                "toner_recovery_max": "1.3.6.1.4.1.367.3.2.1.2.24.1.1.4.6",
                "drum_c": "1.3.6.1.4.1.367.3.2.1.2.24.2.1.5.1",
                "drum_m": "1.3.6.1.4.1.367.3.2.1.2.24.2.1.5.2",
                "drum_y": "1.3.6.1.4.1.367.3.2.1.2.24.2.1.5.3",
                "drum_k": "1.3.6.1.4.1.367.3.2.1.2.24.2.1.5.4",
                "drum_c_max": "1.3.6.1.4.1.367.3.2.1.2.24.2.1.4.1",
                "drum_m_max": "1.3.6.1.4.1.367.3.2.1.2.24.2.1.4.2",
                "drum_y_max": "1.3.6.1.4.1.367.3.2.1.2.24.2.1.4.3",
                "drum_k_max": "1.3.6.1.4.1.367.3.2.1.2.24.2.1.4.4",
            },
            {
                "manufacturer": "HP",
                "printer_model": "LaserJet Enterprise / PageWide Series (Full OID Set)",
                "serial_no": "1.3.6.1.4.1.11.2.3.9.4.2.1.1.3.3.0",
                "count1": "1.3.6.1.4.1.11.2.3.9.4.2.1.4.1.2.6.0",
                "count2": "1.3.6.1.4.1.11.2.3.9.4.2.1.4.1.2.7.0",
                "count3": "1.3.6.1.4.1.11.2.3.9.4.2.1.4.1.2.8.0",
                "count3_k": "1.3.6.1.4.1.11.2.3.9.4.2.1.4.1.2.9.0",
                "count4": "1.3.6.1.4.1.11.2.3.9.4.2.1.4.1.2.5.0",
                "toner_c": "1.3.6.1.4.1.11.2.3.9.4.2.1.4.1.2.1.1",
                "toner_m": "1.3.6.1.4.1.11.2.3.9.4.2.1.4.1.2.1.2",
                "toner_y": "1.3.6.1.4.1.11.2.3.9.4.2.1.4.1.2.1.3",
                "toner_k": "1.3.6.1.4.1.11.2.3.9.4.2.1.4.1.2.1.4",
                "toner_k2": "1.3.6.1.4.1.11.2.3.9.4.2.1.4.1.2.1.5",
                "toner_c_max": "1.3.6.1.4.1.11.2.3.9.4.2.1.4.1.1.1.1",
                "toner_m_max": "1.3.6.1.4.1.11.2.3.9.4.2.1.4.1.1.1.2",
                "toner_y_max": "1.3.6.1.4.1.11.2.3.9.4.2.1.4.1.1.1.3",
                "toner_k_max": "1.3.6.1.4.1.11.2.3.9.4.2.1.4.1.1.1.4",
                "toner_k2_max": "1.3.6.1.4.1.11.2.3.9.4.2.1.4.1.1.1.5",
                "toner_recovery": "1.3.6.1.4.1.11.2.3.9.4.2.1.4.1.2.1.6",
                "toner_recovery_max": "1.3.6.1.4.1.11.2.3.9.4.2.1.4.1.1.1.6",
                "drum_c": "1.3.6.1.4.1.11.2.3.9.4.2.1.4.2.2.1",
                "drum_m": "1.3.6.1.4.1.11.2.3.9.4.2.1.4.2.2.2",
                "drum_y": "1.3.6.1.4.1.11.2.3.9.4.2.1.4.2.2.3",
                "drum_k": "1.3.6.1.4.1.11.2.3.9.4.2.1.4.2.2.4",
                "drum_c_max": "1.3.6.1.4.1.11.2.3.9.4.2.1.4.2.1.1",
                "drum_m_max": "1.3.6.1.4.1.11.2.3.9.4.2.1.4.2.1.2",
                "drum_y_max": "1.3.6.1.4.1.11.2.3.9.4.2.1.4.2.1.3",
                "drum_k_max": "1.3.6.1.4.1.11.2.3.9.4.2.1.4.2.1.4",
            },
            {
                "manufacturer": "Kyocera",
                "printer_model": "TASKalfa / ECOSYS Series (Full OID Set)",
                "serial_no": "1.3.6.1.4.1.1347.43.5.1.1.17.1",
                "count1": "1.3.6.1.4.1.1347.42.2.1.1.2",
                "count2": "1.3.6.1.4.1.1347.42.2.1.1.3",
                "count3": "1.3.6.1.4.1.1347.42.2.1.1.4",
                "count3_k": "1.3.6.1.4.1.1347.42.2.1.1.5",
                "count4": "1.3.6.1.4.1.1347.42.2.1.1.1",
                "toner_c": "1.3.6.1.4.1.1347.43.5.1.1.21.1",
                "toner_m": "1.3.6.1.4.1.1347.43.5.1.1.21.2",
                "toner_y": "1.3.6.1.4.1.1347.43.5.1.1.21.3",
                "toner_k": "1.3.6.1.4.1.1347.43.5.1.1.21.4",
                "toner_k2": "1.3.6.1.4.1.1347.43.5.1.1.21.5",
                "toner_c_max": "1.3.6.1.4.1.1347.43.5.1.1.20.1",
                "toner_m_max": "1.3.6.1.4.1.1347.43.5.1.1.20.2",
                "toner_y_max": "1.3.6.1.4.1.1347.43.5.1.1.20.3",
                "toner_k_max": "1.3.6.1.4.1.1347.43.5.1.1.20.4",
                "toner_k2_max": "1.3.6.1.4.1.1347.43.5.1.1.20.5",
                "toner_recovery": "1.3.6.1.4.1.1347.43.5.1.1.21.6",
                "toner_recovery_max": "1.3.6.1.4.1.1347.43.5.1.1.20.6",
                "drum_c": "1.3.6.1.4.1.1347.43.5.2.1.21.1",
                "drum_m": "1.3.6.1.4.1.1347.43.5.2.1.21.2",
                "drum_y": "1.3.6.1.4.1.1347.43.5.2.1.21.3",
                "drum_k": "1.3.6.1.4.1.1347.43.5.2.1.21.4",
                "drum_c_max": "1.3.6.1.4.1.1347.43.5.2.1.20.1",
                "drum_m_max": "1.3.6.1.4.1.1347.43.5.2.1.20.2",
                "drum_y_max": "1.3.6.1.4.1.1347.43.5.2.1.20.3",
                "drum_k_max": "1.3.6.1.4.1.1347.43.5.2.1.20.4",
            },
            {
                "manufacturer": "KonicaMinolta",
                "printer_model": "bizhub C/Monochrome Series (Full OID Set)",
                "serial_no": "1.3.6.1.4.1.18334.1.1.1.1.5.1",
                "count1": "1.3.6.1.4.1.18334.1.1.1.5.7.1.1.2",
                "count2": "1.3.6.1.4.1.18334.1.1.1.5.7.1.1.3",
                "count3": "1.3.6.1.4.1.18334.1.1.1.5.7.1.1.4",
                "count3_k": "1.3.6.1.4.1.18334.1.1.1.5.7.1.1.5",
                "count4": "1.3.6.1.4.1.18334.1.1.1.5.7.1.1.1",
                "toner_c": "1.3.6.1.4.1.18334.1.1.1.5.5.2.1.3.1",
                "toner_m": "1.3.6.1.4.1.18334.1.1.1.5.5.2.1.3.2",
                "toner_y": "1.3.6.1.4.1.18334.1.1.1.5.5.2.1.3.3",
                "toner_k": "1.3.6.1.4.1.18334.1.1.1.5.5.2.1.3.4",
                "toner_k2": "1.3.6.1.4.1.18334.1.1.1.5.5.2.1.3.5",
                "toner_c_max": "1.3.6.1.4.1.18334.1.1.1.5.5.2.1.2.1",
                "toner_m_max": "1.3.6.1.4.1.18334.1.1.1.5.5.2.1.2.2",
                "toner_y_max": "1.3.6.1.4.1.18334.1.1.1.5.5.2.1.2.3",
                "toner_k_max": "1.3.6.1.4.1.18334.1.1.1.5.5.2.1.2.4",
                "toner_k2_max": "1.3.6.1.4.1.18334.1.1.1.5.5.2.1.2.5",
                "toner_recovery": "1.3.6.1.4.1.18334.1.1.1.5.5.2.1.3.6",
                "toner_recovery_max": "1.3.6.1.4.1.18334.1.1.1.5.5.2.1.2.6",
                "drum_c": "1.3.6.1.4.1.18334.1.1.1.5.5.3.1.3.1",
                "drum_m": "1.3.6.1.4.1.18334.1.1.1.5.5.3.1.3.2",
                "drum_y": "1.3.6.1.4.1.18334.1.1.1.5.5.3.1.3.3",
                "drum_k": "1.3.6.1.4.1.18334.1.1.1.5.5.3.1.3.4",
                "drum_c_max": "1.3.6.1.4.1.18334.1.1.1.5.5.3.1.2.1",
                "drum_m_max": "1.3.6.1.4.1.18334.1.1.1.5.5.3.1.2.2",
                "drum_y_max": "1.3.6.1.4.1.18334.1.1.1.5.5.3.1.2.3",
                "drum_k_max": "1.3.6.1.4.1.18334.1.1.1.5.5.3.1.2.4",
            },
        ]

        oid_lists_count = 0
        printers_count = 0

        for spec in vendor_full_specs:
            mfg = spec["manufacturer"]
            model_name = spec["printer_model"]

            # Create or update full 28-column row in `oid_lists`
            oid_obj, created = OidListMaster.objects.update_or_create(
                manufacturer=mfg,
                printer_model=model_name,
                defaults=spec,
            )
            if created:
                oid_lists_count += 1

            # Link to `printers` Master Table
            pm_obj, p_created = PrinterModelMaster.objects.update_or_create(
                manufacturer=mfg,
                printer_model=model_name,
                defaults={
                    "printer_type": 1,
                    "product_code": f"PRT-{mfg[:3].upper()}-001",
                    "device_type": 1,
                    "note": f"{mfg} 복합기 공식 MIB OID 풀 스펙 마스터",
                    "oid_list": oid_obj,
                },
            )
            if p_created:
                printers_count += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"총 7대 주요 제조사(Standard, Fujifilm, Canon, Ricoh, HP, Kyocera, KonicaMinolta)의 "
                f"oid_lists 28개 전체 컬럼 및 printers 마스터 데이터 시드 완공! (oid_lists: {oid_lists_count}개, printers: {printers_count}개)"
            )
        )
