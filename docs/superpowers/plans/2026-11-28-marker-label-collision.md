# Marker Label Collision Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Resolve travel-globe label collisions by priority in screen space and let a clicked location temporarily outrank every other label.

**Architecture:** Add explicit place priorities to the travel data, extract collision and label-fade rules into a pure module, and project each marker label to a screen-space rectangle inside its Three.js frame loop. The marker keeps its light beam visible while only its label fades.

**Tech Stack:** Next.js, TypeScript, React Three Fiber, Three.js, Node test runner, Playwright Core

**Spec:** `docs/superpowers/specs/2026-11-28-marker-label-collision-design.md`

## Global Constraints

- Hangzhou priority is `100`.
- Capital priority is `80`; Tokyo is the current capital.
- Shanghai and Osaka priority are `60`.
- Bali and Brunei priority are `40`.
- Missing `labelPriority` defaults to `40`; provided values must be finite and positive.
- Selected locations receive `Number.MAX_SAFE_INTEGER` temporary priority.
- Equal priorities resolve by stable data order.
- Labels participate only when they face the camera and pass the existing horizon check.
- Collision rectangles use a `4px` margin.
- Only labels fade; beams, caps, surface dots, hit proxies, and routes remain visible.
- Hidden labels fade out over about `180ms`; visible labels restore immediately.
- Keep the existing transparent hit proxy radius `0.018`.
- Run tests, TypeScript, production build, desktop/mobile browser checks, code review, and deployment before completion.

---

### Task 1: Add place label priorities

**Files:**
- Modify: `XHBlogs/lib/travel.ts`
- Modify: `XHBlogs/data/travel.ts`
- Test: `XHBlogs/tests/travel.test.mjs`

**Interfaces:**
- Produces: `TravelPlace.labelPriority?: number`
- Produces: `DEFAULT_LABEL_PRIORITY = 40`
- Produces: `travelPlaceLabelPriority(place: Pick<TravelPlace, "labelPriority">): number`

- [ ] **Step 1: Write the failing data tests**

Add tests that assert:

```js
assert.equal(travelPlaceLabelPriority({}), 40);
assert.throws(
  () => validateTravelPlaces([{ ...tokyo, labelPriority: 0 }]),
  /标签优先级/,
);
assert.throws(
  () => validateTravelPlaces([{ ...tokyo, labelPriority: Number.NaN }]),
  /标签优先级/,
);
```

Extend the current destination test to assert:

```js
assert.equal(
  Object.fromEntries(travelPlaces.map((place) => [place.id, place.labelPriority])),
  { bali: 40, brunei: 40, osaka: 60, tokyo: 80, shanghai: 60 },
);
```

- [ ] **Step 2: Run the focused tests and verify they fail**

Run from `XHBlogs`:

```powershell
node --test tests/travel.test.mjs
```

Expected: FAIL because `labelPriority` and `travelPlaceLabelPriority` do not exist.

- [ ] **Step 3: Implement the priority contract**

Add:

```ts
labelPriority?: number;
```

to `TravelPlace`, then export:

```ts
export const DEFAULT_LABEL_PRIORITY = 40;

export function travelPlaceLabelPriority(
  place: Pick<TravelPlace, "labelPriority">,
) {
  return place.labelPriority ?? DEFAULT_LABEL_PRIORITY;
}
```

In `validatePlace`, reject non-finite or non-positive priorities with an error containing `标签优先级`.

Assign the confirmed values in `data/travel.ts`.

- [ ] **Step 4: Run the focused tests and verify they pass**

Run from `XHBlogs`:

```powershell
node --test tests/travel.test.mjs
```

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add XHBlogs/lib/travel.ts XHBlogs/data/travel.ts XHBlogs/tests/travel.test.mjs
git commit -m "feat: prioritize travel labels"
```

### Task 2: Implement the pure collision and fade rules

**Files:**
- Create: `XHBlogs/lib/markerLabels.ts`
- Create: `XHBlogs/tests/marker-labels.test.mjs`

**Interfaces:**
- Produces: `MarkerLabelRect`
- Produces: `MarkerLabelCandidate`
- Produces: `resolveMarkerLabelVisibility(candidates, margin = 4): Record<string, boolean>`
- Produces: `advanceLabelLayoutOpacity(current, targetVisible, deltaSeconds): number`

- [ ] **Step 1: Write failing collision tests**

Create tests covering:

```js
const labels = [
  { id: "hangzhou", priority: 100, eligible: true, rect: box(0, 0, 100, 20) },
  { id: "shanghai", priority: 60, eligible: true, rect: box(50, 10, 100, 20) },
  { id: "bali", priority: 40, eligible: true, rect: box(250, 0, 100, 20) },
];

assert.deepEqual(resolveMarkerLabelVisibility(labels), {
  hangzhou: true,
  shanghai: false,
  bali: true,
});
```

Also assert:

- Capital `80` beats major city `60`.
- Selected priority `Number.MAX_SAFE_INTEGER` beats Hangzhou `100`.
- Equal priorities keep the first input eligible.
- Ineligible labels never hide eligible labels.
- A non-overlapping layout keeps every eligible label visible.
- `advanceLabelLayoutOpacity` waits around 180ms to hide and restores immediately.

- [ ] **Step 2: Run the focused tests and verify they fail**

Run from `XHBlogs`:

```powershell
node --test tests/marker-labels.test.mjs
```

Expected: FAIL because the module does not exist.

- [ ] **Step 3: Implement the pure module**

Implement AABB intersection with the `4px` margin. Sort eligible labels by descending priority and then original array index. Keep a label only when it does not overlap an already kept label. Return `false` for every ineligible candidate.

Implement:

```ts
export function advanceLabelLayoutOpacity(
  current: number,
  targetVisible: boolean,
  deltaSeconds: number,
) {
  if (targetVisible) return 1;
  if (!Number.isFinite(deltaSeconds) || deltaSeconds <= 0) return current;
  const next = current * Math.exp(-deltaSeconds / 0.18);
  return next < 0.01 ? 0 : next;
}
```

- [ ] **Step 4: Run the focused tests and verify they pass**

Run from `XHBlogs`:

```powershell
node --test tests/marker-labels.test.mjs
```

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add XHBlogs/lib/markerLabels.ts XHBlogs/tests/marker-labels.test.mjs
git commit -m "feat: resolve marker label collisions"
```

### Task 3: Project and apply collision results in the globe

**Files:**
- Modify: `XHBlogs/components/TravelGlobe.tsx`
- Modify: `XHBlogs/tests/ziyeluo-config.test.mjs`

**Interfaces:**
- Consumes: `resolveMarkerLabelVisibility`, `advanceLabelLayoutOpacity`, and `travelPlaceLabelPriority`.
- Produces: marker labels whose opacity depends on `horizon visibility * layout visibility * interaction opacity`.

- [ ] **Step 1: Write the failing integration contract test**

Assert that `TravelGlobe.tsx` contains:

```js
assert.match(globe, /resolveMarkerLabelVisibility/);
assert.match(globe, /advanceLabelLayoutOpacity/);
assert.match(globe, /labelLayoutRef/);
assert.match(globe, /travelPlaceLabelPriority/);
assert.match(globe, /priority=\{SELECTED_LABEL_PRIORITY\}/);
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run from `XHBlogs`:

```powershell
node --test tests/ziyeluo-config.test.mjs
```

Expected: FAIL because collision projection is not connected.

- [ ] **Step 3: Add screen-space projection**

Create one shared `labelLayoutRef` in `TravelScene`. Each `Marker` receives it plus its `labelPriority`.

Inside the marker frame loop:

1. Set the marker scale.
2. Compute the label world center from the group matrix.
3. Project the center and camera-right/camera-up offsets into CSS pixels.
4. Store or replace the marker's `MarkerLabelCandidate` in `labelLayoutRef.current`.
5. Resolve all candidates with `resolveMarkerLabelVisibility`.
6. Multiply the label material opacity by a separately smoothed `layoutOpacity`.

Skip collision participation when the cap is not horizon-visible or when projected coordinates are not finite.

Use `Number.MAX_SAFE_INTEGER` for the selected marker's priority.

- [ ] **Step 4: Remove stale registrations**

Delete each marker id from `labelLayoutRef.current` on unmount so an old label rectangle cannot hide a current marker.

- [ ] **Step 5: Run the focused tests and verify they pass**

Run from `XHBlogs`:

```powershell
node --test tests/ziyeluo-config.test.mjs
node --test tests/marker-labels.test.mjs
```

Expected: PASS.

- [ ] **Step 6: Add real browser interaction verification**

Start the dev server and use Chromium with WebGL. Rotate to East Asia and verify:

- Non-overlapping labels are visible.
- Overlapping labels keep the higher-priority city.
- Clicking a lower-priority beam makes its label visible and fades overlapping labels.
- Closing the detail panel restores priority order.
- Beams remain visible while labels are hidden.
- Repeat a basic touch-sized viewport check.

- [ ] **Step 7: Run full verification**

Run from `XHBlogs`:

```powershell
$env:CI='true'; pnpm test
$env:CI='true'; pnpm exec tsc --noEmit
$env:CI='true'; pnpm build
```

Expected: all commands exit successfully.

- [ ] **Step 8: Review, commit, and deploy**

Request an independent read-only code review. Address Critical and Important findings, commit, merge to `main`, push to the deployment remote, and verify the production site.
