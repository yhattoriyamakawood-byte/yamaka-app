@echo off
cd /d "C:\Users\Ymk159\Desktop\yamaka-app"
del /f ".git\index.lock" 2>nul
del /f ".git\HEAD.lock" 2>nul
git checkout 99bcc6a -- styles.css app.js quiz-data.js README.md
git add styles.css app.js quiz-data.js README.md
git commit --amend --no-edit
git push --force origin HEAD:main
echo.
echo === DONE ===
pause
