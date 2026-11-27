# Homepage Social Links Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish the owner's Bilibili and GitHub profiles as homepage social buttons.

**Architecture:** Keep URLs in `siteConfig.social` as the single source of truth. Add a Bilibili icon type to the existing homepage social button component and enable the already-supported GitHub link.

**Tech Stack:** Next.js 16, React 19, TypeScript, Node test runner

**Spec:** User request on 2026-11-27 for Bilibili `https://space.bilibili.com/1283960511` and GitHub `https://github.com/Chnlxy` on the homepage.

## Global Constraints

- Both links open in a new tab with `noopener noreferrer`.
- Empty social entries remain hidden.
- Only the homepage profile card is changed.
- Existing social button styling and dimensions remain unchanged.

---

### Task 1: Configure and Render the Two Public Profiles

**Files:**
- Modify: `XHBlogs/siteConfig.ts`
- Modify: `XHBlogs/components/ProfileCard.tsx`
- Test: `XHBlogs/tests/ziyeluo-config.test.mjs`

**Interfaces:**
- Produces: `siteConfig.social.bilibili: string`
- Updates: `siteConfig.social.github`
- Consumes: Existing `SocialBtn` and `url`/`onClick` handling.

- [ ] **Step 1: Write the failing test**

```js
test("publishes Bilibili and GitHub on the homepage", () => {
  const config = fs.readFileSync(path.join(root, "siteConfig.ts"), "utf8");
  const profile = fs.readFileSync(
    path.join(root, "components", "ProfileCard.tsx"),
    "utf8",
  );

  assert.match(
    config,
    /bilibili:\s*"https:\/\/space\.bilibili\.com\/1283960511"/,
  );
  assert.match(
    config,
    /github:\s*"https:\/\/github\.com\/Chnlxy"/,
  );
  assert.match(profile, /type="bilibili"/);
  assert.match(profile, /siteConfig\.social\?\.bilibili/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test --test-name-pattern="publishes Bilibili and GitHub" tests/ziyeluo-config.test.mjs`

Expected: FAIL because the URLs and Bilibili button are missing.

- [ ] **Step 3: Implement the configuration and icon**

```ts
social: {
  github: "https://github.com/Chnlxy",
  bilibili: "https://space.bilibili.com/1283960511",
  gitee: "",
  google: "",
  email: "",
  qq: "",
  wechat: "",
},
```

```tsx
<SocialBtn type="bilibili" url={siteConfig.social?.bilibili} />
<SocialBtn type="github" url={siteConfig.social?.github} />
```

Add a `case "bilibili"` icon using the existing `w-4 h-4 desktop:w-5 desktop:h-5` sizing.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test --test-name-pattern="publishes Bilibili and GitHub" tests/ziyeluo-config.test.mjs`

Expected: PASS.

- [ ] **Step 5: Run full verification**

Run:

```powershell
pnpm test
pnpm exec tsc --noEmit
pnpm build
```

Expected: 31 tests pass, TypeScript exits 0, and the static export builds successfully.

- [ ] **Step 6: Browser verification**

Open the homepage and confirm both new-tab links are visible and point to the requested profiles.

- [ ] **Step 7: Commit and deploy**

```powershell
git add XHBlogs/siteConfig.ts XHBlogs/components/ProfileCard.tsx XHBlogs/tests/ziyeluo-config.test.mjs docs/superpowers/plans/2026-11-27-homepage-social-links.md
git commit -m "feat: add homepage social profiles"
```

Deploy through the existing GitHub API workflow and verify GitHub Pages succeeds.
