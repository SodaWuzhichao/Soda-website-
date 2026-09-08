# SODA567 个人网站

静态前端托管在 GitHub Pages，公开入口为 <https://soda567.dpdns.org/>。动态 API、管理接口和媒体处理服务运行在 Mac mini；大媒体与运行数据保存在长期挂载的 `SodaMedia` 扩展盘。

## 项目边界

这个仓库只保存可以公开部署的前端源码：

```text
Soda-website/
├── index.html          # 作品主页
├── admin_new.html      # 管理界面（服务端鉴权）
├── admin/              # /admin 静态入口
├── tools/              # 在线工具界面
├── images/             # 已优化、会被页面使用的小型图片
├── scripts/            # 静态检查和生产冒烟检查
├── functions/          # 兼容性代理源码
└── docs/               # 架构与运维说明
```

以下内容不得进入本仓库：后端代码副本、密码或云存储密钥、媒体源文件、上传与转换结果、模型、虚拟环境、日志、手工备份和实验沙盒。

完整的本地/扩展盘分工见 [docs/storage-layout.md](docs/storage-layout.md)。

## 修改与发布

1. 修改前检查 `git status`，保留不属于本次工作的改动。
2. 运行：

   ```bash
   node scripts/check-inline-js.mjs
   node scripts/check-entrypoints.mjs
   bash scripts/ops-smoke.sh
   ```

3. 提交并推送 `main` 后，由 GitHub Pages 发布。
4. 发布后用真实浏览器验证主页及受影响工具。涉及上传的修改必须验证完整的上传、处理、状态查询和下载链路。

## 运行服务

- 主 API：`~/Documents/soda-server/backend`
- 音乐转换代码：`~/Documents/soda-services/music-converter`
- 音乐运行数据：`/Volumes/SodaMedia/SodaData/music-converter`
- 公开媒体：`/Volumes/SodaMedia/Media`
- 服务启动项：`~/Library/LaunchAgents/com.soda.*.plist`
- 运维脚本：`~/Library/Scripts/`

服务凭证必须来自 macOS 钥匙串或受限环境变量，禁止写入代码、README、HTML 或 Git 历史。

## 故障检查

```bash
bash scripts/ops-smoke.sh
launchctl print gui/$(id -u)/com.soda.server
launchctl print gui/$(id -u)/com.soda.music-converter
tail -n 100 /tmp/soda-watchdog.log
```

`ops-smoke.sh` 会验证音乐接口的真实 POST/CORS 响应，而不只检查健康页面。
