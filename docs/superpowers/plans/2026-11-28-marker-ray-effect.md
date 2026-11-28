# Marker Ray Effect Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the travel globe’s beacon markers into extremely thin luminous rays without changing their height, labels, hit areas, horizon behavior, or label tiers.

**Architecture:** Keep the existing marker component and interactions. Reduce the cylinder and sphere radii, then make the three marker elements additive and untone-mapped so they read as light rather than solid geometry.

**Tech Stack:** Next.js, TypeScript, React Three Fiber, Three.js, Node test runner, Playwright Core

**Spec:** Approved bounded design in the conversation: beam top `0.0012`, beam base `0.0026`, cap `0.005`, surface dot `0.006`; keep beam height `0.07`; enable additive glow on all three marker elements.

## Global Constraints

- Keep `MARKER_BEAM_HEIGHT` at `0.07`.
- Keep `MARKER_SURFACE_RADIUS` at `1.003`.
- Keep label size, label tiers, click hit areas, hover behavior, and selection scaling unchanged.
- Keep the horizon fade based on the actual cap radius.
- Use additive blending and `toneMapped={false}` for the beam, cap, and surface dot.
- Run tests, TypeScript, production build, and a real browser screenshot before completion.

---

### Task 1: Convert marker geometry into luminous rays

**Files:**
- Modify: `XHBlogs/tests/ziyeluo-config.test.mjs`
- Modify: `XHBlogs/components/TravelGlobe.tsx`

**Interfaces:**
- Consumes: `MARKER_BEAM_HEIGHT`, `MARKER_CAP_RADIUS`, and the existing marker materials.
- Produces: final thin ray constants and additive marker materials.

- [x] **Step 1: Write the failing regression test**

Update the travel-globe source contract assertions:

```js
assert.match(globe, /const MARKER_BEAM_TOP_RADIUS = 0\.0012;/);
assert.match(globe, /const MARKER_BEAM_BASE_RADIUS = 0\.0026;/);
assert.match(globe, /const MARKER_CAP_RADIUS = 0\.005;/);
assert.match(globe, /const MARKER_SURFACE_DOT_RADIUS = 0\.006;/);
assert.equal(
  (globe.match(/blending=\{THREE\.AdditiveBlending\}/g) ?? []).length,
  3,
);
assert.equal(
  (globe.match(/toneMapped=\{false\}/g) ?? []).length,
  3,
);
```

- [x] **Step 2: Run the focused test and verify it fails**

Run from `XHBlogs`:

```powershell
node --test tests/ziyeluo-config.test.mjs
```

Expected: FAIL because the current radii and material settings still describe the previous solid marker style.

- [x] **Step 3: Implement the approved ray geometry and materials**

Use:

```tsx
const MARKER_BEAM_TOP_RADIUS = 0.0012;
const MARKER_BEAM_BASE_RADIUS = 0.0026;
const MARKER_CAP_RADIUS = 0.005;
const MARKER_SURFACE_DOT_RADIUS = 0.006;
const MARKER_HIT_RADIUS = 0.018;
```

Add `blending={THREE.AdditiveBlending}` and `toneMapped={false}` to the surface-dot, beam, and cap materials.

Add one invisible cylindrical hit proxy around the beam with `MARKER_HIT_RADIUS`, `opacity={0}`, and `colorWrite={false}` so the visual geometry can stay thin without reducing the clickable area.

- [x] **Step 4: Run the focused test and verify it passes**

Run from `XHBlogs`:

```powershell
node --test tests/ziyeluo-config.test.mjs
```

Expected: all tests in the file pass.

- [x] **Step 5: Keep the horizon test aligned with the smaller cap**

Update both explicit cap arguments in `XHBlogs/tests/travel.test.mjs` to `0.005` and choose hand-checked boundary points around the new first visible camera position.

- [x] **Step 6: Run full automated verification**

Run from `XHBlogs`:

```powershell
$env:CI='true'; pnpm test
$env:CI='true'; pnpm exec tsc --noEmit
$env:CI='true'; pnpm build
```

Expected: all three commands exit successfully.

- [x] **Step 7: Verify the ray effect visually**

Start the development server, open `/footprints` in a Chromium browser with WebGL, rotate to East Asia, and capture a desktop screenshot. Confirm the beam is visibly narrower and luminous, labels remain separated, and hit targets still work.

- [x] **Step 8: Review and commit**

Request an independent read-only code review of the complete diff. Address Critical and Important findings, commit the final changes, then present integration options.
