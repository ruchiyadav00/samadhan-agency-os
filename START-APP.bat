@echo off
echo ==========================================
echo   Samadhan Agency OS - Starting All...
echo ==========================================
echo.
echo Opening Backend (port 3001)...
start "Samadhan Backend" cmd /k "cd /d "%~dp0backend" && npm install && npm start"

timeout /t 3 /nobreak >nul

echo Opening Frontend (port 5173)...
start "Samadhan Frontend" cmd /k "cd /d "%~dp0frontend" && npm install && npm run dev"

echo.
echo Both servers starting in separate windows.
echo Once ready, open: http://localhost:5173
echo Login: admin / admin123
echo.
