@echo off
cd /d "C:\Users\Ymk159\Desktop\yamaka-app"
echo START > push_log.txt
del /f ".git\index.lock" 2>>push_log.txt
echo after del >> push_log.txt
git add index.html manifest.json HOP.png >> push_log.txt 2>&1
echo after add >> push_log.txt
git commit -m "ログインロゴ変更(HOP.png)、ホームロゴ削除、PWA対応、バグ修正A-F" >> push_log.txt 2>&1
echo after commit >> push_log.txt
git push origin HEAD:main >> push_log.txt 2>&1
echo DONE >> push_log.txt
