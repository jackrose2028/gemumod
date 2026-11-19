@echo off
title EmulatorJS local server
cd /d "%~dp0"
set PORT=8000
set PY=
where python >nul 2>nul && set PY=python
if not defined PY where py >nul 2>nul && set PY=py
if not defined PY (
  echo Python was not found.
  echo Install it from https://www.python.org/downloads/ and tick "Add python.exe to PATH",
  echo then double-click this file again.
  pause
  exit /b 1
)
echo Starting EmulatorJS at http://localhost:%PORT%
echo Keep this window open while you play. Close it to stop the server.
start "" "http://localhost:%PORT%/"
%PY% serve.py %PORT%
pause
