@echo off
chcp 65001 >nul
echo ========================================
echo 视频/音频转文案服务 - 安装脚本
echo ========================================
echo.

echo [1/4] 检查 Python 环境...
python --version >nul 2>&1
if errorlevel 1 (
    echo 错误: 未检测到 Python，请先安装 Python 3.8+
    echo 下载地址: https://www.python.org/downloads/
    pause
    exit /b 1
)

echo [2/4] 创建虚拟环境...
python -m venv venv
call venv\Scripts\activate.bat

echo [3/4] 安装依赖包（可能需要几分钟）...
pip install flask flask-cors openai-whisper torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118

echo [4/4] 安装完成！
echo.
echo ========================================
echo 安装成功！
echo 运行 start.bat 启动服务
echo ========================================
pause
