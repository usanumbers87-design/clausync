@echo off
REM ============================================================
REM ClauSync - Session Bundler
REM ============================================================
REM This script builds the ClauSync installer with a pre-authenticated
REM session bundled inside. Run this after re-authenticating to create
REM a client-ready installer.
REM
REM Usage:
REM   1. Re-authenticate your Telegram account on this machine
REM      (via administering tool or direct login)
REM   2. Run this script
REM   3. The resulting installer at dist\*.exe will have the session
REM      pre-bundled and ready for clients
REM
REM Prerequisites:
REM   - Node.js / npm installed
REM   - Rust / Cargo installed
REM   - ClauSync repo at C:\Users\admin\Desktop\clausync
REM ============================================================

setlocal enabledelayedexpansion

set REPO_DIR=C:\Users\admin\Desktop\clausync
set APP_DIR=%REPO_DIR%\app
set SESSION_SRC=%APPDATA%\com.darkinlife71.clausync\telegram.session
set SESSION_DST=%APP_DIR%\src-tauri\src\session_payload.bin
set EXTRA_DIR=C:\Users\admin\Desktop\ClauSync

echo ========================================
echo  ClauSync Session Bundler
echo ========================================

if not exist "%SESSION_SRC%" (
    echo [!] Session not found at %SESSION_SRC%
    exit /b 1
)

echo [*] Copying session to source tree...
copy /Y "%SESSION_SRC%" "%SESSION_DST%" >nul
echo     -> %SESSION_DST%

echo [*] Building installer...
set PATH=C:\Users\admin\.cargo\bin;%PATH%
cd /d "%APP_DIR%"
call npx tauri build 2>&1

copy /Y "%APP_DIR%\src-tauri\target\release\bundle\nsis\ClauSync_1.0.0_x64-setup.exe" "%EXTRA_DIR%\ClauSync_Latest_x64-setup.exe" >nul

echo [*] Done! Saved to %EXTRA_DIR%\ClauSync_Latest_x64-setup.exe
