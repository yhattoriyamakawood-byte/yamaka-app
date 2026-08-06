@echo off
cd /d "C:\Users\Ymk159\Desktop\yamaka-app"
del /f ".git\index.lock" 2>nul
del /f ".git\HEAD.lock" 2>nul
git add index.html
git commit -m "TA ranking bug fix: undefined score, TA accuracy per mode"
git push --force origin HEAD:main
echo.
echo === DONE ===
pause
