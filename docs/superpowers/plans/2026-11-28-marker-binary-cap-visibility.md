# 顶端圆球末段淡出 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 顶端发光圆球大部分可见时地标保持原亮度，只在圆球即将完全消失时做短暂平滑淡出，并在圆球完全不可见时精确归零。

**Architecture:** 继续使用摄像机方向下圆球与地球地平线的精确相交判断。计算圆球的可见余量后，只在最后 `15%` 余量内做平滑过渡；前 `85%` 的遮挡过程保持完全不透明。

**Tech Stack:** TypeScript、Three.js、React Three Fiber、Node.js test runner

**Spec:** 用户截图反馈“顶端离下去还早却变暗一半了”，并明确要求“当顶上的圆球看不见的时候，完全淡出”。

## Global Constraints

- 光柱高度保持 `0.07`。
- 顶端发光球半径保持 `0.018`。
- 圆球大部分可见时，地标透明度不能降低。
- 淡出只发生在圆球最后约 `15%` 可见余量内。
- 圆球完全不可见时，地标可见度必须精确为 `0`。

---

### Task 1: 延后淡出并消除突然消失

**Files:**
- Modify: `XHBlogs/lib/travel.ts:354-374`
- Test: `XHBlogs/tests/travel.test.mjs:311-326`

**Interfaces:**
- Consumes: `markerHorizonVisibility(markerPosition, cameraPosition, beamTipOffset, capRadius)` 的四项输入。
- Produces: 返回 `0` 到 `1` 之间的可见度；只有最后约 `15%` 可见余量会产生中间值。

- [ ] **Step 1: 写会失败的行为测试**

```javascript
test("keeps the marker bright until the cap is almost hidden", () => {
  const markerBase = latLngToVector3([0, 0], 1.003);
  const cameraAt = (x) => [x, Math.sqrt(9 - x ** 2), 0];
  const visibilityAt = (x) =>
    markerHorizonVisibility(markerBase, cameraAt(x), 0.07, 0.018);

  assert.equal(visibilityAt(1), 1);
  assert.equal(visibilityAt(0.9), 1);
  const finalFade = visibilityAt(0.885);
  assert.ok(finalFade > 0 && finalFade < 1);
  assert.equal(visibilityAt(0.88), 0);
  assert.equal(visibilityAt(0.87), 0);
  assert.equal(
    markerHorizonVisibility(markerBase, [-3, 0, 0], 0.07, 0.018),
    0,
  );
});
```

- [ ] **Step 2: 运行测试并确认正确失败**

Run: `pnpm exec node --test --test-name-pattern="almost hidden" tests/travel.test.mjs`

Expected: FAIL；`x = 0.885` 时圆球只剩最后一小部分，但当前二值函数仍返回 `1`，缺少自然的最终淡出。

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

  if (fullyHidden <= 0) return 0;
  if (fullyVisible >= 0) return 1;

  const remaining = fullyHidden / (fullyHidden - fullyVisible);
  const amount = Math.min(1, remaining / 0.15);
  return amount * amount * (3 - 2 * amount);
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
git commit -m "fix: soften final marker fade"
```
