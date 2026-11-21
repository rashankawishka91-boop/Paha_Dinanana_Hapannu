@echo off
title Auto Git Sync - Paha Dinana Hapannu
echo Starting Auto Sync... Any saved change will automatically push to GitHub and deploy to Vercel!
echo Press Ctrl+C in this window if you want to stop.
echo.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\auto-sync.ps1"
pause
