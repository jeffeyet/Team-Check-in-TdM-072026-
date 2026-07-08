@echo off
rem Doble clic a este archivo para configurar tu conexion con GitHub.
rem Si Windows muestra "Windows protegio tu PC": clic en "Mas informacion"
rem y luego en "Ejecutar de todas formas".
if not exist "%~dp0lib\configurar-github-ssh.ps1" (
  echo.
  echo Primero descomprime el ZIP completo: clic derecho al archivo .zip,
  echo "Extraer todo...", y luego abre este archivo desde la carpeta extraida.
  echo.
  pause
  exit /b 1
)
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0lib\configurar-github-ssh.ps1"
if errorlevel 1 pause
