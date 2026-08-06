@echo off
cd /d "C:\Users\Ymk159\Desktop\yamaka-app"
del /f ".git\index.lock" 2>nul
git add index.html styles.css
git commit -m "タイムアタックランキング追加（60秒・5分）"
git push origin HEAD:main
echo.
echo === DONE ===
pause
