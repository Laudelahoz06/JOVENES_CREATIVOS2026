@echo off
REM Inicia backend, frontend y ngrok en ventanas independientes.
REM Cerrar esta session o la ventana principal NO los apaga.

start "Magical - Backend" cmd /k "cd /d %~dp0magical-books-cafe\backend && npm run dev"
timeout /t 5 /nobreak >nul

start "Magical - Frontend" cmd /k "cd /d %~dp0magical-books-cafe\frontend && npm run dev"
timeout /t 3 /nobreak >nul

start "Magical - Ngrok" cmd /k "ngrok start --all"

echo Servicios iniciados en ventanas separadas. Puedes cerrar esta ventana.
timeout /t 5 >nul
