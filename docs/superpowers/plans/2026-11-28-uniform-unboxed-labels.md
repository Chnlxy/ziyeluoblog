# Tiered Boxed Globe Labels Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Render every travel-globe label inside a visible rounded box attached to its own priority-height light cap.

**Architecture:** Remove the obsolete label-tier positioning from the marker component. Keep the fixed label Sprite dimensions for screen-space collision detection, and attach each label to its own priority-derived cap height while restoring the rounded canvas background.

**Tech Stack:** Next.js, TypeScript, React Three Fiber, Three.js, Node test runner, Playwright Core

**Spec:** Approved bounded adjustment in the conversation: labels attach to each marker's top cap; keep the rounded background and border; collision continues to use the `MARKER_LABEL_WIDTH × MARKER_LABEL_HEIGHT` rectangle.

## Global Constraints

- Light-cap heights are home `0.13`, capital `0.11`, major city `0.09`, other `0.07`.
- Labels use each marker's calculated cap position.
- Render the rounded translucent background and border.
- Keep readable light text inside the box.
- Keep `MARKER_LABEL_WIDTH = 0.28` and `MARKER_LABEL_HEIGHT = 0.07` for collision only.
- Keep label priorities, collision selection, click-to-front behavior, fades, ray geometry, and hit proxy unchanged.
- Remove the obsolete `assignMarkerLabelTiers` behavior and its tests.
- Run tests, TypeScript, production build, browser screenshots, and review before deployment.

---

### Task 1: Attach boxed labels to their priority-height caps

**Files:**
- Modify: `XHBlogs/components/TravelGlobe.tsx`
- Modify: `XHBlogs/lib/travel.ts`
- Modify: `XHBlogs/tests/travel.test.mjs`
- Modify: `XHBlogs/tests/ziyeluo-config.test.mjs`

**Interfaces:**
- Consumes: `MARKER_LABEL_WIDTH`, `MARKER_LABEL_HEIGHT`, and `markerPriorityHeight()`.
- Produces: a `Marker` without `labelTier`, a dynamically positioned label, and a text-only label texture.

- [x] **Step 1: Update tests for the new label contract**

Remove `assignMarkerLabelTiers` tests and source assertions. Assert instead:

```js
assert.match(globe, /const beamHeight = markerPriorityHeight\(labelPriority\);/);
assert.match(globe, /position=\{\[0, beamHeight, 0\]\}/);
assert.match(globe, /context\.roundRect/);
assert.match(globe, /context\.fillStyle/);
assert.match(globe, /context\.strokeStyle/);
assert.doesNotMatch(globe, /context\.shadowColor/);
assert.doesNotMatch(globe, /MARKER_LABEL_STAGGER/);
```

- [x] **Step 2: Run the focused tests and verify they fail**

Run from `XHBlogs`:

```powershell
node --test tests/ziyeluo-config.test.mjs
node --test tests/travel.test.mjs
```

Expected: FAIL because labels still use text-shadow-only rendering and an offset above the cap.

- [x] **Step 3: Implement plain labels at cap height**

In `createMarkerLabelTexture`, restore the original rounded translucent fill and border:

```tsx
context.fillStyle = "rgba(24, 25, 20, 0.9)";
context.beginPath();
context.roundRect(8, 20, 496, 88, 44);
context.fill();
context.strokeStyle = "rgba(234, 220, 157, 0.85)";
context.lineWidth = 3;
context.stroke();
```

Remove `MARKER_LABEL_STAGGER`, `labelTier`, `labelTiers`, and the `assignMarkerLabelTiers` import and call path. Position the Sprite with:

```tsx
const beamHeight = markerPriorityHeight(labelPriority);

<sprite position={[0, beamHeight, 0]}>
```

In `lib/travel.ts`, remove `MARKER_LABEL_PROXIMITY` and `assignMarkerLabelTiers`.

- [x] **Step 4: Run focused tests and verify they pass**

Run from `XHBlogs`:

```powershell
node --test tests/ziyeluo-config.test.mjs
node --test tests/travel.test.mjs
```

Expected: PASS.

- [x] **Step 5: Run full verification**

Run from `XHBlogs`:

```powershell
$env:CI='true'; pnpm test
$env:CI='true'; pnpm exec tsc --noEmit
$env:CI='true'; pnpm build
```

Expected: all commands exit successfully.

- [x] **Step 6: Verify visually**

Open `/footprints` in Chromium, rotate to East Asia, and confirm:

- Every visible label has the same rounded translucent box and border treatment.
- Each visible label is attached to its own priority-height light cap.
- Overlapping labels still resolve by priority.
- Clicking a ray still raises its label and fades overlapping labels.

- [x] **Step 7: Review, commit, merge, and deploy**

Run an independent read-only review, address Critical and Important findings, commit, merge to `main`, push, and verify the production page.

### Task 2: Color marker rays by priority

**Files:**
- Modify: `XHBlogs/lib/markerLabels.ts`
- Modify: `XHBlogs/tests/marker-labels.test.mjs`
- Modify: `XHBlogs/components/TravelGlobe.tsx`

**Interfaces:**
- Produces: `markerPriorityColor(priority, active)`
- Produces: `markerPriorityHeight(priority)`
- Produces color constants for home, capital, major city, other place, and active selection.

- [x] **Step 1: Write the failing color tests**

Cover:

```js
assert.equal(markerPriorityColor(100, false), "#b7d7a8");
assert.equal(markerPriorityColor(80, false), "#f4ca6a");
assert.equal(markerPriorityColor(60, false), "#7dc9e8");
assert.equal(markerPriorityColor(40, false), "#c6a9e8");
assert.equal(markerPriorityColor(40, true), "#fff1ad");
```

- [x] **Step 2: Run the focused test and verify it fails**

Run from `XHBlogs`:

```powershell
node --test tests/marker-labels.test.mjs
```

Expected: FAIL because `markerPriorityColor` does not exist.

- [x] **Step 3: Implement the priority palette**

Use the approved colors and select them by priority threshold. Active selected or keyboard-focused markers use the active color before checking priority.

In `TravelGlobe.tsx`, replace the old selected/selectable color expression with:

```tsx
const color = markerPriorityColor(
  labelPriority,
  selected || focused,
);
```

- [x] **Step 4: Run focused tests and verify they pass**

Run from `XHBlogs`:

```powershell
node --test tests/marker-labels.test.mjs
node --test tests/ziyeluo-config.test.mjs
```

Expected: PASS.

- [x] **Step 5: Verify the combined visual result**

Confirm all labels use the rounded box and are attached to their own priority-height caps, while beams, caps, and surface dots use the correct priority color. Clicking a lower-priority location must still make it active-colored and raise its label.
