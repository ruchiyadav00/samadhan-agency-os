@echo off
title Samadhan Frontend (port 5173)
cd /d "%~dp0frontend"
echo Installing dependencies...
call npm install
echo.
echo Starting frontend dev server...
npm run dev
pause
