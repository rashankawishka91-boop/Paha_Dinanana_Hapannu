@echo off
title Push Now - Paha Dinana Hapannu
echo ========================================================
echo   Paha Dinana Hapannu - 1-Click Git Push to Vercel
echo ========================================================
echo.
git add .
git commit -m "update: manual sync %date% %time%"
git push origin main
echo.
echo ========================================================
echo [OK] Done! Vercel is now building and deploying your changes.
echo ========================================================
pause
