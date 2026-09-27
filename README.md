# 香港教育大学校园模型 · GitHub Pages 迁移版

本包只增加独立构建与 GitHub Pages 部署配置，不重新建模、不更改视觉设计或交互。主模型入口仍为 `index.html`，90 秒动画入口仍为 `film.html`。

原版 42 个文件完整保留于 `source/` 内，原项目内部的文件名、目录关系和文件内容均保持不变，包括模型、UI、CSS、手机操作、第一／第三人称、地点切换、地图、标签、动画镜头、配乐和离线影片工具。`source-manifest.json` 记录原版文件的 SHA-256，`npm run verify` 会逐个核对。

## 发布到 GitHub

1. 创建 GitHub 仓库，默认分支使用 `main`，例如命名为 `eduhk-campus-explorer`。
2. **解压本 ZIP，把 `EdUHK-GitHub-Pages` 文件夹内的全部项目内容上传到仓库根目录。** 根目录应能直接看到 `package.json`、`vite.config.js`、`source/` 和 `.github/`。不要只上传 ZIP 文件，也不要将整个项目再套一层文件夹。
3. **务必包含 `.github/workflows/deploy-pages.yml`。** 部分文件管理器会隐藏点号开头的文件夹。用网页上传时可先直接访问仓库中的该文件路径，确认工作流已上传。
4. 在仓库 **Settings → Pages → Build and deployment → Source** 中选择 **GitHub Actions**。
5. 在 **Actions → Publish EdUHK Campus to GitHub Pages → Run workflow** 运行一次。此后推送到 `main` 将自动构建并发布。
6. 部署成功后，在 **Settings → Pages** 复制实际网址。主模型在该网址首页；动画在同一网址的 `film.html`。首页原有的「观看 90 秒动画」按钮可以直接进入动画。

典型地址形式为 `https://你的用户名.github.io/你的仓库名/` 和 `https://你的用户名.github.io/你的仓库名/film.html`。这里是地址格式说明，并非本 ZIP 已创建的新网址。无需在源代码中填写账号或仓库名。

工作流沿用参考仓库 [goonerjohn0821/foguang-east-hall](https://github.com/goonerjohn0821/foguang-east-hall) 的发布结构及 Action 固定提交：检出源码 → Node.js 22 → `npm ci` → `npm run verify` → `npm run build` → 上传 `dist` → 部署 Pages。部署权限由 GitHub Actions 提供，无需另填个人访问令牌。

## 项目结构与原源码保留方式

原教大项目没有 `package.json` 或 Vite 配置，其 `dist/` 实际存放手写源码。为避免 Vite 构建清空原源码，本包把**整个原项目原样**置于 `source/`，在外层增加构建文件。原项目内部目录关系未变：

| 路径 | 用途 |
| --- | --- |
| `source/dist/index.html` | 原版主模型 HTML 入口 |
| `source/dist/film.html` | 原版 90 秒动画 HTML 入口 |
| `source/dist/*.js`、`*.css` | 原版场景、人物、交互、动画和样式源码 |
| `source/dist/assets/` | 原版人物 GLB、字体、音乐及授权 |
| `source/dist/vendor/` | 原版 Three.js r180 和加载器、控制器 |
| `source/film-tools/` | 原版离线动画导出与检查工具 |
| `source/README.md`、`source/.openai/hosting.json` | 原版说明及托管配置，原样保留供追溯 |
| `vite.config.js` | Vite 多页面构建，`base: './'` |
| `package.json`、`package-lock.json` | 独立安装所需依赖与锁定版本 |
| `.github/workflows/deploy-pages.yml` | GitHub Pages 自动构建与部署 |
| `dist/` | 本包附带的已构建网站，也是工作流重新生成并发布的目录 |

源 HTML 文件名没有改变；Vite 会在发布目录生成 `dist/index.html` 和 `dist/film.html`。**修改源码请进入 `source/`，不要编辑构建输出 `dist/`。** `source/.openai/hosting.json` 不参与构建，也不会发布至网站。

## 构建与本地预览

需要 Node.js 22.12 或以上版本。与参考佛光寺项目的锁文件一致，使用 Vite **7.3.6**；Three.js 固定为原版 **0.180.0**。浏览器实际渲染仍使用原项目 `vendor/` 中的 r180 文件，裸导入也指向同一份模块，避免重复加载不同版本的 Three.js。

在包含 `package.json` 的目录执行：

```bash
npm ci
npm run verify
npm run build
npm run preview
```

打开终端给出的 HTTP 地址查看主模型；在地址末尾添加 `film.html` 查看动画。开发预览可运行 `npm run dev`。不要直接双击 HTML，以免遇到浏览器对本地 ES 模块的限制。

`dist/` 已加入 `.gitignore`，使用 Git 推送时无需提交它，Actions 会从源码重新生成。网页上传时即使上传了附带的 `dist/`，工作流也会先清理并重新构建。

## 路径兼容处理

- `base: './'` 使构建后的模块、CSS、模型和字体使用相对路径，支持 GitHub Pages 仓库子目录。
- 显式构建两个 HTML 入口，保留页面之间原有的相对跳转。
- 原代码的 `Audio('./assets/campus-score.mp3?v=9')` 保持不变，构建时把同一音频文件输出到原位置。音乐、控制按钮、同步播放逻辑和 90 秒时长不变。
- GLB 与字体由 Vite 自动带入构建；保留原授权文件和 `.nojekyll`。
- 生产 HTML 移除已由 Vite 完成解析的 import map，不改动 UI 元素。没有运行时 CDN、ChatGPT 登录或 ChatGPT Site 服务依赖。

## 检查

`npm run verify` 核对全部原文件与 14 段镜头的 90 秒时间线。`npm run build` 还会检查双页面入口、UI 元素 ID、原始模型／字体／音乐字节，并通过本地 HTTP 服务验证所有输出资源在网站根路径与任意仓库子路径下的访问。

以后如果主动修改模型源码，需同步更新 `source-manifest.json` 中对应文件的校验值；当前清单专门用来确认本次部署迁移没有改动原内容。

动画离线导出工具仍可在 `source/` 内按 `source/film-tools/README.md` 运行。它们不是 GitHub Pages 构建依赖，发布网页无需安装 Python、FFmpeg 或原工作区的工具。

本包不包含 GitHub 仓库创建或实际部署记录。GitHub Pages 的实际网络可达性仍需发布后用访问者的网络测试。

## 部署说明参考

- [GitHub Pages 自定义工作流](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)
- [Vite 静态部署](https://vite.dev/guide/static-deploy.html)
- [Vite 相对资源路径](https://vite.dev/guide/build.html#relative-base)
