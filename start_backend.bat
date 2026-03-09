@echo off
echo Starting Jazline Backend Server...
start cmd /k "cd backend && python -m uvicorn server:app --reload --port 8001"

echo Waiting for server to start...
timeout /t 5

echo Starting LocalTunnel on port 8001 with subdomain jazline-api...
start cmd /k "npx localtunnel --port 8001 --subdomain jazline-api"

echo.
echo All services started!
echo Your frontend connects to: https://jazline-api.loca.lt/api
echo.
echo Please leave these terminal windows open while testing the app.
pause
