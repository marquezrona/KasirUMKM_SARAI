@echo off
title Menjalankan Kasir UMKM Sabu Raijua
color 0A

echo ========================================================
echo    MENJALANKAN SISTEM KASIR UMKM SABU RAIJUA (HAWUPAY)
echo ========================================================
echo.

REM 1. Cek Port 3306 (MySQL Laragon)
powershell -Command "$s = New-Object Net.Sockets.TcpClient; try { $s.Connect('127.0.0.1', 3306); Write-Host ' [OK] MySQL Laragon aktif di port 3306' -ForegroundColor Green } catch { Write-Host ' [PERINGATAN] MySQL port 3306 belum aktif! Pastikan Laragon sudah di-Start All.' -ForegroundColor Yellow } finally { $s.Close() }"

echo.
echo [1/3] Menjalankan Backend (FastAPI di http://127.0.0.1:8001)...
start "Backend Kasir UMKM (FastAPI :8001)" cmd /c "cd /d "%~dp0backend" && call .\.venv\Scripts\activate.bat && python -m uvicorn server:app --host 127.0.0.1 --port 8001 --reload"

echo [2/3] Menjalankan Frontend (Vite di http://localhost:5173)...
start "Frontend Kasir UMKM (Vite :5173)" cmd /c "cd /d "%~dp0frontend" && npm run dev"

echo [3/3] Membuka halaman login di browser...
timeout /t 3 /nobreak >nul
start http://localhost:5173/login

echo.
echo ========================================================
echo  APLIKASI BERHASIL DIJALANKAN!
echo  - Frontend : http://localhost:5173/login
echo  - Backend  : http://127.0.0.1:8001
echo.
echo  Akun Admin: admin@umkm.id  (Password: admin123)
echo ========================================================
echo.
pause
