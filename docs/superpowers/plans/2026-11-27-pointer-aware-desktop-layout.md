# Pointer-Aware Desktop Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep the desktop navigation and homepage layout on mouse-driven desktop devices when browser zoom reduces the CSS viewport below the normal mobile breakpoints.

**Architecture:** Add Tailwind custom variants whose media query matches either the existing viewport breakpoint or a fine pointer with hover capability. Apply those variants only to the global navigation/mobile shell and homepage presentation so true touch devices keep the existing mobile behavior.

**Tech Stack:** Next.js 16, React 19, Tailwind CSS 4, Node test runner

**Spec:** User report on 2026-11-27 with a zoomed screenshot showing the desktop navigation replaced by the mobile navigation orb and the homepage using its mobile single-column layout.

## Global Constraints

- Desktop mouse devices must keep the desktop navigation at all browser zoom levels.
- Desktop mouse devices must keep the homepage’s 12-column composition.
- True mobile devices must retain the existing mobile navigation and single-column layout.
- Preserve navigation retract/reappear behavior.
- Preserve search layering and the restored navigation color.

---

### Task 1: Add Pointer-Aware Desktop Variants

**Files:**
- Modify: `XHBlogs/app/globals.css`
- Modify: `XHBlogs/components/Navbar.tsx`
- Modify: `XHBlogs/app/layout.tsx`
- Test: `XHBlogs/tests/ziyeluo-config.test.mjs`

**Interfaces:**
- Consumes: Tailwind CSS custom variant syntax.
- Produces: `desktop:` for the 768px equivalent and `desktop-wide:` for the 1024px equivalent.

- [ ] **Step 1: Write the failing test**

```js
test("keeps desktop navigation and layout on fine-pointer devices", () => {
  const styles = fs.readFileSync(
    path.join(root, "app", "globals.css"),
    "utf8",
  );
  const navbar = fs.readFileSync(
    path.join(root, "components", "Navbar.tsx"),
    "utf8",
  );
  const layout = fs.readFileSync(path.join(root, "app", "layout.tsx"), "utf8");
  const home = fs.readFileSync(path.join(root, "app", "page.tsx"), "utf8");

  assert.match(
    styles,
    /@custom-variant desktop \(@media \(min-width: 768px\), @media \(hover: hover\) and \(pointer: fine\)\);/,
  );
  assert.match(
    styles,
    /@custom-variant desktop-wide \(@media \(min-width: 1024px\), @media \(hover: hover\) and \(pointer: fine\)\);/,
  );
  assert.match(navbar, /hidden .*desktop:block/);
  assert.match(navbar, /desktop:hidden/);
  assert.match(layout, /desktop:hidden/);
  assert.match(home, /desktop-wide:grid-cols-12/);
  assert.doesNotMatch(home, /\blg:grid-cols-12/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test --test-name-pattern="keeps desktop navigation and layout on fine-pointer devices" tests/ziyeluo-config.test.mjs`

Expected: FAIL because the custom variants and `desktop:` classes do not exist.

- [ ] **Step 3: Write minimal implementation**

```css
@custom-variant desktop (@media (min-width: 768px), @media (hover: hover) and (pointer: fine));
@custom-variant desktop-wide (@media (min-width: 1024px), @media (hover: hover) and (pointer: fine));
```

```tsx
<header className="... hidden ... desktop:block ...">
<div className="desktop:hidden">
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test --test-name-pattern="keeps desktop navigation and layout on fine-pointer devices" tests/ziyeluo-config.test.mjs`

Expected: PASS with zero failures.

### Task 2: Preserve the Homepage Desktop Composition

**Files:**
- Modify: `XHBlogs/app/page.tsx`
- Modify: `XHBlogs/components/ProfileCard.tsx`
- Modify: `XHBlogs/components/HomeGallery.tsx`
- Modify: `XHBlogs/components/LatestPostsCarousel.tsx`
- Modify: `XHBlogs/components/HomeMoments.tsx`
- Test: `XHBlogs/tests/ziyeluo-config.test.mjs`

**Interfaces:**
- Consumes: `desktop:` and `desktop-wide:` from Task 1.
- Produces: Homepage classes that retain desktop columns and component spacing on fine-pointer devices.

- [ ] **Step 1: Replace homepage `md:` classes with `desktop:` and `lg:` classes with `desktop-wide:`**

Apply the mechanical rewrite only to the five homepage files listed above.

- [ ] **Step 2: Run the focused regression test**

Run: `node --test --test-name-pattern="keeps desktop navigation and layout on fine-pointer devices" tests/ziyeluo-config.test.mjs`

Expected: PASS.

- [ ] **Step 3: Run full verification**

Run:

```powershell
pnpm test
pnpm exec tsc --noEmit
pnpm build
```

Expected: all tests pass, TypeScript exits 0, and the static export builds successfully.

- [ ] **Step 4: Verify at a zoom-equivalent narrow viewport**

Open the generated site in a fine-pointer desktop browser, set a narrow CSS viewport below 768px, and confirm:

- the desktop header is visible;
- the mobile navigation orb is absent;
- the homepage remains a 12-column layout;
- the desktop background remains selected.

- [ ] **Step 5: Commit and deploy**

```powershell
git add XHBlogs/app/globals.css XHBlogs/app/layout.tsx XHBlogs/components/Navbar.tsx XHBlogs/app/page.tsx XHBlogs/components/ProfileCard.tsx XHBlogs/components/HomeGallery.tsx XHBlogs/components/LatestPostsCarousel.tsx XHBlogs/components/HomeMoments.tsx XHBlogs/tests/ziyeluo-config.test.mjs docs/superpowers/plans/2026-11-27-pointer-aware-desktop-layout.md
git commit -m "fix: preserve desktop layout at browser zoom"
```

Deploy through the existing GitHub API workflow and verify the GitHub Pages deployment succeeds.
