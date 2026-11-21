@echo off
chcp 65001 >nul
title Vo Lam Idle - HuyHuyy - tao tai khoan
cd /d "%~dp0"
set "NODE=node"
if exist "%~dp0node\node.exe" set "NODE=%~dp0node\node.exe"
echo Tao tai khoan nguoi choi. Ten: 3-20 ky tu, chu thuong khong dau, so, dau gach duoi. Mat khau: it nhat 4 ky tu.
echo Tai khoan dau tien cua may chu la quan tri.
echo.
set "TEN="
set "MK="
set /p "TEN=Ten tai khoan: "
set /p "MK=Mat khau: "
"%NODE%" quan-tri.js them "%TEN%" "%MK%"
echo.
"%NODE%" quan-tri.js ds
pause
