@echo off
chcp 65001 >nul
cd /d "%~dp0backend"

if not exist "venv\Scripts\activate.bat" (
    echo ERROR: venv not found. Run install.bat first.
    pause
    exit /b 1
)

call venv\Scripts\activate.bat
set FLASK_APP=run:app
set PYTHONIOENCODING=utf-8

if not exist ".env" (
    echo Creating .env from .env.example...
    copy /Y .env.example .env
    echo.
    echo IMPORTANT: Edit backend\.env and set your PostgreSQL password in DATABASE_URL
    echo Example: DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/lms
    echo.
    pause
)

echo.
echo [1/4] Testing PostgreSQL connection...
python check_db.py
if errorlevel 1 (
    echo.
    echo Fix PostgreSQL connection then run Seed.bat again.
    echo Create database: psql -U postgres -c "CREATE DATABASE lms;"
    pause
    exit /b 1
)

echo.
echo [2/4] Applying migrations...
flask db upgrade
if errorlevel 1 (
    echo ERROR: Migration failed.
    pause
    exit /b 1
)

echo.
echo [3/4] Seeding database (rich demo data + refresh images)...
flask seed --refresh
if errorlevel 1 (
    echo ERROR: Seed failed.
    pause
    exit /b 1
)

echo.
echo [4/4] Done! Run run.bat to start the app.
echo Open http://localhost:5173
pause
