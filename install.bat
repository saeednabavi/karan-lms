@echo off
chcp 65001 >nul
echo ========== Installing Kran-e-Bala LMS ==========

cd /d "%~dp0backend"
if not exist ".env" (
    echo Creating .env from .env.example...
    copy /Y .env.example .env
    echo.
    echo PostgreSQL setup:
    echo   1. Install PostgreSQL and start the service
    echo   2. Edit backend\.env — set DATABASE_URL password
    echo   3. Create database: psql -U postgres -c "CREATE DATABASE lms;"
    echo   4. Run Seed.bat to migrate and seed data
    echo.
)

if not exist "venv" (
    echo Creating Python virtual environment...
    python -m venv venv
    if errorlevel 1 (
        echo ERROR: Failed to create venv. Make sure Python is installed.
        pause
        exit /b 1
    )
)

echo Activating backend venv and installing packages...
call venv\Scripts\activate.bat
pip install -r requirements.txt
if errorlevel 1 (
    echo ERROR: Failed to install backend packages.
    pause
    exit /b 1
)
cd ..

cd /d "%~dp0frontend"
if not exist "node_modules" (
    call npm install
) else (
    call npm install
)
if errorlevel 1 (
    echo ERROR: Failed to install frontend packages.
    pause
    exit /b 1
)
cd ..

echo.
echo ========== Install completed. ==========
echo Next steps:
echo   1. Edit backend\.env with your PostgreSQL password
echo   2. psql -U postgres -c "CREATE DATABASE lms;"
echo   3. Run Seed.bat
echo   4. Run run.bat
pause
