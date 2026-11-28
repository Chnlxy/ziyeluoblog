# First-Load Cloud Fallback Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Guarantee cloud lighting and atmospheric depth on the first visible globe frame while loading the current NASA cloud map asynchronously.

**Architecture:** Bundle a lightweight public-domain satellite-cloud fallback. Render it immediately when the desktop atmosphere mounts, and replace its texture in place when the NASA GIBS image finishes decoding. Keep the loading overlay visible until the local fallback cloud texture is ready.

**Tech Stack:** Next.js, TypeScript, React Three Fiber, Three.js, NASA GIBS, Node test runner, Playwright Core

**Spec:** User approved the diagnosis and fix: bundle a lightweight fallback cloud image for immediate lighting, then fade/swap to the NASA current cloud map after it loads.

## Global Constraints

- Desktop atmosphere must render with a local fallback texture on its first frame.
- Keep the NASA GIBS current-observation texture as the eventual source.
- If NASA fails or is slow, retain the fallback instead of showing an empty cloud layer.
- Do not add another heavyweight Earth texture.
- Mobile behavior remains unchanged and must not load the desktop cloud fallback unnecessarily.
- Keep the loading overlay visible until Earth textures and the desktop fallback cloud texture are both ready.
- Keep the fallback asset reasonably small and document its source.
- Use test-first development, browser verification with a cold cache, code review, and deployment.

---

### Task 1: Bundle and test the fallback cloud asset

**Files:**
- Create: `XHBlogs/public/images/globe/clouds-fallback.jpg`
- Modify: `XHBlogs/public/images/globe/README.md`
- Modify: `XHBlogs/tests/celestial.test.mjs`

**Interfaces:**
- Produces: `/images/globe/clouds-fallback.jpg`, a local 1024×512 satellite-cloud texture.

- [x] **Step 1: Write failing asset tests**

Add assertions that the fallback file exists, is under `250 KB`, and that its JPEG header reports `1024×512`.

- [x] **Step 2: Run the focused test and verify it fails**

Run from `XHBlogs`:

```powershell
node --test tests/celestial.test.mjs
```

Expected: FAIL because the fallback file does not exist.

- [x] **Step 3: Generate the fallback asset**

Download the NASA GIBS `VIIRS_NOAA20_CorrectedReflectance_TrueColor` global map used by `gibsCloudMapUrl()`, resize it to `1024×512`, and save it as quality-optimized JPEG under `250 KB`.

Document the source and resize in `public/images/globe/README.md`.

- [x] **Step 4: Run the focused test and verify it passes**

Run from `XHBlogs`:

```powershell
node --test tests/celestial.test.mjs
```

Expected: PASS.

### Task 2: Render the fallback before NASA finishes

**Files:**
- Modify: `XHBlogs/components/EarthAtmosphere.tsx`
- Modify: `XHBlogs/components/TravelGlobe.tsx`
- Modify: `XHBlogs/tests/celestial.test.mjs`
- Modify: `XHBlogs/tests/ziyeluo-config.test.mjs`

**Interfaces:**
- Consumes: `/images/globe/clouds-fallback.jpg`
- Produces: `onReady: () => void` from `EarthAtmosphere`
- Produces: a loading overlay that waits for the desktop fallback cloud layer.

- [x] **Step 1: Write failing integration tests**

Assert that:

```js
assert.match(atmosphere, /clouds-fallback\.jpg/);
assert.match(atmosphere, /uHasClouds: \{ value: 1 \}/);
assert.match(atmosphere, /fallbackCloudTexture/);
assert.match(atmosphere, /onReady/);
assert.match(globe, /atmosphereReady/);
assert.match(globe, /desktopTextures.*atmosphereReady/s);
```

- [x] **Step 2: Run focused tests and verify they fail**

Run from `XHBlogs`:

```powershell
node --test tests/celestial.test.mjs
node --test tests/ziyeluo-config.test.mjs
```

Expected: FAIL because the atmosphere has no fallback texture or readiness signal.

- [x] **Step 3: Initialize the atmosphere with the local cloud map**

In `EarthAtmosphere`, load the local fallback with `useLoader(THREE.TextureLoader, FALLBACK_CLOUD_MAP)`. Configure it like the remote texture, initialize `cloudMap` to it and `uHasClouds` to `1`, and compute `uCloudTexel` from its dimensions.

Keep the existing NASA request in an effect. When it succeeds, place it in `liveCloudMap`, enable `uHasLiveClouds`, update `uCloudTexel`, and crossfade `uCloudBlend` to `1` over `500ms`. Dispose only the replaced NASA textures on cleanup.

Call `onReady()` in an effect after the local fallback texture is available.

- [x] **Step 4: Delay desktop reveal until both layers are ready**

In `TravelGlobe`, track `atmosphereReady`. Pass `onAtmosphereReady` through `TravelScene` to a `Suspense`-wrapped desktop `EarthAtmosphere`.

Desktop loading is complete only when both Earth textures and atmosphere fallback are ready:

```tsx
const globeLoading =
  desktopTextures === null ||
  !texturesReady ||
  (desktopTextures && !atmosphereReady);
```

Mobile does not mount the atmosphere and must not wait for it.

- [x] **Step 5: Run focused tests**

```powershell
node --test tests/celestial.test.mjs
node --test tests/ziyeluo-config.test.mjs
```

Expected: PASS.

- [x] **Step 6: Run full verification**

```powershell
$env:CI='true'; pnpm test
$env:CI='true'; pnpm exec tsc --noEmit
$env:CI='true'; pnpm build
```

Expected: all commands exit successfully.

- [x] **Step 7: Verify cold-start behavior**

Use a fresh browser context with cache disabled, desktop viewport, and reduced motion. Confirm:

- The first visible globe already contains cloud lighting.
- The cold-load screenshot brightness is close to a warm-load screenshot.
- NASA loading later replaces the fallback without a geometry jump.
- Mobile still uses the existing mobile texture path without loading the desktop cloud image.

- [x] **Step 8: Review, commit, merge, and deploy**

Request an independent read-only review, address Critical and Important findings, commit, merge to `main`, push, and verify production.
