@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo Starting Kran-e-Bala LMS...
echo.
echo NOTE: PostgreSQL must be running and backend\.env must be configured.
echo       Run Seed.bat first if database is empty.
echo.
echo Backend:  http://localhost:5000
echo Frontend: http://localhost:5173
echo.

start "Backend - Kran-e-Bala" cmd /k "cd /d %~dp0backend && venv\Scripts\activate.bat && python run.py"

timeout /t 2 /nobreak >nul

start "Frontend - Kran-e-Bala" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo Both servers starting in separate windows.
echo Open http://localhost:5173 in your browser.
pause
