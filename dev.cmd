@echo off
title PowerSetup — npm run dev
cd /d "%~dp0"
echo.
echo  Startet Next.js unter http://localhost:3000/
echo  Dieses Fenster offen lassen — zum Beenden: Strg+C
echo.
call npm run dev
if errorlevel 1 (
  echo.
  echo Fehler beim Start. Siehe Meldungen oben.
  pause
)
