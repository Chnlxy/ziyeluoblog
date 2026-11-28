# First-Load Texture Tier Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prevent desktop browsers from requesting mobile Earth textures during the first hydration pass.

**Architecture:** Represent the unresolved media breakpoint as `null`. Do not mount the WebGL canvas or its texture loaders until the media query has resolved to desktop or mobile; keep the existing loading overlay visible during that gap, then mount only the correct texture set.

**Tech Stack:** React 19, Next.js static export, TypeScript, Three.js, Node test runner

**Spec:** User reported that the first page load still uses the mobile Earth texture on desktop; the accepted fix is to determine the viewport tier before loading any Earth texture.

## Global Constraints

- Preserve `matchMedia("(min-width: 768px)")` as the breakpoint.
- Desktop must request only `earth-day.jpg` and `earth-night.jpg` during its first Earth load.
- Mobile must continue to request `earth-day-medium.jpg` and `earth-night-medium.jpg`.
- Keep the loading overlay and loading animation visible until the selected textures are ready.
- Do not add new dependencies or another texture download.

---

### Task 1: Gate Earth loading on a resolved texture tier

**Files:**

- Modify: `XHBlogs/components/TravelGlobe.tsx`
- Test: `XHBlogs/tests/ziyeluo-config.test.mjs`

**Interfaces:**

- Consumes: browser `matchMedia("(min-width: 768px)")`
- Produces: `useDesktopTextureSet(): boolean | null` and a single loading-state expression used by both the Canvas and overlay

- [ ] **Step 1: Write the failing regression test**

```javascript
test("resolves the texture tier before loading Earth images", () => {
  const globe = fs.readFileSync(
    path.join(root, "components", "TravelGlobe.tsx"),
    "utf8",
  );

  assert.match(globe, /useState<boolean \| null>\(null\)/);
  assert.match(
    globe,
    /const globeLoading =\s*desktopTextures === null \|\| !texturesReady/,
  );
  assert.match(
    globe,
    /desktopTextures !== null && \(\s*<Canvas/,
  );
  assert.match(globe, /aria-hidden=\{!globeLoading\}/);
  assert.match(globe, /globeLoading \? "opacity-100" : "opacity-0"/);
});
```

- [ ] **Step 2: Run the regression test and confirm it fails**

```powershell
$env:CI='true'; pnpm exec node --test --test-name-pattern="resolves the texture tier" tests/ziyeluo-config.test.mjs
```

Expected: FAIL because the hook currently initializes to `false` and mounts Canvas immediately.

- [ ] **Step 3: Gate the Canvas on a resolved breakpoint**

Change the hook state to:

```typescript
const [desktop, setDesktop] = useState<boolean | null>(null);
```

In `TravelGlobe`, derive:

```typescript
const globeLoading = desktopTextures === null || !texturesReady;
```

Wrap the Canvas with:

```tsx
{desktopTextures !== null && (
  <Canvas
    className={`globe-canvas ${
      texturesReady ? "globe-canvas--ready" : "opacity-0"
    }`}
    aria-label="旅行足迹地球"
  >
    <TravelScene
      desktopTextures={desktopTextures}
    />
  </Canvas>
)}
```

Use `globeLoading` for the overlay:

```tsx
<div
  aria-live="polite"
  aria-hidden={!globeLoading}
  className={`... ${
    globeLoading ? "opacity-100" : "opacity-0"
  }`}
>
```

- [ ] **Step 4: Run the regression test and confirm it passes**

```powershell
$env:CI='true'; pnpm exec node --test --test-name-pattern="resolves the texture tier" tests/ziyeluo-config.test.mjs
```

Expected: PASS.

- [ ] **Step 5: Verify and commit**

```powershell
$env:CI='true'; pnpm test
$env:CI='true'; pnpm exec tsc --noEmit
$env:CI='true'; pnpm build
git add XHBlogs/components/TravelGlobe.tsx XHBlogs/tests/ziyeluo-config.test.mjs docs/superpowers/plans/2026-11-28-first-load-texture-tier.md
git commit -m "fix: resolve earth texture tier before loading"
```

Then run the built site in a fresh desktop browser context with cache disabled and verify that the first Earth image requests are the desktop files only.
