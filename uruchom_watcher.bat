@echo off
title WUP Dashboard — watcher danych
cd /d "%~dp0"
echo Uruchamiam watcher danych...
python watch_data.py
pause
