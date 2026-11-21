@echo off
chcp 65001 >nul
title Vo Lam Idle - HuyHuyy - may chu (choi cung mang LAN)
cd /d "%~dp0"
set "NODE=node"
if exist "%~dp0node\node.exe" set "NODE=%~dp0node\node.exe"
echo Vo Lam Idle - HuyHuyy - mo cho ban be cung mang LAN / wifi vao choi.
echo Ban be mo trinh duyet, go dia chi http://[IP may nay]:8101 (dia chi hien ben duoi).
echo Giu cua so nay trong luc choi. Dong cua so = tat may chu.
echo.
"%NODE%" chay-game.js 8101 --lan
pause
