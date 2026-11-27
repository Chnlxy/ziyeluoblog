# 光柱顶端球帽地平线淡出 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 地标在光柱顶端完整可见时保持不透明，只在顶端圆球逐渐被地球遮挡时淡出，并在圆球完全不可见时精确变为透明。

**Architecture:** 把光柱顶端的发光小球视为具有真实半径的三维球体。利用摄像机位置与地球边缘切平面的距离，分别计算圆球“开始被遮挡”和“完全不可见”的边界，在这两个边界之间做平滑过渡。

**Tech Stack:** TypeScript、Three.js、React Three Fiber、Node.js test runner

**Spec:** 用户要求“淡出条件为完全看不到光柱最顶端时完全淡出”；线上反馈表明上一版仍在顶端完整可见时提前淡出。

## Global Constraints

- 光柱高度保持 `0.07`。
- 顶端发光球半径保持 `0.018`。
- 顶端圆球完整可见时地标保持完全不透明。
- 顶端圆球哪怕仍有一部分可见，地标就不能完全消失。
- 顶端圆球完全不可见时地标可见度必须精确为 `0`。
- 标记缩放时，光柱长度和顶端球半径必须同步参与计算。

---

### Task 1: 按顶端圆球的遮挡过程计算淡出

**Files:**
- Modify: `XHBlogs/lib/travel.ts:354-369`
- Modify: `XHBlogs/components/TravelGlobe.tsx:22-35`
- Modify: `XHBlogs/components/TravelGlobe.tsx:312-333`
- Test: `XHBlogs/tests/travel.test.mjs:311-345`

**Interfaces:**
- Consumes: `markerPosition` 为光柱根部坐标，`cameraPosition` 为摄像机世界坐标。
- Produces: `markerHorizonVisibility(markerPosition, cameraPosition, beamTipOffset, capRadius)`；`beamTipOffset` 和 `capRadius` 都是经过标记缩放后的世界尺寸。

- [ ] **Step 1: 写会失败的行为测试**

```javascript
test("keeps the marker visible while any part of its cap remains visible", () => {
  const markerBase = latLngToVector3([0, 0], 1.003);
  const cameraAt = (x) => [x, Math.sqrt(9 - x ** 2), 0];
  const visibilityAt = (x) =>
    markerHorizonVisibility(markerBase, cameraAt(x), 0.07, 0.018);

  assert.equal(visibilityAt(1), 1);
  const partiallyHidden = visibilityAt(0.9);
  assert.ok(partiallyHidden > 0 && partiallyHidden < 1);
  assert.equal(visibilityAt(0.87), 0);
  assert.equal(
    markerHorizonVisibility(markerBase, [-3, 0, 0], 0.07, 0.018),
    0,
  );
});
```

- [ ] **Step 2: 运行测试并确认正确失败**

Run: `pnpm exec node --test --test-name-pattern="fades only while" tests/travel.test.mjs`

Expected: FAIL；当前函数在 `x = 0.9` 时已经降到 `0`，但摄像机能看到的圆球靠近摄像机的一侧仍在球体地平线外，说明它在圆球仍部分可见时就提前消失。

- [ ] **Step 3: 写最小实现**

```typescript
export function markerHorizonVisibility(
  markerPosition: [number, number, number],
  cameraPosition: [number, number, number],
  beamTipOffset: number,
  capRadius: number,
) {
  const normal = normalize(markerPosition);
  const beamTipRadius = Math.hypot(...markerPosition) + beamTipOffset;
  const tipPosition = normal.map(
    (value) => value * beamTipRadius,
  ) as [number, number, number];
  const cameraLength = Math.hypot(...cameraPosition);
  const centerHorizon = dot(cameraPosition, tipPosition) - 1;
  const capProjection = capRadius * cameraLength;
  const fullyVisible = centerHorizon - capProjection;
  const fullyHidden = centerHorizon + capProjection;

  if (fullyVisible >= 0) return 1;
  if (fullyHidden <= 0) return 0;

  const amount = fullyHidden / (fullyHidden - fullyVisible);
  return amount * amount * (3 - 2 * amount);
}
```

组件增加 `MARKER_CAP_RADIUS = 0.018`，在计算缩放后传入世界尺寸：

```typescript
const markerScale =
  Math.max(0.75, camera.position.length() / 3.2) *
  (selected || focused ? 1.22 : 1);
const visibility = markerHorizonVisibility(
  [position.x, position.y, position.z],
  [camera.position.x, camera.position.y, camera.position.z],
  MARKER_BEAM_HEIGHT * markerScale,
  MARKER_CAP_RADIUS * markerScale,
);
```

- [ ] **Step 4: 运行测试并确认通过**

Run: `pnpm test`

Expected: 全部测试 PASS，无失败输出。

- [ ] **Step 5: 运行类型检查和构建**

Run: `pnpm exec tsc --noEmit`

Expected: exit 0。

Run: `pnpm build`

Expected: exit 0，`/footprints` 路由正常生成。

- [ ] **Step 6: 提交**

```bash
git add XHBlogs/lib/travel.ts XHBlogs/components/TravelGlobe.tsx XHBlogs/tests/travel.test.mjs docs/superpowers/plans/2026-11-28-beam-cap-horizon-fade.md
git commit -m "fix: fade markers while cap crosses horizon"
```
