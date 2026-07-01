@echo off
echo ============================================
echo    PUBLIART - Apagando Sistema
echo ============================================
echo.
echo Deteniendo procesos en segundo plano...
call pm2 stop all
echo Procesos detenidos.
echo.
echo (Esta ventana se cerrara en 3 segundos)
timeout /t 3 >nul
