@echo off
chcp 65001 > nul
cd /d "%USERPROFILE%\Workspace\New project 2\backend"
"C:\Program Files\nodejs\node.exe" "dist/src/server.js"
