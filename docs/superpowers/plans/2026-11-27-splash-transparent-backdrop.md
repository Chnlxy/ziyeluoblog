# Transparent Splash GIF Backdrop Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let the splash GIF’s transparent area show the splash-screen background instead of a white circular block.

**Architecture:** Remove the inner wrapper’s white/dark background, padding, and shadow. The GIF remains inside the existing 128px area, but its transparent pixels now reveal the `#151611` splash background directly.

**Tech Stack:** React 19, Tailwind CSS, Node test runner

**Spec:** User request on 2026-11-27: “gif后面的无色区块直接用背景色”.

## Global Constraints

- No white or slate block appears behind the GIF.
- The splash background remains `#151611`.
- The GIF keeps its 128px display area, animation, contain sizing, and pixelated rendering.
- Loading text, dots, subtitle, and progress bar remain unchanged.

---

### Task 1: Make the GIF Backdrop Transparent

**Files:**
- Modify: `XHBlogs/components/SplashScreen.tsx`
- Test: `XHBlogs/tests/ziyeluo-config.test.mjs`

**Interfaces:**
- Replaces the inner image wrapper classes.
- Preserves `siteConfig.splashImageUrl`.

- [ ] **Step 1: Write the failing test**

```js
test("shows the splash background behind the GIF", () => {
  const splash = fs.readFileSync(
    path.join(root, "components", "SplashScreen.tsx"),
    "utf8",
  );

  assert.doesNotMatch(splash, /bg-white\/95/);
  assert.doesNotMatch(splash, /dark:bg-slate-900/);
  assert.doesNotMatch(splash, /shadow-xl/);
  assert.match(splash, /bg-transparent/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test --test-name-pattern="splash background behind the GIF" tests/ziyeluo-config.test.mjs`

Expected: FAIL because the white wrapper classes still exist.

- [ ] **Step 3: Write minimal implementation**

```tsx
<div className="relative h-full w-full bg-transparent">
  <img
    src={siteConfig.splashImageUrl}
    alt=""
    fetchPriority="high"
    className="h-full w-full rounded-full object-contain [image-rendering:pixelated]"
  />
</div>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test --test-name-pattern="splash background behind the GIF" tests/ziyeluo-config.test.mjs`

Expected: PASS.

- [ ] **Step 5: Run full verification**

Run:

```powershell
pnpm test
pnpm exec tsc --noEmit
pnpm build
```

Expected: 35 tests pass, TypeScript exits 0, and the static export builds successfully.

- [ ] **Step 6: Browser verification**

Reload the homepage, capture the splash, and confirm the GIF transparency reveals the dark splash background with no white or slate circular block.

- [ ] **Step 7: Commit and deploy**

```powershell
git add XHBlogs/components/SplashScreen.tsx XHBlogs/tests/ziyeluo-config.test.mjs docs/superpowers/plans/2026-11-27-splash-transparent-backdrop.md
git commit -m "style: blend splash GIF into background"
```

Deploy through the existing GitHub API workflow and verify GitHub Pages succeeds.
