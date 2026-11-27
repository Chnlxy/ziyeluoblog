# 光柱顶端地平线淡出 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让地标在地球上保持可见，直到光柱最顶端完全被地球挡住时才完成淡出。

**Architecture:** 将地标可见度计算从“地标基准点与地球表面的关系”改为“光柱顶端与真实球面地平线的关系”。组件把光柱高度传给可见度函数，所有地标元素继续共享同一可见度值。

**Tech Stack:** TypeScript、Three.js、React Three Fiber、Node.js test runner

**Spec:** 用户要求“淡出条件为完全看不到光柱最顶端时完全淡出”

## Global Constraints

- 光柱继续从现有地表基准半径 `1.003` 出发。
- 光柱高度继续使用 `0.07`，本次不改变尺寸。
- 顶端仍可见时地标不能提前完全消失。
- 顶端完全越过球面地平线时可见度必须精确为 `0`。

---

### Task 1: 以光柱顶端计算地平线淡出

**Files:**
- Modify: `XHBlogs/lib/travel.ts:354-364`
- Modify: `XHBlogs/components/TravelGlobe.tsx:283-331`
- Test: `XHBlogs/tests/travel.test.mjs:311-330`

**Interfaces:**
- Consumes: `latLngToVector3(coordinates, radius)` 返回地标基准点的三维坐标。
- Produces: `markerHorizonVisibility(markerPosition, cameraPosition, beamHeight)`；以 `markerPosition` 为光柱根部，按法线方向加上 `beamHeight` 后判断光柱顶端是否越过单位球面地平线。

- [ ] **Step 1: 写会失败的行为测试**

```javascript
test("fully fades only after the marker beam tip crosses the horizon", () => {
  const markerBase = latLngToVector3([0, 0], 1.003);
  const cameraAt = (x) => [x, Math.sqrt(9 - x ** 2), 0];

  assert.equal(
    markerHorizonVisibility(markerBase, cameraAt(1.1), 0.07),
    1,
  );
  const tipJustVisible = markerHorizonVisibility(
    markerBase,
    cameraAt(0.95),
    0.07,
  );
  assert.ok(tipJustVisible > 0 && tipJustVisible < 1);
  assert.equal(
    markerHorizonVisibility(markerBase, cameraAt(0.92), 0.07),
    0,
  );
  assert.equal(
    markerHorizonVisibility(markerBase, [-3, 0, 0], 0.07),
    0,
  );
});
```

- [ ] **Step 2: 运行测试并确认正确失败**

Run: `pnpm exec node --test --test-name-pattern="fully fades only" tests/travel.test.mjs`

Expected: FAIL；当前函数只接收两个参数，不会按光柱顶端计算，因此 `tipJustVisible` 或遮挡边界断言失败。

- [ ] **Step 3: 写最小实现**

```typescript
export function markerHorizonVisibility(
  markerPosition: [number, number, number],
  cameraPosition: [number, number, number],
  beamHeight: number,
) {
  const normal = normalize(markerPosition);
  const beamTipRadius = Math.hypot(...markerPosition) + beamHeight;
  const horizon =
    dot(normal, cameraPosition) * beamTipRadius - 1;
  const amount = Math.max(
    0,
    Math.min(1, horizon / (0.12 * beamTipRadius)),
  );
  return amount * amount * (3 - 2 * amount);
}
```

组件调用改为：

```typescript
const visibility = markerHorizonVisibility(
  [position.x, position.y, position.z],
  [camera.position.x, camera.position.y, camera.position.z],
  MARKER_BEAM_HEIGHT,
);
```

说明：光柱顶端位置是 `beamTipRadius * normal`，单位球面地平线的判据是 `dot(cameraPosition, beamTip) > 1`。函数中的法线由根部取得，和光柱方向一致。

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
git add XHBlogs/lib/travel.ts XHBlogs/components/TravelGlobe.tsx XHBlogs/tests/travel.test.mjs docs/superpowers/plans/2026-11-28-beam-tip-horizon-fade.md
git commit -m "fix: fade markers at beam tip horizon"
```
