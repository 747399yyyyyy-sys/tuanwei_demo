# GitHub Pages 发布步骤

本目录是独立静态 Demo，不依赖正式版项目、数据库或 Vercel。

## 方案 A：发布到现有私有仓库的独立分支

在本目录打开 PowerShell，执行：

```powershell
git init -b gh-pages-demo
git add .
git commit -m "feat: add V002 GitHub Pages demo"
git remote add origin https://github.com/747399yyyyyy-sys/tuanwei.git
git push -u origin gh-pages-demo
```

然后在 GitHub 仓库中：

1. 打开 **Settings → Pages**。
2. 将 **Source** 设为 **GitHub Actions**。
3. 打开 **Actions → Deploy static demo to GitHub Pages → Run workflow**，选择 `gh-pages-demo`。
4. 等待 `build` 与 `deploy` 均成功后，从 Pages 页面打开站点。

预期地址通常为 `https://747399yyyyyy-sys.github.io/tuanwei/`，实际地址以 GitHub Pages 页面显示为准。私有仓库能否对公众开放 Pages 取决于当前 GitHub 套餐和组织策略。

## 方案 B：发布到独立公开 Demo 仓库

如果现有私有仓库的套餐不支持公开 Pages，建议在 GitHub 新建一个**空的公开仓库**（例如 `tuanwei-v002-demo`），不要勾选自动生成 README。随后只需在本目录执行：

```powershell
git remote add origin https://github.com/747399yyyyyy-sys/tuanwei-v002-demo.git
git push -u origin gh-pages-demo
```

再按上面的 Pages/Actions 两步启用部署。该方案只公开虚构演示数据和静态资源，不会公开正式版源码、数据库配置或账号数据。

## 发布前本地验证

```powershell
npm test
npm run preview
```

浏览器打开 `http://127.0.0.1:4173`。发布文件仅来自 `dist/`；工作流不会读取正式项目的 `.env`、Prisma 数据库或 Vercel 配置。
