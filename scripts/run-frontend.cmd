@echo off
chcp 65001 > nul
cd /d "%USERPROFILE%\Workspace\New project 2\frontend"
"C:\Program Files\nodejs\node.exe" ".\node_modules\vite\bin\vite.js" "--host" "127.0.0.1"
