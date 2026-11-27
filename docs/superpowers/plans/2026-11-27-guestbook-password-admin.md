# 留言墙密码审核后台实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 Cloudflare Access 审核后台替换为无需银行卡的站内密码登录，同时继续保护全部留言审核 API。

**Architecture:** 管理员密码以 SHA-256 摘要保存在 Cloudflare Secret 中。登录接口先校验 Turnstile，再用 HMAC 网络指纹限制失败次数，成功后签发 HMAC 签名、12 小时有效的 `HttpOnly` Cookie。所有 `/api/admin/*` 接口统一验证该 Cookie，静态审核页只显示登录表单。

**Tech Stack:** Next.js 16、React 19、Cloudflare Pages Functions、D1、Turnstile、Web Crypto、Node test runner

**Spec:** `docs/superpowers/specs/2026-11-27-guestbook-design.md`

## Global Constraints

- 不接入 Cloudflare Zero Trust，不要求银行卡或付款信息。
- 访客继续匿名留言，新留言默认 `pending`。
- `/api/admin/*` 不得只依赖隐藏页面，必须校验管理员会话。
- 管理密码不得以明文写入仓库或发送到聊天。
- 会话 Cookie 必须为 `HttpOnly`、`Secure`、`SameSite=Strict`。
- 登录必须同时通过 Turnstile。
- 同一 HMAC 网络指纹在 10 分钟内失败 5 次后返回 `429`。
- 会话有效期固定为 12 小时。
- 不修改启动页 GIF。
- 只修改留言墙、安全认证、测试和部署文档相关文件。

---

### Task 1: 密码摘要、会话签名与限流判断

**Files:**
- Create: `XHBlogs/functions/_lib/admin-auth.mjs`
- Create: `XHBlogs/tests/admin-auth.test.mjs`

**Interfaces:**

```js
sha256Hex(value: string): Promise<string>
secureEqualHex(left: string, right: string): boolean
createAdminSession(secret: string, now?: number): Promise<string>
verifyAdminSession(token: string, secret: string, now?: number): Promise<boolean>
loginIsLocked(failureCount: number): boolean
```

- [ ] **Step 1: Write failing tests**

```js
import assert from "node:assert/strict";
import test from "node:test";

import {
  createAdminSession,
  loginIsLocked,
  secureEqualHex,
  sha256Hex,
  verifyAdminSession,
} from "../functions/_lib/admin-auth.mjs";

test("hashes the admin password without exposing it", async () => {
  assert.equal(
    await sha256Hex("correct horse battery staple"),
    "c4bbcb1fbec99d65bf59d85c8cb62ee2db963f0fe106f483d9afa73bd4e39a8a",
  );
});

test("compares password digests in constant-time form", () => {
  assert.equal(secureEqualHex("abcd", "abcd"), true);
  assert.equal(secureEqualHex("abcd", "abce"), false);
  assert.equal(secureEqualHex("abcd", "abc"), false);
});

test("creates a session that survives an unchanged round trip", async () => {
  const now = 1_800_000_000_000;
  const token = await createAdminSession("session-secret", now);
  assert.equal(
    await verifyAdminSession(token, "session-secret", now + 60_000),
    true,
  );
});

test("rejects tampered and expired sessions", async () => {
  const now = 1_800_000_000_000;
  const token = await createAdminSession("session-secret", now);
  assert.equal(
    await verifyAdminSession(`${token}x`, "session-secret", now + 60_000),
    false,
  );
  assert.equal(
    await verifyAdminSession(token, "wrong-secret", now + 60_000),
    false,
  );
  assert.equal(
    await verifyAdminSession(token, "session-secret", now + 43_200_001),
    false,
  );
});

test("locks login after five failures in the active window", () => {
  assert.equal(loginIsLocked(4), false);
  assert.equal(loginIsLocked(5), true);
});
```

- [ ] **Step 2: Run the test and verify it fails**

Run: `pnpm exec node --test tests/admin-auth.test.mjs`

Expected: FAIL because `functions/_lib/admin-auth.mjs` does not exist.

- [ ] **Step 3: Implement the minimal auth module**

Use Web Crypto only:

```js
const encoder = new TextEncoder();
export const ADMIN_COOKIE = "ziyeluo_admin_session";
export const SESSION_SECONDS = 12 * 60 * 60;
export const LOGIN_FAILURE_LIMIT = 5;

export async function sha256Hex(value) {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(value));
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export function secureEqualHex(left, right) {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return difference === 0;
}
```

For session creation, serialize `{ sub: "guestbook-admin", exp }`, encode with base64url, sign the encoded payload using HMAC-SHA-256, and return `<payload>.<signature>`. Verification must check exact segments, HMAC, subject and expiration.

- [ ] **Step 4: Run the focused test**

Run: `pnpm exec node --test tests/admin-auth.test.mjs`

Expected: 5 tests pass.

### Task 2: 登录、会话 API 与审核接口保护

**Files:**
- Create: `XHBlogs/functions/_lib/turnstile.mjs`
- Create: `XHBlogs/functions/api/admin/login.ts`
- Create: `XHBlogs/functions/api/admin/session.ts`
- Create: `XHBlogs/functions/api/admin/logout.ts`
- Modify: `XHBlogs/functions/api/admin/guestbook.ts`
- Modify: `XHBlogs/functions/api/admin/guestbook/[id].ts`
- Modify: `XHBlogs/functions/api/guestbook.ts`
- Modify: `XHBlogs/functions/schema.sql`
- Delete: `XHBlogs/functions/_lib/access.mjs`
- Modify: `XHBlogs/tests/ziyeluo-config.test.mjs`

**Interfaces:**

- `POST /api/admin/login` consumes `{ password, turnstileToken }` and sets the admin cookie.
- `GET /api/admin/session` returns `{ authenticated: true }` or `401`.
- `POST /api/admin/logout` clears the cookie.
- `requireAdminSession(request, env)` throws `AdminAuthError` with status `401` unless the cookie is valid.

**D1 migration:**

```sql
CREATE TABLE IF NOT EXISTS admin_login_failures (
  id TEXT PRIMARY KEY,
  rate_key TEXT NOT NULL,
  failed_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS admin_login_failures_rate_key_failed_idx
  ON admin_login_failures (rate_key, failed_at DESC);
```

- [ ] **Step 1: Replace Access expectations with failing password-login expectations**

The config test must assert:

```js
assert.ok(fs.existsSync(path.join(root, "functions", "api", "admin", "login.ts")));
assert.ok(fs.existsSync(path.join(root, "functions", "api", "admin", "session.ts")));
assert.ok(fs.existsSync(path.join(root, "functions", "api", "admin", "logout.ts")));
assert.match(adminApi, /requireAdminSession/);
assert.match(adminItem, /requireAdminSession/);
assert.equal(
  fs.existsSync(path.join(root, "functions", "_lib", "access.mjs")),
  false,
);
assert.doesNotMatch(
  fs.readFileSync(adminApiPath, "utf8"),
  /ACCESS_TEAM_DOMAIN|ACCESS_AUD/,
);
```

- [ ] **Step 2: Run the test and verify it fails**

Run: `pnpm exec node --test tests/ziyeluo-config.test.mjs`

Expected: FAIL because password-login routes do not exist and Access is still referenced.

- [ ] **Step 3: Extract Turnstile verification**

Create `verifyTurnstileToken({ secret, token, remoteIp, fetchImpl = fetch })` in `functions/_lib/turnstile.mjs`. The returned value must be `true` only when the siteverify response is OK and its JSON `success` is exactly `true`. Update the public guestbook API to use it.

- [ ] **Step 4: Implement login and session APIs**

`login.ts` must:

1. Reject bodies over 2048 bytes.
2. Require a non-empty Turnstile token and password.
3. Verify Turnstile before checking the password.
4. Compute the HMAC network fingerprint from `CF-Connecting-IP` and `RATE_LIMIT_SECRET`.
5. Query failures from the previous 10 minutes; at 5 return `429`.
6. Compare `sha256Hex(password)` to `ADMIN_PASSWORD_HASH` with `secureEqualHex`.
7. Insert one failure row for a wrong password.
8. Clear recent failure rows after successful login.
9. Set `Set-Cookie: ziyeluo_admin_session=...; Path=/api/admin; Max-Age=43200; HttpOnly; Secure; SameSite=Strict`.

`logout.ts` sets the same cookie with `Max-Age=0`.

`session.ts` calls `requireAdminSession`.

`admin-auth.mjs` also exports:

```js
requireAdminSession(request, env): Promise<{
  authenticated: true,
  subject: "guestbook-admin"
}>
```

- [ ] **Step 5: Replace Access checks in both moderation endpoints**

Use `await requireAdminSession(request, env)` and return `error.status` for `AdminAuthError`. Successful mutation responses return `{ success: true, status }` or `{ success: true }` without a reviewer email.

- [ ] **Step 6: Run focused and full tests**

Run:

```powershell
pnpm exec node --test tests/admin-auth.test.mjs tests/ziyeluo-config.test.mjs
pnpm test
```

Expected: all tests pass.

### Task 3: 审核页登录界面与部署配置

**Files:**
- Create: `XHBlogs/app/admin/guestbook/AdminLogin.tsx`
- Modify: `XHBlogs/app/admin/guestbook/AdminGuestbookClient.tsx`
- Modify: `XHBlogs/app/admin/guestbook/page.tsx`
- Create: `XHBlogs/scripts/hash-admin-password.mjs`
- Modify: `XHBlogs/package.json`
- Modify: `XHBlogs/tests/ziyeluo-config.test.mjs`
- Modify: `docs/superpowers/plans/2026-11-27-guestbook.md`

**Interfaces:**

- `AdminLogin` accepts `{ onSuccess: () => void }`.
- It renders a password field and the shared `NEXT_PUBLIC_TURNSTILE_SITE_KEY` widget.
- Successful login calls `onSuccess`; `AdminGuestbookClient` then fetches moderation data.
- Logout calls `POST /api/admin/logout` and returns to the login form.

- [ ] **Step 1: Write failing UI and configuration tests**

Add assertions that:

```js
assert.ok(fs.existsSync(loginPath));
assert.match(login, /type="password"/);
assert.match(login, /NEXT_PUBLIC_TURNSTILE_SITE_KEY/);
assert.match(login, /\/api\/admin\/login/);
assert.match(adminClient, /\/api\/admin\/session/);
assert.match(adminClient, /\/api\/admin\/logout/);
assert.doesNotMatch(adminPage, /Cloudflare Access/);
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run: `pnpm exec node --test tests/ziyeluo-config.test.mjs`

Expected: FAIL because `AdminLogin.tsx` does not exist.

- [ ] **Step 3: Add the login component**

Render:

- Password input with `autoComplete="current-password"`.
- Turnstile widget using the existing explicit-render script pattern.
- Login button disabled while submitting or before verification.
- Clear Chinese error messages for bad password, failed verification and rate limit.

Never persist the password in local storage.

- [ ] **Step 4: Gate the moderation client**

On mount, GET `/api/admin/session`. A `401` shows `AdminLogin`; success loads messages. Add a “退出登录” button. Any moderation `401` drops the client back to the login screen.

- [ ] **Step 5: Add a local password-hash helper**

`scripts/hash-admin-password.mjs` reads a password interactively with terminal echo disabled and prints only the 64-character SHA-256 digest. It must reject passwords shorter than 20 characters. Add:

```json
"admin:hash": "node scripts/hash-admin-password.mjs"
```

- [ ] **Step 6: Run full verification**

Run:

```powershell
pnpm test
pnpm exec tsc --noEmit
pnpm build
```

Expected: tests pass, TypeScript exits 0 and Next.js production export succeeds.

### Task 4: Cloudflare 配置、部署与端到端验收

**Files:**
- No committed secret or password file.

**Cloudflare Pages production and preview environment:**

- Text variable: `NEXT_PUBLIC_TURNSTILE_SITE_KEY=<public site key>`
- Secret: `TURNSTILE_SECRET_KEY=<Turnstile secret>`
- Secret: `RATE_LIMIT_SECRET=<random 32+ byte value>`
- Secret: `ADMIN_PASSWORD_HASH=<SHA-256 digest>`
- Secret: `ADMIN_SESSION_SECRET=<random 32+ byte value>`

- [ ] **Step 1: Apply the updated schema to `ziyeluoblog-guestbook`**

Run the complete `functions/schema.sql` in the D1 console.

- [ ] **Step 2: Add the five environment entries to both Production and Preview**

Do not print or commit secret values.

- [ ] **Step 3: Run complete local verification immediately before deploy**

Run:

```powershell
pnpm test
pnpm exec tsc --noEmit
pnpm build
```

- [ ] **Step 4: Commit and push only guestbook-related files**

Commit with `feat: add moderated guestbook`.

- [ ] **Step 5: Confirm Cloudflare Pages deploy**

Production must contain `/guestbook/index.html`, `/admin/guestbook/index.html` and Pages Functions routes `/api/guestbook`, `/api/admin/login`.

- [ ] **Step 6: End-to-end check**

1. Open `/guestbook/`.
2. Submit an anonymous message with Turnstile.
3. Confirm it is absent from the public list while pending.
4. Open `/admin/guestbook/` in a fresh session and confirm no moderation data is visible before login.
5. Log in with the configured password.
6. Approve the message and confirm it appears publicly.
7. Hide it and confirm it disappears.
8. Delete it.
9. Confirm `/friends/` redirects to `/guestbook/`.
10. Confirm the splash GIF is unchanged.

