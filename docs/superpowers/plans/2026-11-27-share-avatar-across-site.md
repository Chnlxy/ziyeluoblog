# Shared Site Avatar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Use the homepage illustration as the shared avatar on the homepage, about page, article author panels, and moments pages.

**Architecture:** Make `siteConfig.avatarUrl` the single site-wide avatar URL and remove the temporary `homeAvatarUrl` split. `ProfileCard` will consume the same shared value as every other avatar consumer.

**Tech Stack:** Next.js 16, React 19, Node test runner

**Spec:** User request on 2026-11-27: “关于的头像换成首页一样的”.

## Global Constraints

- Every author avatar uses `/images/avatars/home.webp`.
- The splash GIF remains unchanged.
- Existing avatar dimensions, rounding, and object-fit behavior remain unchanged.

---

### Task 1: Consolidate All Non-Splash Avatars

**Files:**
- Modify: `XHBlogs/siteConfig.ts`
- Modify: `XHBlogs/components/ProfileCard.tsx`
- Test: `XHBlogs/tests/ziyeluo-config.test.mjs`

**Interfaces:**
- Produces: `siteConfig.avatarUrl = "/images/avatars/home.webp"`.
- Removes: `siteConfig.homeAvatarUrl`.

- [ ] **Step 1: Write the failing test**

```js
test("uses the homepage illustration as the shared site avatar", () => {
  const config = fs.readFileSync(path.join(root, "siteConfig.ts"), "utf8");
  const profile = fs.readFileSync(
    path.join(root, "components", "ProfileCard.tsx"),
    "utf8",
  );

  assert.match(config, /avatarUrl:\s*"\/images\/avatars\/home\.webp"/);
  assert.doesNotMatch(config, /homeAvatarUrl/);
  assert.match(profile, /siteConfig\.avatarUrl/);
  assert.doesNotMatch(profile, /siteConfig\.homeAvatarUrl/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test --test-name-pattern="homepage illustration as the shared site avatar" tests/ziyeluo-config.test.mjs`

Expected: FAIL because the old placeholder and split homepage setting still exist.

- [ ] **Step 3: Write minimal implementation**

```ts
avatarUrl: "/images/avatars/home.webp",
```

```tsx
<img src={siteConfig.avatarUrl} ... />
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test --test-name-pattern="homepage illustration as the shared site avatar" tests/ziyeluo-config.test.mjs`

Expected: PASS.

- [ ] **Step 5: Run full verification**

Run:

```powershell
pnpm test
pnpm exec tsc --noEmit
pnpm build
```

Expected: 37 tests pass, TypeScript exits 0, and the static export builds successfully.

- [ ] **Step 6: Browser verification**

Open the homepage and about page and confirm both images resolve to `/images/avatars/home.webp`; confirm the splash still resolves to `/images/splash-praying-girl.gif`.

- [ ] **Step 7: Commit and deploy**

```powershell
git add XHBlogs/siteConfig.ts XHBlogs/components/ProfileCard.tsx XHBlogs/tests/ziyeluo-config.test.mjs docs/superpowers/plans/2026-11-27-share-avatar-across-site.md
git commit -m "style: share homepage avatar across site"
```

Deploy through the existing GitHub API workflow; Cloudflare Pages will rebuild from `main`.
