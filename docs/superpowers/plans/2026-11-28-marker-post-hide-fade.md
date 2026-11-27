# 地标隐藏后淡出 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 顶端圆球可见时地标始终保持满亮度；圆球完全隐藏后才开始短暂淡出，避免提前变暗和瞬间消失。

**Architecture:** 地平线函数恢复为严格的可见/不可见判断，不再返回部分遮挡透明度。组件单独维护每个地标的淡出值：圆球可见时立即设为 `1`，不可见后按时间平滑衰减到 `0`。

**Tech Stack:** TypeScript、Three.js、React Three Fiber、Node.js test runner

**Spec:** 用户截图显示顶端圆球仍可见时标签已经变暗，并要求“光线最顶端还看得见……他就不能完全消失”。

## Global Constraints

- 光柱高度保持 `0.07`。
- 顶端发光球半径保持 `0.018`。
- 圆球任何一部分可见时，地标必须保持满亮度。
- 圆球完全不可见后，地标才开始淡出。
- 淡出结束后，地标可见度精确为 `0`。

---

### Task 1: 恢复圆球可见性为二值判断

**Files:**
- Modify: `XHBlogs/lib/travel.ts:354-374`
- Test: `XHBlogs/tests/travel.test.mjs:311-327`

**Interfaces:**
- Consumes: `markerHorizonVisibility(markerPosition, cameraPosition, beamTipOffset, capRadius)` 的四项输入。
- Produces: 只返回 `0` 或 `1` 的可见性。

- [ ] **Step 1: 写会失败的行为测试**

```javascript
test("keeps the marker fully visible while its cap is visible", () => {
  const markerBase = latLngToVector3([0, 0], 1.003);
  const cameraAt = (x) => [x, Math.sqrt(9 - x ** 2), 0];
  const visibilityAt = (x) =>
    markerHorizonVisibility(markerBase, cameraAt(x), 0.07, 0.018);

  assert.equal(visibilityAt(1), 1);
  assert.equal(visibilityAt(0.9), 1);
  assert.equal(visibilityAt(0.885), 1);
  assert.equal(visibilityAt(0.88), 0);
  assert.equal(visibilityAt(0.87), 0);
  assert.equal(
    markerHorizonVisibility(markerBase, [-3, 0, 0], 0.07, 0.018),
    0,
  );
});
```

- [ ] **Step 2: 运行测试并确认正确失败**

Run: `pnpm exec node --test --test-name-pattern="fully visible while" tests/travel.test.mjs`

Expected: FAIL；`x = 0.885` 当前落在末段透明区间，返回值不是 `1`。

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

  return centerHorizon + capProjection > 0 ? 1 : 0;
}
```

- [ ] **Step 4: 运行测试并确认通过**

Run: `pnpm exec node --test --test-name-pattern="fully visible while" tests/travel.test.mjs`

Expected: PASS。

---

### Task 2: 在圆球隐藏后按时间淡出

**Files:**
- Modify: `XHBlogs/lib/travel.ts:375-390`
- Modify: `XHBlogs/components/TravelGlobe.tsx:22-35`
- Modify: `XHBlogs/components/TravelGlobe.tsx:310-355`
- Test: `XHBlogs/tests/travel.test.mjs:11-22`
- Test: `XHBlogs/tests/travel.test.mjs:311-345`

**Interfaces:**
- Consumes: 每个渲染帧的 `deltaSeconds`。
- Produces: `advanceMarkerOpacity(current, capVisible, deltaSeconds)`；圆球可见时返回 `1`，圆球隐藏后返回按时间衰减且最终归零的值。

- [ ] **Step 1: 写会失败的行为测试**

```javascript
test("fades the marker only after its cap is hidden", () => {
  let opacity = advanceMarkerOpacity(0, true, 1 / 60);
  assert.equal(opacity, 1);

  opacity = advanceMarkerOpacity(opacity, false, 1 / 60);
  assert.ok(opacity > 0 && opacity < 1);

  for (let frame = 0; frame < 60; frame++) {
    opacity = advanceMarkerOpacity(opacity, false, 1 / 60);
  }
  assert.ok(opacity < 0.01);
});
```

- [ ] **Step 2: 运行测试并确认正确失败**

Run: `pnpm exec node --test --test-name-pattern="only after its cap is hidden" tests/travel.test.mjs`

Expected: FAIL；`advanceMarkerOpacity` 尚未定义。

- [ ] **Step 3: 写最小实现**

```typescript
const MARKER_HIDE_FADE_SECONDS = 0.08;

export function advanceMarkerOpacity(
  current: number,
  capVisible: boolean,
  deltaSeconds: number,
) {
  if (capVisible) return 1;
  if (!Number.isFinite(deltaSeconds) || deltaSeconds <= 0) {
    return current;
  }

  const next = current * Math.exp(
    -deltaSeconds / MARKER_HIDE_FADE_SECONDS,
  );
  return next < 0.01 ? 0 : next;
}
```

组件增加 opacity ref，并在每帧使用：

```typescript
const opacity = useRef(0);

useFrame(({ camera }, delta) => {
  const markerScale =
    Math.max(0.75, camera.position.length() / 3.2) *
    (selected || focused ? 1.22 : 1);
  const capVisible =
    markerHorizonVisibility(
      [position.x, position.y, position.z],
      [camera.position.x, camera.position.y, camera.position.z],
      MARKER_BEAM_HEIGHT * markerScale,
      MARKER_CAP_RADIUS * markerScale,
    ) > 0;
  opacity.current = advanceMarkerOpacity(
    opacity.current,
    capVisible,
    delta,
  );
  const visible = capVisible || opacity.current > 0;
  group.current.visible = visible;
  const visibility = opacity.current;
  // 后续材质透明度继续使用 visibility。
});
```

- [ ] **Step 4: 运行完整测试**

Run: `pnpm test`

Expected: 全部测试 PASS，无失败输出。

- [ ] **Step 5: 运行类型检查和构建**

Run: `pnpm exec tsc --noEmit`

Expected: exit 0。

Run: `pnpm build`

Expected: exit 0，`/footprints` 路由正常生成。

- [ ] **Step 6: 提交**

```bash
git add XHBlogs/lib/travel.ts XHBlogs/components/TravelGlobe.tsx XHBlogs/tests/travel.test.mjs docs/superpowers/plans/2026-11-28-marker-post-hide-fade.md
git commit -m "fix: fade markers after cap is hidden"
```
