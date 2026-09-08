# 存储与运行布局

## 原则

本地 SSD 保存小而关键、启动时必须可用的代码；`SodaMedia` 扩展盘保存体积大、增长快、可以被清理或重新生成的数据。磁盘空间与运行内存是两件事：把媒体放到扩展盘主要节省本地磁盘，不会直接降低程序 RAM 占用。

## 本地 SSD

| 路径 | 内容 | 是否公开 |
|---|---|---|
| `~/Documents/Soda-website` | GitHub Pages 静态前端 | 是 |
| `~/Documents/soda-server/backend` | 主 API 与管理后端源码 | 否 |
| `~/Documents/soda-services/music-converter` | 音乐转换源码和依赖 | 否 |
| `~/Library/Scripts` | 启动与 watchdog 脚本 | 否 |
| `~/Library/LaunchAgents` | launchd 服务定义 | 否 |
| `/opt/homebrew/etc/nginx` | API 反向代理配置 | 否 |

## SodaMedia 扩展盘

| 路径 | 内容 | 保留策略 |
|---|---|---|
| `/Volumes/SodaMedia/Media` | 正式视频、缩略图和播放文件 | 长期保留并备份 |
| `/Volumes/SodaMedia/SodaData/music-converter` | 音乐上传、输出、临时文件、任务和日志 | 按服务 TTL 自动清理 |
| `/Volumes/SodaMedia/whisper-data` | 转写运行数据 | 按任务策略清理 |
| `/Volumes/SodaMedia/Archives` | 人工隔离、旧版本和迁移回滚副本 | 验证后人工清理 |
| `/Volumes/SodaMedia/Backups` | 自动备份 | 必须使用保留策略，禁止无限每日累积 |

## 启动约束

- 服务访问扩展盘前必须确认 `/Volumes/SodaMedia` 已真实挂载，不能让 macOS 在同名空目录中写入系统盘。
- 扩展盘未挂载时，相关服务应失败并由 watchdog 记录原因；主页静态外壳仍应保持在线。
- CORS 由应用服务负责，Nginx 不得对同一 API 重复添加响应头。
- 密钥存储在 macOS 钥匙串；运行脚本只在启动时注入进程环境。

## 备份建议

自动备份应采用分层保留：最近 7 个每日、最近 8 个每周、最近 12 个每月。清理前先生成将删除文件和预计释放空间的清单；不删除当前最新备份。
