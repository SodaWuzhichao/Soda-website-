@echo off
chcp 65001 >nul
echo ========================================
echo 启动视频/音频转文案服务
echo ========================================
echo.

call venv\Scripts\activate.bat
python app.py

pause
