@echo off
title Samadhan Backend (port 3001)
cd /d "%~dp0backend"
echo Installing dependencies...
call npm install
echo.
echo Starting backend server...
npm start
pause
