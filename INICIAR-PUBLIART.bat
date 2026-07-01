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
start "PUBLIART Backend" cmd /k "cd /d C:\Users\Alex\Desktop\PUBLIART\backend && npm run dev"

echo.
echo ============================================
echo    Iniciando PUBLIART Frontend
echo ============================================
start "PUBLIART Frontend" cmd /k "cd /d C:\Users\Alex\Desktop\PUBLIART\frontend && npm run dev"

echo.
echo Sistema PUBLIART iniciado!
echo Backend:  http://localhost:5000
echo Frontend: http://localhost:5173
echo.
echo Presiona cualquier tecla para cerrar esta ventana...
pause >nul
