# 匿名留言墙设计规格

日期：2026-11-27

## 目标

将现有友链页面改造成匿名留言墙。公开站点继续由 Cloudflare Pages 托管，动态数据由 Cloudflare Pages Functions 和 D1 提供。所有新留言默认待审核，批准后才公开。

## 不在本期范围

- 访客注册、访客密码登录或第三方账号登录
- 访客之间的回复和楼中楼
- 图片上传
- 邮件或即时通讯通知
- 站点访问者个人资料页

## 页面与路由

- 导航名称由“友链”改为“留言”
- 新页面地址：`/guestbook/`
- 旧地址 `/friends/` 重定向到 `/guestbook/`
- 原友链卡片与交换格式区域全部移除
- 公开页面展示：
  - 已批准留言列表
  - 昵称、可选个人网站、留言正文、发布时间
  - 匿名发布表单
  - 空状态、加载状态、提交成功和错误提示
- 管理页面 `/admin/guestbook/`：
  - 待审核、已公开、已隐藏列表
  - 批准、隐藏、重新公开、删除操作
  - 进入管理页后显示站内密码登录表单
  - 未登录时不能读取或修改任何审核数据

## 匿名留言表单

字段约束：

- 昵称：必填，去除首尾空白后 1–30 个字符
- 个人网站：选填，只接受 `http` 或 `https` URL，最长 500 字符
- 留言：必填，去除纯空白后 1–1000 个字符
- Cloudflare Turnstile token：必填

安全处理：

- 前端和后端都校验长度和 URL 协议
- 留言按纯文本保存，不渲染 HTML 或 Markdown
- 输出时仍进行文本转义
- 拒绝脚本标签、事件属性、危险协议
- 不使用访客邮箱
- Turnstile 验证失败时拒绝提交
- 使用 HMAC 后的网络指纹做频率限制，不保存原始 IP
- 同一指纹 60 秒内最多提交 1 条，每小时最多 10 条

## 数据模型

D1 表 `guestbook_messages`：

```sql
CREATE TABLE guestbook_messages (
  id TEXT PRIMARY KEY,
  nickname TEXT NOT NULL,
  website TEXT,
  content TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'hidden')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  approved_at TEXT,
  rate_key TEXT NOT NULL
);

CREATE INDEX guestbook_messages_status_created_idx
  ON guestbook_messages (status, created_at DESC);

CREATE INDEX guestbook_messages_rate_key_created_idx
  ON guestbook_messages (rate_key, created_at DESC);
```

公开查询只允许 `status = 'approved'`。管理接口可以读取全部状态。

## API

### `GET /api/guestbook`

- 返回已批准留言
- 参数：`limit` 默认 20，最大 50；`cursor` 用于下一页
- 返回：`{ messages, nextCursor }`

### `POST /api/guestbook`

请求体：

```json
{
  "nickname": "昵称",
  "website": "https://example.com",
  "content": "留言内容",
  "turnstileToken": "..."
}
```

- 校验 Turnstile 和频率限制
- 新留言写入 `pending`
- 返回 `202` 和“留言已提交，等待审核”
- 不直接返回待审核内容

### `GET /api/admin/guestbook`

- 由 Cloudflare Access 保护
- 参数：`status=pending|approved|hidden|all`
- 返回完整状态和时间字段

### `PATCH /api/admin/guestbook/:id`

```json
{ "status": "approved" }
```

- 只允许 `approved`、`hidden`、`pending`
- 批准时写入 `approved_at`
- 记录 `updated_at`

### `DELETE /api/admin/guestbook/:id`

- 需要管理员会话
- 永久删除留言

### `POST /api/admin/login`

```json
{
  "password": "管理员密码",
  "turnstileToken": "..."
}
```

- 校验 Turnstile 与管理员密码摘要
- 同一 HMAC 网络指纹在 10 分钟内失败 5 次后暂时锁定
- 成功后签发 12 小时有效的 HMAC 签名会话 Cookie
- Cookie 使用 `HttpOnly`、`Secure`、`SameSite=Strict`

### `GET /api/admin/session`

- 返回管理员当前是否已登录
- 没有有效会话时返回 `401`

### `POST /api/admin/logout`

- 清除管理员会话 Cookie

## 安全边界

- `/api/admin/*` 统一验证 HMAC 签名会话 Cookie
- `/admin/guestbook/*` 可以加载静态登录界面，但不包含留言数据
- 登录密码只以 SHA-256 摘要保存在 Cloudflare Secret 中
- 登录同样要求 Turnstile，避免脚本暴力猜测
- 登录失败按 HMAC 网络指纹限流
- 公开写入接口要求 Turnstile
- 限制请求体大小、文本长度和字段数量
- 所有 SQL 使用 D1 prepared statements
- 只允许预定义状态值
- 不返回内部 `rate_key`
- 错误信息不暴露数据库细节

## 环境绑定

Cloudflare Pages 项目需要：

- D1 绑定：`GUESTBOOK_DB`
- 构建变量：`NEXT_PUBLIC_TURNSTILE_SITE_KEY`
- Secret：`TURNSTILE_SECRET_KEY`
- Secret：`RATE_LIMIT_SECRET`
- Secret：`ADMIN_PASSWORD_HASH`
- Secret：`ADMIN_SESSION_SECRET`

## 测试与验收

- 纯校验函数覆盖：空内容、过长内容、危险 URL、危险 HTML、字段规范化
- 公开接口只返回 approved
- 匿名提交创建 pending
- Turnstile 失败拒绝写入
- 频率限制生效
- 登录密码错误、会话被篡改或过期时拒绝管理访问
- 登录成功后可以审核，批准后内容出现在公开接口
- 导航和路由重定向正确
- 原友链文字、友链卡片和交换链接格式不再出现
- TypeScript、单元测试、生产构建和 Cloudflare 部署成功

## 上线顺序

1. 创建 D1 数据库并执行 schema
2. 配置 Turnstile 和 Secrets
3. 完成公开留言墙与 API
4. 完成密码保护的后台审核页
5. 部署到 Cloudflare Pages
6. 提交一条测试留言并完成审核、公开、隐藏和删除流程

