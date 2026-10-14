# 材工院学习互助平台 V002 Demo

这是从 V002 视觉体系衍生的独立 GitHub Pages 静态演示版。它不会连接 Prisma、Supabase、阿里云 RDS、Vercel API 或任何真实账号系统。

## 演示内容

- 30 条材料学院学习问题，均为虚构模拟内容。
- 高分子材料科学与工程、材料物理、材料化学各 10 条。
- 专业筛选、关键词搜索、最新/热门/待回答排序。
- 问题详情、回答展开、收藏、有帮助、发布问题和 Demo 登录。
- 首页、搜索、发布、消息、个人页、资源、活动、模拟器说明、更多及管理员工作台。
- 所有临时交互只保存在当前浏览器 `localStorage`，可在个人页清除。

## 本地验证

```bash
npm run test
```

构建产物位于 `dist/`。使用任意静态服务器预览，例如：

```bash
npm run preview
```

## GitHub Pages

仓库已经包含 `.github/workflows/deploy-pages.yml`。推送后，在 GitHub 仓库 Settings → Pages 中将 Source 设为 **GitHub Actions**，再手动运行或推送触发 `Deploy static demo to GitHub Pages`。

站点使用 Hash 路由和相对资源路径，可部署在用户站点或任意仓库子路径下。
完整人工操作见 [PUBLISHING.md](./PUBLISHING.md)。

## 数据与隐私

- 不包含真实学生姓名、学号、手机号、邮箱、头像或真实帖子。
- 不包含 `.env`、数据库 URL、密码、私钥、SMTP 凭据或备份。
- 资源、活动、通知、浏览量和管理员操作均清楚标注为模拟内容。
- 页面内容不代表学院官方通知、课程答案或正式运营数据。
