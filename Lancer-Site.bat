@echo off
title RunPlanner Pro - Lancement du site
cd /d "%~dp0"

echo ====================================================
echo        Lancement de RunPlanner Pro
echo ====================================================
echo.

set "PATH=%LOCALAPPDATA%\Programs\nodejs;%PATH%"

echo Verification des dependances...
if not exist "node_modules" (
    echo Installation initiale des modules npm...
    call npm install
)

echo Demarrage du serveur local...
echo Le site va s'ouvrir automatiquement dans votre navigateur.
echo (Pour arreter le serveur, fermez simplement cette fenetre)
echo.

call npm run dev
pause
