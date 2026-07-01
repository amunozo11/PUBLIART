@echo off
echo ============================================
echo    PUBLIART - Encendiendo Sistema Oculto
echo ============================================
echo.
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo Este script necesita ejecutarse como Administrador.
    echo Haz clic derecho y selecciona "Ejecutar como administrador"
    pause
    exit /b 1
)

cd /d "C:\Users\Alex\Desktop\PUBLIART"

echo Iniciando MongoDB...
net start MongoDB >nul 2>&1
if %errorLevel% neq 0 (
    start "" "C:\Program Files\MongoDB\Server\8.0\bin\mongod.exe" --config "C:\Program Files\MongoDB\Server\8.0\bin\mongod.cfg"
)

echo.
echo Iniciando Procesos en Segundo Plano con PM2...
call pm2 start ecosystem.config.cjs
call pm2 save

echo.
echo ============================================
echo   SISTEMA PUBLIART INICIADO Y OCULTO
echo ============================================
echo Backend:  http://localhost:5000
echo Frontend: http://localhost:5173
echo.
echo Para abrir desde OTROS PCs en la misma red:
echo 1. Abre otra consola y escribe: ipconfig
echo 2. Busca la "Direccion IPv4" (ej. 192.168.1.15)
echo 3. En la otra PC entra a: http://[TU_IP_AQUI]:5173
echo.
echo (Esta ventana se cerrara en 5 segundos)
timeout /t 5 >nul
