# 地球加载动态点 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 地球纹理加载提示使用与启动页一致的循环点动画。

**Architecture:** 复用启动页现有的 `splash-dots` 和 `splash-dot` 样式，在“正在加载地球纹理”后渲染三个依次出现的点。点的动画由现有 CSS 关键帧负责，不需要新增状态或计时器。

**Tech Stack:** React、Tailwind CSS、Node.js test runner

**Spec:** 用户要求加载地球动画后面的句点“类似开始界面更新”。

## Global Constraints

- 加载文字保持“正在加载地球纹理”。
- 句点按启动页相同节奏循环出现。
- 动态句点必须对屏幕阅读器隐藏。
- 地球淡入和加载遮罩淡出保持不变。

---

### Task 1: 复用启动页的循环点动画

**Files:**
- Modify: `XHBlogs/components/TravelGlobe.tsx:764-776`
- Test: `XHBlogs/tests/ziyeluo-config.test.mjs:717-742`

**Interfaces:**
- Consumes: `.splash-dots`、`.splash-dot` 现有样式。
- Produces: 三个 `aria-hidden="true"` 的循环点。

- [ ] **Step 1: 写会失败的行为测试**

```javascript
test("animates the globe loading dots like the splash screen", () => {
  const globe = fs.readFileSync(
    path.join(root, "components", "TravelGlobe.tsx"),
    "utf8",
  );

  assert.match(globe, /正在加载地球纹理/);
  assert.equal((globe.match(/className="splash-dot"/g) ?? []).length, 3);
  assert.match(globe, /className="splash-dots"/);
  assert.doesNotMatch(globe, /正在加载地球纹理……/);
});
```

- [ ] **Step 2: 运行测试并确认正确失败**

Run: `pnpm exec node --test --test-name-pattern="globe loading dots" tests/ziyeluo-config.test.mjs`

Expected: FAIL；当前加载文字仍使用静态省略号。

- [ ] **Step 3: 写最小实现**

```tsx
正在加载地球纹理
<span className="splash-dots" aria-hidden="true">
  <span className="splash-dot">.</span>
  <span className="splash-dot">.</span>
  <span className="splash-dot">.</span>
</span>
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
git add XHBlogs/components/TravelGlobe.tsx XHBlogs/tests/ziyeluo-config.test.mjs docs/superpowers/plans/2026-11-28-globe-loading-dots.md
git commit -m "feat: animate globe loading dots"
```
