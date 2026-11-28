# Detail Panel Exit Positioning Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep the travel detail panel in its desktop overlay position throughout its close animation.

**Architecture:** The `--panel-open` class is removed as soon as `selectedId` becomes null, but `AnimatePresence` keeps the exiting panel mounted for another 300ms. Make the desktop `.travel-detail-motion` positioning independent of the open-state class, because the element only exists while the detail panel is open or exiting.

**Tech Stack:** React, Framer Motion, CSS, Node test runner

**Spec:** User reported that location information briefly appears below the globe while the detail panel closes; the accepted behavior is for the panel to fade out in its existing right-side position.

## Global Constraints

- Desktop detail positioning uses the existing `@media (min-width: 1280px)` breakpoint.
- Do not change the panel's open animation or content.
- Preserve the globe slide/clip restoration during close.
- Mobile and tablet layouts remain unchanged.

---

### Task 1: Position the exiting panel without the open-state class

**Files:**

- Modify: `XHBlogs/app/globals.css`
- Test: `XHBlogs/tests/ziyeluo-config.test.mjs`

**Interfaces:**

- Consumes: `.travel-detail-motion` from `FootprintsClient.tsx`
- Produces: a desktop absolute-positioning rule that applies whenever the detail motion element exists

- [ ] **Step 1: Write the failing regression test**

```javascript
test("keeps the closing detail panel in its overlay position", () => {
  const styles = fs.readFileSync(
    path.join(root, "app", "globals.css"),
    "utf8",
  );

  assert.match(
    styles,
    /@media \(min-width: 1280px\)[\s\S]*?\.travel-detail-motion\s*\{[\s\S]*?position:\s*absolute;/,
  );
  assert.doesNotMatch(
    styles,
    /\.footprints-layout--panel-open\s+\.travel-detail-motion/,
  );
});
```

- [ ] **Step 2: Run the regression test and confirm it fails**

```powershell
$env:CI='true'; pnpm exec node --test --test-name-pattern="closing detail panel" tests/ziyeluo-config.test.mjs
```

Expected: FAIL because absolute positioning is still tied to `--panel-open`.

- [ ] **Step 3: Move the desktop positioning rule**

Inside `@media (min-width: 1280px)`, replace:

```css
.footprints-layout--panel-open .travel-detail-motion {
  position: absolute;
  top: 0;
  right: 0;
  z-index: 10;
  width: 390px;
  padding-top: 0;
}
```

with:

```css
.travel-detail-motion {
  position: absolute;
  top: 0;
  right: 0;
  z-index: 10;
  width: 390px;
  padding-top: 0;
}
```

- [ ] **Step 4: Run the regression test and confirm it passes**

```powershell
$env:CI='true'; pnpm exec node --test --test-name-pattern="closing detail panel" tests/ziyeluo-config.test.mjs
```

Expected: PASS.

- [ ] **Step 5: Verify and commit**

```powershell
$env:CI='true'; pnpm test
$env:CI='true'; pnpm exec tsc --noEmit
$env:CI='true'; pnpm build
git add XHBlogs/app/globals.css XHBlogs/tests/ziyeluo-config.test.mjs docs/superpowers/plans/2026-11-28-detail-exit-positioning.md
git commit -m "fix: keep closing detail panel in overlay"
```

Then click a desktop destination and close it while observing the transition; the panel must fade and collapse on the right without appearing below the globe.
