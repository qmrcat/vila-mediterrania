@echo off
chcp 65001 >nul
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Cal instal·lar Node.js per iniciar el servidor local.
  echo Despres torna a fer doble clic en aquest fitxer.
  echo Tambe pots obrir index.html amb Live Server de Visual Studio Code.
  pause
  exit /b 1
)
node server.mjs
pause
