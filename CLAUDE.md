# Soda Website 维护约定

## 唯一事实源

- 本仓库只负责可公开部署的静态前端。
- `~/Documents/soda-server/backend` 是主 API 的唯一运行源码。
- `~/Documents/soda-services/music-converter` 是音乐服务的唯一运行源码。
- `/Volumes/SodaMedia/SodaData` 保存工具运行数据；`/Volumes/SodaMedia/Media` 保存正式媒体。
- 不在前端仓库复制后端，不在扩展盘运行音乐服务源码。

## 修改规则

1. 修改前查看 `git status` 和相关运行服务，避免覆盖其他工作。
2. 大文件、模型、日志、上传、输出和临时数据不得写入本仓库或系统盘。
3. 所有凭证使用钥匙串或环境变量，禁止硬编码和提交。
4. 不使用 `pkill` 批量重启；通过对应的 `com.soda.*` launchd 服务精确重启。
5. 不用健康接口代替业务验证。上传类工具必须走完上传、处理、轮询和下载。
6. 实验文件放在扩展盘的 `Archives` 隔离目录，不放入 GitHub Pages 发布树。

## 发布前检查

```bash
node scripts/check-inline-js.mjs
node scripts/check-entrypoints.mjs
bash scripts/ops-smoke.sh
git diff --check
```

禁止强制推送，除非用户明确授权 Git 历史清理。
