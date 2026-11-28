# Thin Travel Globe Markers Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the travel globe beacon beams and top caps visibly thinner without changing their height, placement, labels, or interaction.

**Architecture:** The marker geometry is already centralized in `TravelGlobe.tsx`. Extract the beam radii into named constants, reduce the confirmed dimensions, and preserve the existing horizon calculations by continuing to pass the new cap radius into `markerHorizonVisibility`.

**Tech Stack:** Next.js, TypeScript, React Three Fiber, Three.js, Node test runner

**Spec:** The approved second-tier design supersedes the initial dimensions: cap radius `0.0085`, beam top radius `0.0025`, beam bottom radius `0.0055`, surface dot radius `0.009`, beam height unchanged at `0.07`, and neighboring labels separated by coordinate-based label tiers.

## Global Constraints

- Keep `MARKER_BEAM_HEIGHT` at `0.07`.
- Keep `MARKER_SURFACE_RADIUS` at `1.003`.
- Keep selection scaling and marker interactions unchanged.
- Assign nearby labels distinct tiers from their coordinates so future additions such as Yokohama do not depend on array order.
- Keep the label stagger greater than the label height so adjacent label rectangles cannot overlap.
- Follow test-first development and run the full verification suite before completion.

---

### Task 1: Thin the beacon geometry

**Files:**
- Modify: `XHBlogs/tests/ziyeluo-config.test.mjs`
- Modify: `XHBlogs/components/TravelGlobe.tsx`

**Interfaces:**
- Consumes: `markerHorizonVisibility(base, camera, beamHeight, capRadius)`.
- Produces: `MARKER_BEAM_TOP_RADIUS`, `MARKER_BEAM_BASE_RADIUS`, and `MARKER_CAP_RADIUS` constants used with the existing marker geometry.

- [x] **Step 1: Write the failing regression test**

Add assertions to the existing travel-globe source contract test:

```js
assert.match(globe, /const MARKER_BEAM_TOP_RADIUS = 0\.004;/);
assert.match(globe, /const MARKER_BEAM_BASE_RADIUS = 0\.0075;/);
assert.match(globe, /const MARKER_CAP_RADIUS = 0\.012;/);
assert.match(
  globe,
  /args=\{\[\s*MARKER_BEAM_TOP_RADIUS,\s*MARKER_BEAM_BASE_RADIUS,\s*MARKER_BEAM_HEIGHT,/,
);
```

- [x] **Step 2: Run the focused test and verify it fails**

Run from `XHBlogs`:

```powershell
node --test tests/ziyeluo-config.test.mjs
```

Expected: the test fails because the radius constants and named cylinder arguments do not exist yet.

- [x] **Step 3: Implement the confirmed dimensions**

In `XHBlogs/components/TravelGlobe.tsx`, add the constants and use them:

```tsx
const MARKER_BEAM_HEIGHT = 0.07;
const MARKER_BEAM_TOP_RADIUS = 0.004;
const MARKER_BEAM_BASE_RADIUS = 0.0075;
const MARKER_CAP_RADIUS = 0.012;
```

```tsx
<cylinderGeometry
  args={[
    MARKER_BEAM_TOP_RADIUS,
    MARKER_BEAM_BASE_RADIUS,
    MARKER_BEAM_HEIGHT,
    10,
    1,
    true,
  ]}
/>
```

- [x] **Step 4: Run the focused test and verify it passes**

Run from `XHBlogs`:

```powershell
node --test tests/ziyeluo-config.test.mjs
```

Expected: all tests in the file pass.

- [x] **Step 5: Keep the horizon test aligned with the thinner cap**

Update the two explicit `0.018` cap arguments in `XHBlogs/tests/travel.test.mjs` to `0.012`, and adjust the boundary x-values to the first front-facing point for a `0.012` cap. Run:

```powershell
node --test tests/travel.test.mjs
```

Expected: all travel behavior tests pass.

- [x] **Step 6: Run full verification**

Run from `XHBlogs`:

```powershell
$env:CI='true'; pnpm test
$env:CI='true'; pnpm exec tsc --noEmit
$env:CI='true'; pnpm build
```

Expected: all three commands exit successfully with no test failures or type errors.

- [x] **Step 7: Review and commit**

Review the diff for unintended geometry changes, commit the implementation and this plan, then report verification evidence.

### Task 2: Reduce the markers again and stagger nearby labels

**Files:**
- Modify: `XHBlogs/tests/ziyeluo-config.test.mjs`
- Modify: `XHBlogs/components/TravelGlobe.tsx`

**Interfaces:**
- Consumes: the marker constants and geometry from Task 1.
- Produces: a `labelTier` marker prop populated by `assignMarkerLabelTiers()` and separated vertically by `MARKER_LABEL_STAGGER`.

- [x] **Step 1: Write the failing regression test**

Update the existing marker assertions and add:

```js
assert.match(globe, /const MARKER_BEAM_TOP_RADIUS = 0\.0025;/);
assert.match(globe, /const MARKER_BEAM_BASE_RADIUS = 0\.0055;/);
assert.match(globe, /const MARKER_CAP_RADIUS = 0\.0085;/);
assert.match(globe, /const MARKER_SURFACE_DOT_RADIUS = 0\.009;/);
assert.match(globe, /const MARKER_LABEL_STAGGER = 0\.09;/);
assert.match(
  globe,
  /assignMarkerLabelTiers\(\[\s*hangzhouHome\.coordinates,\s*\.\.\.places\.map/,
);
assert.match(globe, /labelTier=\{labelTiers\[index \+ 1\]\}/);
assert.match(globe, /labelTier \* MARKER_LABEL_STAGGER/);
```

- [x] **Step 2: Run the focused test and verify it fails**

Run from `XHBlogs`:

```powershell
node --test tests/ziyeluo-config.test.mjs
```

Expected: the test fails because the second-tier constants and label-tier behavior do not exist yet.

- [x] **Step 3: Implement the second-tier geometry and staggered labels**

Use the confirmed constants:

```tsx
const MARKER_BEAM_TOP_RADIUS = 0.0025;
const MARKER_BEAM_BASE_RADIUS = 0.0055;
const MARKER_CAP_RADIUS = 0.0085;
const MARKER_SURFACE_DOT_RADIUS = 0.009;
const MARKER_LABEL_WIDTH = 0.28;
const MARKER_LABEL_HEIGHT = 0.07;
const MARKER_LABEL_STAGGER = 0.09;
```

Assign tiers from nearby coordinates and pass the result to each place marker:

```tsx
const labelTiers = useMemo(
  () =>
    assignMarkerLabelTiers([
      hangzhouHome.coordinates,
      ...places.map((place) => place.coordinates),
    ]),
  [places],
);
```

```tsx
labelTier={labelTiers[index + 1]}
```

Use the tier in the sprite position:

```tsx
position={[
  0,
  MARKER_BEAM_HEIGHT +
    MARKER_LABEL_HEIGHT +
    labelTier * MARKER_LABEL_STAGGER,
  0,
]}
scale={[MARKER_LABEL_WIDTH, MARKER_LABEL_HEIGHT, 1]}
```

- [x] **Step 4: Run the focused test and verify it passes**

Run from `XHBlogs`:

```powershell
node --test tests/ziyeluo-config.test.mjs
```

Expected: all tests in the file pass.

- [x] **Step 5: Keep the horizon test aligned with the second-tier cap**

Update both explicit cap arguments in `XHBlogs/tests/travel.test.mjs` to `0.0085` and adjust the boundary points to the first front-facing x-value for that cap.

- [x] **Step 6: Run full verification**

Run from `XHBlogs`:

```powershell
$env:CI='true'; pnpm test
$env:CI='true'; pnpm exec tsc --noEmit
$env:CI='true'; pnpm build
```

Expected: all three commands exit successfully with no test failures or type errors.

- [x] **Step 7: Review and commit**

Review the complete diff for unintended changes, commit the final implementation and plan, then report verification evidence.
