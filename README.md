# SODA567 个人网站

## 📁 项目结构
```
soda567/
├── index.html          # 主页
├── admin_new.html      # 后台管理（密码：soda567）
├── tools/
│   └── index.html      # 在线工具页
└── images/
    └── profile.jpg     # 个人照片
```

## 🚀 部署到 soda567.dpdns.org

### 方法一：使用 GitHub Pages（推荐）

1. 在 GitHub 创建仓库
2. 上传所有文件
3. 在仓库设置中启用 GitHub Pages
4. 在 digitalplat.org 设置 DNS 指向 GitHub Pages

### 方法二：使用 FTP 上传

1. 获取 FTP 账号信息
2. 使用 FileZilla 等工具上传所有文件
3. 确保 index.html 在根目录

## ⚙️ 配置

### Google Analytics
在 index.html 第 666 行替换 `G-XXXXXXXXXX` 为你的 GA ID

### 后台管理
- 访问：https://soda567.dpdns.org/admin_new.html
- 密码：soda567
- 修改密码：编辑 admin_new.html 第 246 行

## 📝 使用说明

1. 后台添加/编辑作品
2. 点击"💾 保存并同步到主页"
3. 刷新主页查看效果

## 🔧 维护

- 作品数据存储在浏览器 localStorage
- 定期使用"📦 导出备份"功能备份数据
