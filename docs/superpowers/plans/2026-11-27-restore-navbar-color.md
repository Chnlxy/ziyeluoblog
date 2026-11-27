# Restore Original Navigation Color Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore the desktop navigation surface to its original translucent `#171812` color while preserving the navigation retract behavior and the fixed search/search-layering behavior.

**Architecture:** Change only the navigation background opacity token. The previous value was `bg-[#171812]/65`; the current value is `bg-[#171812]/95`. The search fix already prevents overlap by keeping the closed search below the header.

**Tech Stack:** Next.js 16, React 19, Tailwind CSS 4, Node test runner

**Spec:** User request on 2026-11-27: “导航页颜色换成原来导航页的颜色吧”

## Global Constraints

- Restore the previous `bg-[#171812]/65` navigation surface.
- Preserve `backdrop-blur-2xl`, the shadow, and the existing border.
- Preserve navigation retract/reappear behavior.
- Preserve the closed-search-under-navigation and open-search-above-navigation layering.

---

### Task 1: Restore the Navigation Surface Opacity

**Files:**
- Modify: `XHBlogs/components/Navbar.tsx`
- Test: `XHBlogs/tests/ziyeluo-config.test.mjs`

**Interfaces:**
- Consumes: The existing desktop `<header>` class list.
- Produces: A desktop navigation header using `bg-[#171812]/65`.

- [ ] **Step 1: Write the failing test**

```js
test("restores the original desktop navigation surface", () => {
  const navbar = fs.readFileSync(
    path.join(root, "components", "Navbar.tsx"),
    "utf8",
  );

  assert.match(navbar, /bg-\[#171812\]\/65/);
  assert.doesNotMatch(navbar, /bg-\[#171812\]\/95/);
  assert.match(navbar, /backdrop-blur-2xl/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test --test-name-pattern="restores the original desktop navigation surface" tests/ziyeluo-config.test.mjs`

Expected: FAIL because `Navbar.tsx` still uses `bg-[#171812]/95`.

- [ ] **Step 3: Write minimal implementation**

```tsx
className={`fixed inset-x-0 top-0 z-50 hidden border-b border-white/10 bg-[#171812]/65 shadow-lg backdrop-blur-2xl transition-transform duration-300 md:block ${
  showHeader ? "translate-y-0" : "-translate-y-full"
}`}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test --test-name-pattern="restores the original desktop navigation surface" tests/ziyeluo-config.test.mjs`

Expected: PASS with zero failures.

- [ ] **Step 5: Run full verification**

Run:

```powershell
pnpm test
pnpm exec tsc --noEmit
pnpm build
```

Expected: all tests pass, TypeScript exits 0, and the static export builds successfully.

- [ ] **Step 6: Commit and deploy**

```powershell
git add XHBlogs/components/Navbar.tsx XHBlogs/tests/ziyeluo-config.test.mjs docs/superpowers/plans/2026-11-27-restore-navbar-color.md
git commit -m "style: restore original navigation color"
```

Deploy through the existing GitHub API workflow and verify the new GitHub Pages deployment succeeds.
