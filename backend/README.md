# 视频/音频转文案服务 - 使用说明

## 📦 文件说明

- `app.py` - 后端服务主程序
- `install.bat` - 一键安装脚本
- `start.bat` - 启动服务脚本

## 🚀 安装步骤（首次使用）

### 1. 安装 Python

如果没有 Python，先下载安装：
- 访问：https://www.python.org/downloads/
- 下载 Python 3.8 或更高版本
- **重要：** 安装时勾选 "Add Python to PATH"

### 2. 运行安装脚本

1. 双击 `install.bat`
2. 等待安装完成（首次需要下载约 1-2 GB 文件）
3. 看到"安装成功"提示

## ▶️ 启动服务

1. 双击 `start.bat`
2. 等待模型加载（首次会自动下载 base 模型，约 150 MB）
3. 看到"服务已启动"提示
4. 浏览器访问：http://localhost:5000

## 🔧 配置说明

### 切换模型（修改 app.py 第 13 行）

```python
model = whisper.load_model("base")  # 改成其他模型
```

**模型选择：**
- `tiny` - 最快，准确率一般（75 MB）
- `base` - 平衡，推荐（150 MB）
- `small` - 较准确（500 MB）
- `medium` - 很准确（1.5 GB）
- `large` - 最准确（3 GB）

### GPU 加速

如果有 NVIDIA 显卡（如你的 RTX 2060），会自动使用 GPU 加速。

## ❓ 常见问题

**Q: 安装失败怎么办？**
A: 确保已安装 Python 并添加到 PATH

**Q: 处理速度慢？**
A: 换用更小的模型（tiny 或 base）

**Q: 识别不准确？**
A: 换用更大的模型（medium 或 large）

## 📞 需要帮助

遇到问题联系 Soda：
- 邮箱：1085029979@qq.com
- 微信：Superboy_Five
