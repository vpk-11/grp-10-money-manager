@echo off
REM Money Manager - Windows setup launcher (BAT)
REM This wrapper runs the PowerShell setup script with required execution policy.

setlocal ENABLEDELAYEDEXPANSION

set SCRIPT=%~dp0setup-windows.ps1

if not exist "%SCRIPT%" (
  echo setup-windows.ps1 not found next to this BAT. Exiting.
  exit /b 1
)

REM Elevate if not admin
net session >nul 2>&1
if %errorlevel% neq 0 (
  echo Requesting Administrator privileges...
  powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Process -Verb RunAs cmd -ArgumentList '/c \"%~f0\"'"
  exit /b 0
)

REM Run PowerShell script
powershell -NoProfile -ExecutionPolicy Bypass -File "%SCRIPT%"

endlocal
