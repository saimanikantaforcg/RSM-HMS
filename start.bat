@echo off
SET ROOT=C:\Users\SARAGI\.gemini\antigravity\scratch\next-gen-hms

echo 🏥 RSM HMS — Super-Start Script (Zero-Config)
echo ==============================================

:: 1. Setup Backend environment for SQLite
echo [1/4] Configuring environment for SQLite...
cd /d "%ROOT%\services\clinical-service"
(
echo NODE_ENV=development
echo PORT=3001
echo DB_TYPE=sqlite
echo JWT_SECRET=dev-secret-123
echo JWT_REFRESH_SECRET=dev-refresh-secret-123
echo COOKIE_SECRET=dev-cookie-secret-123
echo FRONTEND_URL=http://localhost:5173
) > .env

:: 2. Check for node_modules
if not exist "node_modules" (
    echo [!] node_modules missing. Running npm install...
    call npm install
)

:: 3. Start Backend in a new window
echo [2/4] Launching Backend (Clinical Service)...
start "HMS BACKEND" cmd /k "cd /d %ROOT%\services\clinical-service && title HMS BACKEND && npm run start:dev"

:: 4. Start Frontend in a new window
echo [3/4] Launching Frontend (Vite)...
cd /d "%ROOT%\frontend"
if not exist "node_modules" (
    echo [!] node_modules missing. Running npm install...
    call npm install
)
start "HMS FRONTEND" cmd /k "cd /d %ROOT%\frontend && title HMS FRONTEND && npm run dev"

echo.
echo ==============================================
echo ✅ Startup sequence initiated!
echo.
echo ⏳ PLEASE WAIT 15 SECONDS for backend to boot.
echo.
echo 🩺 Health Checks:
echo    Backend: http://localhost:3001/api/v1/health (Should return {"status":"up"})
echo    Swagger: http://localhost:3001/api/docs
echo.
echo 🔑 Step 1: Visit http://localhost:3001/api/v1/auth/seed
echo    (This creates your admin user in the local database)
echo.
echo 🖥️ Step 2: Visit http://localhost:5173
echo.
echo 🛑 To Stop: Close the "HMS BACKEND" and "HMS FRONTEND" terminal windows.
echo.
echo 🚀 Next Steps: To run in Production, read STARTUP_PROD.md
echo ==============================================
pause
