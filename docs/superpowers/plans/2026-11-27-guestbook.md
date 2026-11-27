# 匿名留言墙实施计划

> **已取代：** Cloudflare Access 方案因免费开通仍要求绑定银行卡，已改为无需银行卡的站内密码登录。请以 `2026-11-27-guestbook-password-admin.md` 为准；本文件保留为历史记录。

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将友链页面替换为带审核的匿名留言墙，并部署到 Cloudflare Pages + D1。

**Architecture:** 静态页面由 Next.js 导出，Cloudflare Pages Functions 提供公开留言和管理审核 API。所有新留言写入待审核状态，公开 API 只返回已批准内容。管理接口校验 Cloudflare Access JWT。

**Tech Stack:** Next.js 16、React 19、Cloudflare Pages Functions、D1、Turnstile、Cloudflare Access、Node test runner

**Spec:** `docs/superpowers/specs/2026-11-27-guestbook-design.md`

## Global Constraints

- 匿名留言允许填写昵称和可选网站，不要求账号登录。
- 新留言必须默认 `pending`，批准后才公开。
- 公开接口不得返回待审核或隐藏留言。
- 管理接口不得只依赖隐藏页面；必须验证 Cloudflare Access JWT。
- 友链卡片、交换友链格式和原导航名称全部移除。
- `/friends/` 永久跳转到 `/guestbook/`。
- 留言按纯文本处理，不渲染 HTML 或 Markdown。
- 不保存访客原始 IP，只保存 HMAC 指纹用于限流。

---

### Task 1: 留言路由、导航与静态页面

**Files:**
- Modify: `XHBlogs/siteConfig.ts`
- Create: `XHBlogs/app/guestbook/page.tsx`
- Create: `XHBlogs/app/guestbook/GuestbookClient.tsx`
- Create: `XHBlogs/public/_redirects`
- Delete: `XHBlogs/app/friends/page.tsx`
- Delete: `XHBlogs/app/friends/FriendsBoard.tsx`
- Delete: `XHBlogs/data/friends.ts`
- Test: `XHBlogs/tests/ziyeluo-config.test.mjs`

**Interfaces:**
- Produces: `/guestbook/` public page.
- Consumes: `GET /api/guestbook`, `POST /api/guestbook`.

**Steps:**

- [ ] 写失败测试，确认导航包含“留言 /guestbook”，旧友链页面和文案不存在，redirect 文件存在。
- [ ] 运行聚焦测试并确认因旧页面仍存在而失败。
- [ ] 创建留言墙页面和客户端组件，删除旧友链文件。
- [ ] 运行聚焦测试并确认通过。

### Task 2: 共享校验与公开留言 API

**Files:**
- Create: `XHBlogs/functions/_lib/guestbook-core.mjs`
- Create: `XHBlogs/functions/api/guestbook.ts`
- Create: `XHBlogs/functions/schema.sql`
- Test: `XHBlogs/tests/guestbook-core.test.mjs`
- Test: `XHBlogs/tests/ziyeluo-config.test.mjs`

**Interfaces:**

```ts
normalizeGuestbookInput(input: {
  nickname: unknown;
  website?: unknown;
  content: unknown;
}): {
  nickname: string;
  website: string;
  content: string;
};
```

- [ ] 为合法昵称、空内容、超长内容、非 HTTP(S) 网站、HTML 标签和空白规范化写失败测试。
- [ ] 运行测试并确认校验模块缺失。
- [ ] 实现 `guestbook-core.mjs` 和 D1 schema。
- [ ] 运行测试直到通过。
- [ ] 写 API 源文件测试，验证 public GET 过滤 approved、POST 校验 Turnstile 并写入 pending、频率限制存在。
- [ ] 实现 Pages Function，使用 prepared statements。
- [ ] 运行测试并确认通过。

### Task 3: Cloudflare Access JWT 与管理 API

**Files:**
- Create: `XHBlogs/functions/_lib/access.mjs`
- Create: `XHBlogs/functions/api/admin/guestbook.ts`
- Create: `XHBlogs/functions/api/admin/guestbook/[id].ts`
- Test: `XHBlogs/tests/guestbook-core.test.mjs`
- Test: `XHBlogs/tests/ziyeluo-config.test.mjs`

**Interfaces:**

```ts
verifyAccessJwt(
  token: string | null,
  env: { ACCESS_AUD: string; ACCESS_TEAM_DOMAIN: string },
): Promise<{ email: string }>;
```

- [ ] 写失败测试，验证缺少 JWT 拒绝、允许邮箱校验、状态只能为 approved/hidden/pending。
- [ ] 实现 Access JWT 的签名、受众和邮箱校验。
- [ ] 实现管理列表、状态更新和删除 API。
- [ ] 运行测试并确认通过。

### Task 4: 审核后台与公开留言交互

**Files:**
- Create: `XHBlogs/app/admin/guestbook/page.tsx`
- Create: `XHBlogs/app/admin/guestbook/AdminGuestbookClient.tsx`
- Modify: `XHBlogs/app/guestbook/GuestbookClient.tsx`
- Test: `XHBlogs/tests/ziyeluo-config.test.mjs`

**Interfaces:**
- Consumes: Public and admin API contracts from Tasks 2–3.
- Produces: Approved-message list, anonymous submission form and moderation controls.

- [ ] 写失败测试，确认公开表单包含 Turnstile、昵称、网站和正文，管理页包含三种状态和审核按钮。
- [ ] 实现公开留言列表、分页、提交状态和 Turnstile 挂载。
- [ ] 实现管理页审核、隐藏、恢复和删除。
- [ ] 运行聚焦测试并确认通过。

### Task 5: Cloudflare 资源、部署与端到端验收

**Files:**
- Modify: `XHBlogs/package.json` only if Wrangler tooling is required.
- Modify: `XHBlogs/tsconfig.json` only for Workers type support.

**Cloudflare resources:**

- [ ] 创建 D1 数据库 `ziyeluoblog-guestbook`
- [ ] 执行 `functions/schema.sql`
- [ ] 创建 Turnstile widget，绑定 `wakaba.cc` 和 `www.wakaba.cc`
- [ ] 设置 `GUESTBOOK_DB` 绑定
- [ ] 设置 `TURNSTILE_SECRET_KEY`、`RATE_LIMIT_SECRET` 和 Access 配置
- [ ] 为 `/admin/guestbook/*`、`/api/admin/*` 创建 Access 应用

- [ ] 运行完整验证：

```powershell
pnpm test
pnpm exec tsc --noEmit
pnpm build
```

- [ ] 推送 GitHub，确认 Cloudflare Pages 构建成功。
- [ ] 用浏览器执行完整流程：
  - 打开 `/guestbook/`
  - 提交匿名留言
  - 确认公开页暂不显示
  - 登录 `/admin/guestbook/`
  - 批准测试留言
  - 确认公开页出现
  - 隐藏并确认公开页消失
  - 删除测试留言
  - 确认 `/friends/` 跳转到 `/guestbook/`

- [ ] 所有检查通过后提交部署。

