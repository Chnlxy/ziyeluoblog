import assert from "node:assert/strict";
import test from "node:test";

import {
  advanceLabelLayoutOpacity,
  resolveMarkerLabelVisibility,
} from "../lib/markerLabels.ts";

const box = (left, top, width, height) => ({
  left,
  top,
  right: left + width,
  bottom: top + height,
});

const label = (id, priority, rect, eligible = true) => ({
  id,
  priority,
  eligible,
  rect,
});

test("keeps every eligible label when rectangles do not overlap", () => {
  const visibility = resolveMarkerLabelVisibility([
    label("hangzhou", 100, box(0, 0, 100, 20)),
    label("tokyo", 80, box(120, 0, 100, 20)),
    label("bali", 40, box(240, 0, 100, 20)),
  ]);

  assert.deepEqual(visibility, {
    hangzhou: true,
    tokyo: true,
    bali: true,
  });
});

test("keeps Hangzhou when it overlaps another place", () => {
  const visibility = resolveMarkerLabelVisibility([
    label("hangzhou", 100, box(0, 0, 100, 20)),
    label("shanghai", 60, box(50, 10, 100, 20)),
  ]);

  assert.deepEqual(visibility, {
    hangzhou: true,
    shanghai: false,
  });
});

test("keeps a capital over a major city", () => {
  const visibility = resolveMarkerLabelVisibility([
    label("osaka", 60, box(0, 0, 100, 20)),
    label("tokyo", 80, box(20, 0, 100, 20)),
  ]);

  assert.deepEqual(visibility, {
    osaka: false,
    tokyo: true,
  });
});

test("lets a clicked low-priority place outrank Hangzhou", () => {
  const visibility = resolveMarkerLabelVisibility([
    label("hangzhou", 100, box(0, 0, 100, 20)),
    label(
      "shanghai",
      Number.MAX_SAFE_INTEGER,
      box(10, 0, 100, 20),
    ),
  ]);

  assert.deepEqual(visibility, {
    hangzhou: false,
    shanghai: true,
  });
});

test("uses stable input order when priorities tie", () => {
  const visibility = resolveMarkerLabelVisibility([
    label("first", 60, box(0, 0, 100, 20)),
    label("second", 60, box(20, 0, 100, 20)),
  ]);

  assert.deepEqual(visibility, {
    first: true,
    second: false,
  });
});

test("does not let an ineligible label hide a visible label", () => {
  const visibility = resolveMarkerLabelVisibility([
    label("hangzhou", 100, box(0, 0, 100, 20)),
    label("hidden", 80, box(10, 0, 100, 20), false),
  ]);

  assert.deepEqual(visibility, {
    hangzhou: true,
    hidden: false,
  });
});

test("treats labels within the collision margin as overlapping", () => {
  const visibility = resolveMarkerLabelVisibility([
    label("hangzhou", 100, box(0, 0, 100, 20)),
    label("tokyo", 80, box(102, 0, 100, 20)),
  ]);

  assert.deepEqual(visibility, {
    hangzhou: true,
    tokyo: false,
  });
});

test("fades hidden labels gradually and restores them immediately", () => {
  let opacity = 1;
  for (let frame = 0; frame < 30; frame += 1) {
    opacity = advanceLabelLayoutOpacity(opacity, false, 1 / 60);
  }

  assert.ok(opacity > 0 && opacity < 0.1);
  assert.equal(advanceLabelLayoutOpacity(opacity, true, 1 / 60), 1);
});
