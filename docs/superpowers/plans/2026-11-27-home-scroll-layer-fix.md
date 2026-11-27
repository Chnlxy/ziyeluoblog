# Homepage Scroll Layer Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prevent the homepage search field from visually covering the desktop navigation when the navigation reappears during upward scrolling.

**Architecture:** Keep the search dropdown above the fixed navigation only while it is open. When the search is closed, give its container a lower stacking order than the navigation so the opaque navigation cleanly covers scrolled page content.

**Tech Stack:** Next.js 16, React 19, Tailwind CSS 4, Node test runner

**Spec:** User report on 2026-11-27 with screenshots showing the homepage search field and desktop navigation overlapping during upward scrolling. Live DOM inspection confirmed the closed search container had `z-index: 100` while the header had `z-index: 50`.

## Global Constraints

- Preserve the existing desktop navigation retract/reappear behavior.
- Preserve search result layering while the user is searching.
- Change only the stacking behavior required to fix the overlap.
- Verify the production static export before deployment.

---

### Task 1: Make Search Layering State-Aware

**Files:**
- Modify: `XHBlogs/components/SearchBar.tsx`
- Test: `XHBlogs/tests/ziyeluo-config.test.mjs`

**Interfaces:**
- Consumes: `isOpen: boolean` state already declared in `SearchBar`.
- Produces: A closed search container below the header (`z-40`) and an open search container above it (`z-[100]`).

- [ ] **Step 1: Write the failing test**

```js
test("keeps the closed search below the desktop navigation", () => {
  const searchBar = fs.readFileSync(
    path.join(root, "components", "SearchBar.tsx"),
    "utf8",
  );

  assert.doesNotMatch(
    searchBar,
    /className="relative w-full max-w-2xl mx-auto mb-10 z-\[100\]"/,
  );
  assert.match(
    searchBar,
    /isOpen\s*\?\s*["']z-\[100\]["']\s*:\s*["']z-40["']/,
  );
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- --test-name-pattern="keeps the closed search below"`

Expected: FAIL because the search container still has an unconditional `z-[100]`.

- [ ] **Step 3: Write minimal implementation**

```tsx
<div
  className={`relative w-full max-w-2xl mx-auto mb-10 ${
    isOpen ? "z-[100]" : "z-40"
  }`}
  ref={containerRef}
>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test -- --test-name-pattern="keeps the closed search below"`

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
git add XHBlogs/components/SearchBar.tsx XHBlogs/tests/ziyeluo-config.test.mjs docs/superpowers/plans/2026-11-27-home-scroll-layer-fix.md
git commit -m "fix: keep search below navigation when closed"
```

Deploy through the existing GitHub API workflow because direct Git push previously failed with a connection reset. Confirm the new GitHub Actions Pages run succeeds before reporting completion.
