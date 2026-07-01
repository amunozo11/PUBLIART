@echo off
echo ============================================
echo    PUBLIART - Apagando Sistema
echo ============================================
echo.

net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [ALERTA] PM2 necesita ejecutarse como Administrador.
    echo Por favor cierra esta ventana, haz clic derecho en APAGAR-SISTEMA.bat 
    echo y selecciona "Ejecutar como administrador".
    pause
    exit /b 1
)

cd /d "C:\Users\Alex\Desktop\PUBLIART"
echo Deteniendo procesos en segundo plano...
call pm2 delete all
call pm2 save --force
echo Procesos detenidos.
echo.
echo (Esta ventana se cerrara en 3 segundos)
timeout /t 3 >nul
