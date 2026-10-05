@echo off
title Menghentikan Kasir UMKM
color 0C

echo Menghentikan server backend (port 8001) dan frontend (port 5173)...

powershell -Command "Get-NetTCPConnection -LocalPort 8001, 5173 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }"

echo Server telah dihentikan.
pause
