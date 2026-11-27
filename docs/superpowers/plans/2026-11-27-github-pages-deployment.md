# GitHub Pages Deployment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将博客导出为静态网站，通过 GitHub Pages 自动部署到 `wakaba.cc`。

**Architecture:** Next.js 使用 `output: "export"` 生成纯静态 `out/` 目录；GitHub Actions 在每次推送到 `main` 时构建并发布到 Pages。自定义域名写入 `public/CNAME`，DNS 继续使用阿里云。

**Tech Stack:** Next.js 16、pnpm 11、GitHub Actions、GitHub Pages、阿里云 DNS。

**Spec:** `docs/superpowers/specs/2026-11-27-ziyeluo-design.md`

## Global Constraints

- 公开仓库：`Chnlxy/ziyeluoblog`
- 正式域名：`wakaba.cc`
- DNS 服务商：阿里云（`dns31/dns32.hichina.com`）
- 网站不使用服务端 API，必须能静态导出
- GitHub Pages 发布目录：`XHBlogs/out`
- 仓库公开仅在用户已确认选择 GitHub Pages 后执行

---

### Task 1: 静态导出与 Pages 工作流

**Files:**
- Modify: `XHBlogs/next.config.ts`
- Create: `XHBlogs/public/CNAME`
- Create: `.github/workflows/deploy-pages.yml`
- Modify: `XHBlogs/tests/ziyeluo-config.test.mjs`

**Interfaces:**
- Produces: `pnpm build` 生成 `XHBlogs/out/`
- Produces: 推送到 `main` 后 GitHub Actions 自动发布 Pages

- [ ] **Step 1: 写失败测试**

```js
test("builds a GitHub Pages static export", () => {
  const nextConfig = fs.readFileSync(path.join(root, "next.config.ts"), "utf8");
  assert.match(nextConfig, /output:\s*["']export["']/);
  assert.match(nextConfig, /trailingSlash:\s*true/);
  assert.equal(
    fs.readFileSync(path.join(root, "public", "CNAME"), "utf8").trim(),
    "wakaba.cc",
  );

  const workflow = fs.readFileSync(
    path.join(root, "..", ".github", "workflows", "deploy-pages.yml"),
    "utf8",
  );
  assert.match(workflow, /actions\/upload-pages-artifact/);
  assert.match(workflow, /actions\/deploy-pages/);
});
```

- [ ] **Step 2: 验证失败**

```powershell
pnpm test tests/ziyeluo-config.test.mjs
```

Expected: 静态导出、CNAME 或 workflow 断言失败。

- [ ] **Step 3: 配置静态导出**

```ts
const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};
```

- [ ] **Step 4: 添加自定义域名**

`XHBlogs/public/CNAME` 内容：

```text
wakaba.cc
```

- [ ] **Step 5: 添加 Pages 工作流**

`.github/workflows/deploy-pages.yml` 使用 Node 22、pnpm、`XHBlogs` 工作目录，执行测试和生产构建，并上传 `XHBlogs/out`。

- [ ] **Step 6: 验证静态构建**

```powershell
pnpm test
pnpm exec tsc --noEmit
pnpm build
Test-Path out\index.html
Test-Path out\posts\welcome-to-fantasy\index.html
```

Expected: 全部通过，两个页面文件存在。

### Task 2: 发布代码并启用 Pages

**Files:**
- Remote: `Chnlxy/ziyeluoblog`
- Remote: `main`

- [ ] **Step 1: 公开仓库**

通过 GitHub API 将仓库 `private` 设置为 `false`。

- [ ] **Step 2: 上传部署相关文件**

使用 GitHub Contents API 更新：

```text
XHBlogs/next.config.ts
XHBlogs/public/CNAME
XHBlogs/tests/ziyeluo-config.test.mjs
.github/workflows/deploy-pages.yml
```

- [ ] **Step 3: 启用 Pages**

通过 GitHub API 设置：

```json
{
  "build_type": "workflow",
  "cname": "wakaba.cc"
}
```

- [ ] **Step 4: 等待 Actions**

确认 Pages 构建流程成功，并取得 GitHub Pages 地址。

### Task 3: 阿里云 DNS

- [ ] **Step 1: 添加根域名 A 记录**

```text
185.199.108.153
185.199.109.153
185.199.110.153
185.199.111.153
```

- [ ] **Step 2: 添加 www CNAME**

```text
www -> Chnlxy.github.io
```

- [ ] **Step 3: 验证**

```powershell
Resolve-DnsName wakaba.cc -Type A
Resolve-DnsName www.wakaba.cc -Type CNAME
Invoke-WebRequest -Uri https://wakaba.cc
```

Expected: DNS 指向 GitHub Pages，HTTPS 页面返回 200。
