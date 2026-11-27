# 顶端圆球二值可见性 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 顶端发光圆球只要还能看见任何一部分，地标和地名就保持原亮度；圆球完全看不见的瞬间才完全淡出。

**Architecture:** 继续使用摄像机方向下圆球与地球地平线的精确相交判断，但去掉“部分遮挡时平滑降低透明度”的区间。可见度只返回 `1` 或 `0`，避免圆球仍明显可见时提前变暗。

**Tech Stack:** TypeScript、Three.js、React Three Fiber、Node.js test runner

**Spec:** 用户截图反馈“顶端离下去还早却变暗一半了”，并明确要求“当顶上的圆球看不见的时候，完全淡出”。

## Global Constraints

- 光柱高度保持 `0.07`。
- 顶端发光球半径保持 `0.018`。
- 圆球任何一部分可见时，地标透明度不能降低。
- 圆球完全不可见时，地标可见度必须精确为 `0`。

---

### Task 1: 移除部分遮挡时的半透明状态

**Files:**
- Modify: `XHBlogs/lib/travel.ts:354-374`
- Test: `XHBlogs/tests/travel.test.mjs:311-326`

**Interfaces:**
- Consumes: `markerHorizonVisibility(markerPosition, cameraPosition, beamTipOffset, capRadius)` 的四项输入。
- Produces: 仍返回 `number`，但结果只可能是 `0` 或 `1`。

- [ ] **Step 1: 写会失败的行为测试**

```javascript
test("keeps the marker fully opaque until its cap is completely hidden", () => {
  const markerBase = latLngToVector3([0, 0], 1.003);
  const cameraAt = (x) => [x, Math.sqrt(9 - x ** 2), 0];
  const visibilityAt = (x) =>
    markerHorizonVisibility(markerBase, cameraAt(x), 0.07, 0.018);

  assert.equal(visibilityAt(1), 1);
  assert.equal(visibilityAt(0.9), 1);
  assert.equal(visibilityAt(0.87), 0);
  assert.equal(
    markerHorizonVisibility(markerBase, [-3, 0, 0], 0.07, 0.018),
    0,
  );
});
```

- [ ] **Step 2: 运行测试并确认正确失败**

Run: `pnpm exec node --test --test-name-pattern="fully opaque until" tests/travel.test.mjs`

Expected: FAIL；`x = 0.9` 时圆球仍有一部分可见，但当前平滑函数返回介于 `0` 和 `1` 之间的值。

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

Run: `pnpm test`

Expected: 全部测试 PASS，无失败输出。

- [ ] **Step 5: 运行类型检查和构建**

Run: `pnpm exec tsc --noEmit`

Expected: exit 0。

Run: `pnpm build`

Expected: exit 0，`/footprints` 路由正常生成。

- [ ] **Step 6: 提交**

```bash
git add XHBlogs/lib/travel.ts XHBlogs/tests/travel.test.mjs docs/superpowers/plans/2026-11-28-marker-binary-cap-visibility.md
git commit -m "fix: keep marker brightness until cap is hidden"
```
