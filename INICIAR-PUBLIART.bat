@echo off
echo ============================================
echo    PUBLIART - Iniciando MongoDB
echo ============================================
echo.
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo Este script necesita ejecutarse como Administrador.
    echo Haz clic derecho y selecciona "Ejecutar como administrador"
    pause
    exit /b 1
)

echo Iniciando servicio MongoDB...
net start MongoDB
if %errorLevel% equ 0 (
    echo MongoDB iniciado correctamente!
) else (
    echo Intentando inicio directo...
    start "" "C:\Program Files\MongoDB\Server\8.0\bin\mongod.exe" --config "C:\Program Files\MongoDB\Server\8.0\bin\mongod.cfg"
    timeout /t 3 /nobreak >nul
    echo MongoDB lanzado!
)

echo.
echo ============================================
echo    Iniciando PUBLIART Backend
echo ============================================
start "PUBLIART Backend" /MIN cmd /k "cd /d C:\Users\Alex\Desktop\PUBLIART\backend && npm run dev"

echo.
echo ============================================
echo    Iniciando PUBLIART Frontend
echo ============================================
start "PUBLIART Frontend" /MIN cmd /k "cd /d C:\Users\Alex\Desktop\PUBLIART\frontend && npm run dev"

echo.
echo ============================================
echo   SISTEMA PUBLIART INICIADO
echo ============================================
echo Backend:  http://localhost:5000
echo Frontend: http://localhost:5173
echo.
echo Para abrir desde OTROS PCs en la misma red:
echo 1. Abre otra consola y escribe: ipconfig
echo 2. Busca la "Direccion IPv4" (ej. 192.168.1.15)
echo 3. En la otra PC entra a: http://[TU_IP_AQUI]:5173
echo.
echo Presiona cualquier tecla para cerrar esta ventana...
pause >nul
