# 地球纹理淡入 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 地球纹理加载完成后，地球从透明状态平滑淡入，同时加载提示同步淡出。

**Architecture:** 复用现有 `texturesReady` 状态控制 Canvas 与加载遮罩的透明度。Canvas 和遮罩都保持原尺寸与绝对定位，只改变 `opacity`，因此不会引发布局跳动。

**Tech Stack:** React Three Fiber、Tailwind CSS、Node.js test runner

**Spec:** 用户询问“地球能淡入吗”。

## Global Constraints

- 纹理加载完成前 Canvas 透明度为 `0`。
- 纹理加载完成后 Canvas 平滑变为 `1`。
- 加载提示同步淡出。
- 淡入过程不能改变布局尺寸。
- 用户启用减少动态效果时取消过渡动画。

---

### Task 1: 在地球纹理就绪后淡入

**Files:**
- Modify: `XHBlogs/components/TravelGlobe.tsx:730-765`
- Test: `XHBlogs/tests/ziyeluo-config.test.mjs:711-716`

**Interfaces:**
- Consumes: `texturesReady` 布尔状态。
- Produces: Canvas 的 `opacity-0/opacity-100` 切换，以及保持挂载的加载遮罩淡出。

- [ ] **Step 1: 写会失败的行为测试**

```javascript
test("fades the globe in after its textures load", () => {
  const globe = fs.readFileSync(
    path.join(root, "components", "TravelGlobe.tsx"),
    "utf8",
  );

  assert.match(
    globe,
    /texturesReady\s*\?\s*"opacity-100"\s*:\s*"opacity-0"/,
  );
  assert.match(globe, /transition-opacity/);
  assert.match(globe, /duration-700/);
  assert.match(globe, /aria-hidden=\{texturesReady\}/);
  assert.match(globe, /motion-reduce:transition-none/);
});
```

- [ ] **Step 2: 运行测试并确认正确失败**

Run: `pnpm exec node --test --test-name-pattern="fades the globe in" tests/ziyeluo-config.test.mjs`

Expected: FAIL；Canvas 当前没有透明度切换类，加载遮罩也是加载完成后直接移除。

- [ ] **Step 3: 写最小实现**

```tsx
<Canvas
  className={`globe-canvas ${
    texturesReady ? "globe-canvas--ready" : "opacity-0"
  }`}
  aria-label="旅行足迹地球"
  // 其余 Canvas 属性保持不变
>
```

`globals.css` 增加关键帧，确保即使纹理从缓存瞬间就绪，也会从透明状态开始：

```css
.globe-canvas {
  opacity: 0;
}

.globe-canvas--ready {
  animation: globe-canvas-fade-in 700ms ease-out both;
}

@keyframes globe-canvas-fade-in {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

@media (prefers-reduced-motion: reduce) {
  .globe-canvas--ready {
    animation: none;
    opacity: 1;
  }
}
```

加载遮罩改为始终挂载：

```tsx
<div
  aria-live="polite"
  aria-hidden={texturesReady}
  className={`pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-[#1b1c18]/35 text-sm font-bold text-slate-200 backdrop-blur-sm transition-opacity duration-500 motion-reduce:transition-none ${
    texturesReady ? "opacity-0" : "opacity-100"
  }`}
>
  正在加载地球纹理……
</div>
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
git add XHBlogs/components/TravelGlobe.tsx XHBlogs/tests/ziyeluo-config.test.mjs docs/superpowers/plans/2026-11-28-globe-texture-fade-in.md
git commit -m "feat: fade globe in after textures load"
```
