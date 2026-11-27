# 梓叶落の幻想郷

个人博客第一版，基于
[XinghuisamaBlogs](https://github.com/heiehiehi/XinghuisamaBlogs)
改造。当前版本以文章、归档、照片墙、说说、友链和关于页面为主。

## 本地运行

环境要求：

- Node.js 20.9 或更高版本
- pnpm 11

```powershell
cd XHBlogs
pnpm install
pnpm dev
```

打开 `http://localhost:3000`。

## 常用命令

```powershell
cd XHBlogs
pnpm test
pnpm exec tsc --noEmit
pnpm lint
pnpm build
```

## 替换内容

### 网站信息

编辑 `XHBlogs/siteConfig.ts`：

- 网站名称、昵称和简介
- 导航链接
- 社交链接
- 背景路径与裁切位置
- 友链申请格式

### 背景图片

当前文件：

```text
XHBlogs/public/images/backgrounds/mobile.webp
XHBlogs/public/images/backgrounds/desktop.webp
```

手机端使用竖图，桌面端使用横图。替换后保持文件名不变即可。

建议尺寸：

- 手机：`1080 × 1920` 或相近竖图
- 桌面：`2560 × 1440` 或相近横图
- 单张控制在 600 KiB 以内

### 文章

在 `XHBlogs/posts/` 新建 Markdown 文件。示例：

```markdown
---
title: "文章标题"
description: "文章摘要"
date: "2026-11-27"
tags: ["随笔"]
cover: "/images/covers/default-cover.svg"
---

正文内容。
```

### 说说

在 `XHBlogs/moments/` 新建 Markdown 文件。示例：

```markdown
---
date: "2026-11-27T20:00:00+08:00"
location: "可选地点"
images:
  - "/images/backgrounds/desktop.webp"
---

一段生活记录。
```

### 照片墙与友链

- 相册：`XHBlogs/data/albums.ts`
- 友链：`XHBlogs/data/friends.ts`
- 关于页：`XHBlogs/app/about/about.md`

## 部署

后续部署到 Vercel 时，将项目根目录或 Root Directory 设置为 `XHBlogs`。
本地开发与普通访问不需要购买服务器。

## 许可

上游许可证见 `LICENSE`，来源和改动范围见 `UPSTREAM-NOTICE.md`。
