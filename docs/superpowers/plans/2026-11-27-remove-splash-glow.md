# Remove Splash Glow Ring Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the colored glowing border around the animated splash artwork while preserving the rest of the loading screen.

**Architecture:** Delete the decorative `splash-ring` layer and its now-unused spin animation. Keep the white circular image backdrop, GIF, loading text, dots, subtitle, and progress bar unchanged.

**Tech Stack:** React 19, CSS, Node test runner

**Spec:** User request on 2026-11-27: “不要头像发光边框”.

## Global Constraints

- No colored glow or animated halo remains around the splash image.
- The GIF, loading label, dots, subtitle, and progress bar remain unchanged.
- Unused splash-ring CSS must be removed.

---

### Task 1: Remove the Glow Layer

**Files:**
- Modify: `XHBlogs/components/SplashScreen.tsx`
- Modify: `XHBlogs/app/globals.css`
- Test: `XHBlogs/tests/ziyeluo-config.test.mjs`

**Interfaces:**
- Removes: `.splash-ring` markup and animation.
- Preserves: `.splash-dot`, `.splash-progress`, and `.splash-screen`.

- [ ] **Step 1: Write the failing test**

```js
test("does not render a glowing ring around the splash artwork", () => {
  const splash = fs.readFileSync(
    path.join(root, "components", "SplashScreen.tsx"),
    "utf8",
  );
  const styles = fs.readFileSync(
    path.join(root, "app", "globals.css"),
    "utf8",
  );

  assert.doesNotMatch(splash, /splash-ring/);
  assert.doesNotMatch(styles, /\.splash-ring/);
  assert.doesNotMatch(styles, /@keyframes splash-spin/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test --test-name-pattern="glowing ring around the splash artwork" tests/ziyeluo-config.test.mjs`

Expected: FAIL because the glow markup and CSS still exist.

- [ ] **Step 3: Remove the glow**

Delete this element:

```tsx
<div className="splash-ring absolute -inset-1.5 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-60 blur-[3px]" />
```

Delete the `.splash-ring` rule and `@keyframes splash-spin`.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test --test-name-pattern="glowing ring around the splash artwork" tests/ziyeluo-config.test.mjs`

Expected: PASS.

- [ ] **Step 5: Run full verification**

Run:

```powershell
pnpm test
pnpm exec tsc --noEmit
pnpm build
```

Expected: 34 tests pass, TypeScript exits 0, and the static export builds successfully.

- [ ] **Step 6: Browser verification**

Reload the homepage and inspect the splash image. Confirm there is no gradient/blur halo and the GIF plus loading dots still animate.

- [ ] **Step 7: Commit and deploy**

```powershell
git add XHBlogs/components/SplashScreen.tsx XHBlogs/app/globals.css XHBlogs/tests/ziyeluo-config.test.mjs docs/superpowers/plans/2026-11-27-remove-splash-glow.md
git commit -m "style: remove splash glow ring"
```

Deploy through the existing GitHub API workflow and verify GitHub Pages succeeds.
