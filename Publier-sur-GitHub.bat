@echo off
title Publication vers GitHub - RunPlanner
cd /d "%~dp0"

echo ==========================================================
echo           Publication de RunPlanner vers GitHub
echo ==========================================================
echo.
echo Depot cible : https://github.com/Victor-Frere/RunPlanner.git
echo Branche      : main
echo.
echo Connexion a GitHub et envoi des fichiers en cours...
echo Une fenetre de votre navigateur peut s'ouvrir pour confirmer votre compte GitHub.
echo.

git push -u origin main

echo.
if %ERRORLEVEL% equ 0 (
    echo ==========================================================
    echo SUCCES : Tous les fichiers sont maintenant sur votre GitHub !
    echo Rendez-vous sur : https://github.com/Victor-Frere/RunPlanner
    echo ==========================================================
) else (
    echo ==========================================================
    echo L'envoi a echoue ou a ete interrompu.
    echo ==========================================================
)

echo.
pause
