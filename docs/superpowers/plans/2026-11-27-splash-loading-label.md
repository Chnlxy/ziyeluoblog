# Splash Loading Label Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the splash-screen author name with “少女祈祷中” followed by a looping loading-dot animation.

**Architecture:** Keep the existing avatar, ring, progress bar, and exit animation. Add three decorative dot spans in `SplashScreen` and animate them with one reusable CSS keyframe.

**Tech Stack:** React 19, CSS, Node test runner

**Spec:** User request on 2026-11-27 for the splash text to read “少女祈祷中” and add looping dots during loading.

## Global Constraints

- The splash text must read `少女祈祷中`.
- The suffix cycles through zero to three dots.
- The avatar, ring, progress bar, and English subtitle remain visible.
- Reduced-motion behavior remains controlled by the existing global media query.

---

### Task 1: Add the Animated Loading Label

**Files:**
- Modify: `XHBlogs/components/SplashScreen.tsx`
- Modify: `XHBlogs/app/globals.css`
- Test: `XHBlogs/tests/ziyeluo-config.test.mjs`

**Interfaces:**
- Produces: `.splash-dot` decorative dot spans.
- Produces: `@keyframes splash-dot`.

- [ ] **Step 1: Write the failing test**

```js
test("uses the praying maiden loading label in the splash screen", () => {
  const splash = fs.readFileSync(
    path.join(root, "components", "SplashScreen.tsx"),
    "utf8",
  );
  const styles = fs.readFileSync(
    path.join(root, "app", "globals.css"),
    "utf8",
  );

  assert.match(splash, /少女祈祷中/);
  assert.equal((splash.match(/splash-dot/g) ?? []).length, 3);
  assert.match(styles, /\.splash-dot\s*\{/);
  assert.match(styles, /@keyframes splash-dot/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test --test-name-pattern="praying maiden loading label" tests/ziyeluo-config.test.mjs`

Expected: FAIL because the text and animation do not exist.

- [ ] **Step 3: Write minimal implementation**

```tsx
<h1>
  少女祈祷中
  <span className="splash-dots" aria-hidden="true">
    <span className="splash-dot">.</span>
    <span className="splash-dot">.</span>
    <span className="splash-dot">.</span>
  </span>
</h1>
```

```css
.splash-dot {
  opacity: 0;
  animation: splash-dot 1.2s steps(1, end) infinite;
}

@keyframes splash-dot {
  0%,
  20% {
    opacity: 0;
  }
  25%,
  80% {
    opacity: 1;
  }
  85%,
  100% {
    opacity: 0;
  }
}
```

Set delays of `0s`, `0.2s`, and `0.4s` for the three dots.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test --test-name-pattern="praying maiden loading label" tests/ziyeluo-config.test.mjs`

Expected: PASS.

- [ ] **Step 5: Run full verification**

Run:

```powershell
pnpm test
pnpm exec tsc --noEmit
pnpm build
```

Expected: 32 tests pass, TypeScript exits 0, and the static export builds successfully.

- [ ] **Step 6: Browser verification**

Reload the home page and capture the splash during the first two seconds. Confirm the visible label is `少女祈祷中` and dot opacity changes over at least two animation frames.

- [ ] **Step 7: Commit and deploy**

```powershell
git add XHBlogs/components/SplashScreen.tsx XHBlogs/app/globals.css XHBlogs/tests/ziyeluo-config.test.mjs docs/superpowers/plans/2026-11-27-splash-loading-label.md
git commit -m "feat: animate splash loading label"
```

Deploy through the existing GitHub API workflow and verify GitHub Pages succeeds.
