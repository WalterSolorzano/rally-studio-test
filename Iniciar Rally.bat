@echo off
REM Rally Studio - arranque rapido en Windows (doble clic)
REM Levanta el servicio local en el puerto 8000 y abre el panel.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0iniciar_rally.ps1"
start "" http://localhost:8000/dashboard/
