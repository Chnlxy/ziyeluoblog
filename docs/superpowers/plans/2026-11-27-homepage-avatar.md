# Homepage Avatar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace only the homepage profile-card avatar with the supplied illustration.

**Architecture:** Add a dedicated `homeAvatarUrl` entry to `siteConfig`, publish a web-optimized copy of the supplied image, and update `ProfileCard` to consume that entry. Other avatar consumers remain unchanged.

**Tech Stack:** Next.js 16, React 19, Pillow, Node test runner

**Spec:** User-supplied 460×461 JPG on 2026-11-27 with the instruction “首页头像换为这个”.

## Global Constraints

- Only the homepage profile card changes avatar.
- Splash GIF and all other avatar usages remain unchanged.
- The image asset is published locally under `public/images/avatars`.
- The homepage avatar keeps its existing dimensions, rounding, and cropping behavior.

---

### Task 1: Add the Homepage-Specific Avatar

**Files:**
- Create: `XHBlogs/public/images/avatars/home.webp`
- Modify: `XHBlogs/siteConfig.ts`
- Modify: `XHBlogs/components/ProfileCard.tsx`
- Test: `XHBlogs/tests/ziyeluo-config.test.mjs`

**Interfaces:**
- Produces: `siteConfig.homeAvatarUrl`
- Consumes: Existing `ProfileCard` avatar `<img>`.

- [ ] **Step 1: Write the failing test**

```js
test("uses a dedicated homepage avatar", () => {
  const config = fs.readFileSync(path.join(root, "siteConfig.ts"), "utf8");
  const profile = fs.readFileSync(
    path.join(root, "components", "ProfileCard.tsx"),
    "utf8",
  );
  const asset = path.join(
    root,
    "public",
    "images",
    "avatars",
    "home.webp",
  );

  assert.match(config, /homeAvatarUrl:\s*"\/images\/avatars\/home\.webp"/);
  assert.ok(fs.existsSync(asset));
  assert.match(profile, /siteConfig\.homeAvatarUrl/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test --test-name-pattern="dedicated homepage avatar" tests/ziyeluo-config.test.mjs`

Expected: FAIL because the configuration and asset do not exist.

- [ ] **Step 3: Create the web asset**

Convert the supplied image to a 384×384 WebP and save it as:

`XHBlogs/public/images/avatars/home.webp`

- [ ] **Step 4: Write minimal implementation**

```ts
homeAvatarUrl: "/images/avatars/home.webp",
```

```tsx
<img
  src={siteConfig.homeAvatarUrl}
  alt="avatar"
  className="w-full h-full rounded-lg desktop:rounded-xl object-cover bg-white"
/>
```

- [ ] **Step 5: Run test to verify it passes**

Run: `node --test --test-name-pattern="dedicated homepage avatar" tests/ziyeluo-config.test.mjs`

Expected: PASS.

- [ ] **Step 6: Run full verification**

Run:

```powershell
pnpm test
pnpm exec tsc --noEmit
pnpm build
```

Expected: 36 tests pass, TypeScript exits 0, and the static export builds successfully.

- [ ] **Step 7: Browser verification**

Reload the homepage and confirm the profile-card image resolves to `/images/avatars/home.webp`; confirm the splash GIF still uses `splashImageUrl`.

- [ ] **Step 8: Commit and deploy**

```powershell
git add XHBlogs/public/images/avatars/home.webp XHBlogs/siteConfig.ts XHBlogs/components/ProfileCard.tsx XHBlogs/tests/ziyeluo-config.test.mjs docs/superpowers/plans/2026-11-27-homepage-avatar.md
git commit -m "feat: update homepage avatar"
```

Deploy through the existing GitHub API workflow; Cloudflare Pages will rebuild from the same commit.
