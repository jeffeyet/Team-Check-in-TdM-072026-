@echo off
rem Doble clic a este archivo para corregir el correo de tu configuracion.
if not exist "%~dp0lib\corregir-correo-github.ps1" (
  echo.
  echo Primero descomprime el ZIP completo: clic derecho al archivo .zip,
  echo "Extraer todo...", y luego abre este archivo desde la carpeta extraida.
  echo.
  pause
  exit /b 1
)
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0lib\corregir-correo-github.ps1"
if errorlevel 1 pause
