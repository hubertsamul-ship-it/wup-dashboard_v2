@echo off
chcp 65001 >nul
title WUP Dashboard — aktualizacja danych
echo.
echo  ===================================================
echo   WUP Dashboard — aktualizacja dashboard_final.json
echo  ===================================================
echo.

cd /d "%~dp0wup-dashboard"

echo  Uruchamiam extract_data.py ...
echo.

"C:\Users\HSamul\AppData\Local\Python\bin\python.exe" extract_data.py

echo.
if %ERRORLEVEL% EQU 0 (
    echo  [OK] Dane zaktualizowane!
    echo.
    echo  Nastepny krok: wgraj zmiany na Vercel (git push)
    echo   lub uruchom podglad: npm run dev
) else (
    echo  [BLAD] Cos poszlo nie tak — sprawdz komunikaty powyzej.
)

echo.
pause
