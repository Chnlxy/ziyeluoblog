# Stable Scrollbar Gutter Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stop the fixed background from shifting when navigating between moment list and detail pages.

**Architecture:** Reserve a permanent vertical scrollbar gutter on the root document. This keeps the effective viewport width stable when a route has enough content to scroll and another route does not.

**Tech Stack:** CSS, Next.js static export, Node test runner

**Spec:** User report on 2026-11-27. Browser measurement showed the list page background at `1270px` wide with a 10px scrollbar, while the shorter detail page expanded the background to `1280px`.

## Global Constraints

- The background must keep the same dimensions when entering and leaving a detail page.
- Existing custom scrollbar styling must remain unchanged.
- Mobile overlay-scrollbar behavior may remain unchanged because it does not reserve layout width.

---

### Task 1: Reserve the Root Scrollbar Gutter

**Files:**
- Modify: `XHBlogs/app/globals.css`
- Test: `XHBlogs/tests/ziyeluo-config.test.mjs`

**Interfaces:**
- Consumes: The existing root `html` base styles.
- Produces: `scrollbar-gutter: stable` on the document root.

- [ ] **Step 1: Write the failing test**

```js
test("reserves scrollbar space so the fixed background never shifts", () => {
  const styles = fs.readFileSync(
    path.join(root, "app", "globals.css"),
    "utf8",
  );

  assert.match(styles, /html\s*\{[^}]*scrollbar-gutter:\s*stable;/s);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test --test-name-pattern="fixed background never shifts" tests/ziyeluo-config.test.mjs`

Expected: FAIL because `scrollbar-gutter` is not defined.

- [ ] **Step 3: Write minimal implementation**

```css
html {
  min-height: 100%;
  scroll-behavior: smooth;
  scrollbar-gutter: stable;
  background: #1b1c18;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test --test-name-pattern="fixed background never shifts" tests/ziyeluo-config.test.mjs`

Expected: PASS.

- [ ] **Step 5: Run full verification**

Run:

```powershell
pnpm test
pnpm exec tsc --noEmit
pnpm build
```

Expected: 30 tests pass, TypeScript exits 0, and the static export builds successfully.

- [ ] **Step 6: Verify background geometry**

Measure `/moments/` and `/moments/2026-11-27-welcome/` in a desktop browser. The background image `width` and `height` must be exactly equal before and after navigation. Do not require `documentElement.clientWidth` to equal the background width; Chromium can report the pre-gutter viewport there even though the fixed background already uses the stable gutter geometry.

- [ ] **Step 7: Commit and deploy**

```powershell
git add XHBlogs/app/globals.css XHBlogs/tests/ziyeluo-config.test.mjs docs/superpowers/plans/2026-11-27-stable-scrollbar-gutter.md
git commit -m "fix: stabilize background during navigation"
```

Deploy through the existing GitHub API workflow and verify GitHub Pages succeeds.
