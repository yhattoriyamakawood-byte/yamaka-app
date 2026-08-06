@echo off
cd /d "C:\Users\Ymk159\Desktop\yamaka-app"
del /f ".git\index.lock" 2>nul
git add styles.css
git commit -m "fix: restore reco-card vertical layout to remove home screen whitespace"
git push origin HEAD:main
echo.
echo === DONE ===
pause
