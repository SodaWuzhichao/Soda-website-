"""
视频/音频转文案后端服务
使用 Whisper 模型进行语音识别
"""
from flask import Flask, request, jsonify
from flask_cors import CORS
import whisper
import os
import tempfile

app = Flask(__name__)
CORS(app)

# 加载 Whisper 模型（首次运行会自动下载）
print("正在加载 Whisper 模型...")
model = whisper.load_model("base")  # 可选: tiny, base, small, medium, large
print("模型加载完成！")

@app.route('/api/transcribe', methods=['POST'])
def transcribe():
    """处理音频/视频文件，返回文案"""
    if 'file' not in request.files:
        return jsonify({'error': '没有上传文件'}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': '文件名为空'}), 400

    # 保存临时文件
    with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(file.filename)[1]) as tmp:
        file.save(tmp.name)
        tmp_path = tmp.name

    try:
        # 使用 Whisper 转录
        print(f"正在处理文件: {file.filename}")
        result = model.transcribe(tmp_path, language='zh')

        return jsonify({
            'success': True,
            'text': result['text'],
            'segments': result['segments']
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500

    finally:
        # 删除临时文件
        if os.path.exists(tmp_path):
            os.remove(tmp_path)

@app.route('/api/health', methods=['GET'])
def health():
    """健康检查"""
    return jsonify({'status': 'ok', 'model': 'base'})

if __name__ == '__main__':
    print("=" * 50)
    print("视频/音频转文案服务已启动！")
    print("访问地址: http://localhost:5000")
    print("=" * 50)
    app.run(host='0.0.0.0', port=5000, debug=False)
