@echo off
echo Starting Apex Institute School Management Portal...
echo.
echo [1/2] Starting backend server (port 5000)...
start "Backend" cmd /k "cd backend && npm run dev"
timeout /t 2 >nul
echo [2/2] Starting frontend dev server (port 5173)...
start "Frontend" cmd /k "cd frontend && npm run dev"
echo.
echo Both servers are starting. Visit http://localhost:5173
