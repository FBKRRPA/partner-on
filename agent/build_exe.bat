@echo off
echo ============================================================
echo   PartnerOn Windows Agent Exe Packager (PyInstaller)
echo ============================================================

pip install pyinstaller pywin32

pyinstaller --noconfirm --onedir --console --name "PartneronAgent" ^
    --add-data "config_manager.py;." ^
    --add-data "snmp_scanner.py;." ^
    --add-data "api_client.py;." ^
    main.py

echo.
echo ============================================================
echo   [SUCCESS] PartneronAgent.exe Packaged in dist/PartneronAgent/
echo ============================================================
pause
