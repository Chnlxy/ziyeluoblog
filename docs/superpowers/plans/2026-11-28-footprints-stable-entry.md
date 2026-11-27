# 足迹页稳定入场 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 从其他页面进入足迹页时，内容只淡入，不再在加载过程中垂直跳动。

**Architecture:** 保留现有页面淡入动画，但给 `PageTransition` 增加可配置的垂直偏移。足迹页使用 `0` 偏移，其他页面继续使用默认的 `20px` 入场位移。

**Tech Stack:** Next.js、React、Framer Motion、Node.js test runner

**Spec:** 用户反馈“从其他界面跳到足迹后加载过程中到加载结束有一定跳动”。

## Global Constraints

- 不改变地球容器高度或布局规则。
- 不改变其他页面现有的入场动画。
- 足迹页仍保留淡入效果。
- 足迹页入场期间垂直位移必须为 `0`。

---

### Task 1: 禁用足迹页的垂直入场位移

**Files:**
- Modify: `XHBlogs/components/PageTransition.tsx`
- Modify: `XHBlogs/app/footprints/page.tsx`
- Test: `XHBlogs/tests/ziyeluo-config.test.mjs`

**Interfaces:**
- Consumes: React children、className。
- Produces: `PageTransition` 新增可选 `offsetY`，默认值 `20`；Footprints 页面传入 `0`。

- [ ] **Step 1: 写会失败的行为测试**

```javascript
test("keeps footprints content vertically fixed during entry", () => {
  const transitionPath = path.join(
    root,
    "components",
    "PageTransition.tsx",
  );
  const footprintsPath = path.join(
    root,
    "app",
    "footprints",
    "page.tsx",
  );
  const transition = fs.readFileSync(transitionPath, "utf8");
  const footprints = fs.readFileSync(footprintsPath, "utf8");

  assert.match(transition, /offsetY\?:\s*number/);
  assert.match(transition, /initial=\{\{\s*y:\s*offsetY/);
  assert.match(footprints, /<PageTransition[^>]*offsetY=\{0\}/);
});
```

- [ ] **Step 2: 运行测试并确认正确失败**

Run: `pnpm exec node --test --test-name-pattern="vertically fixed during entry" tests/ziyeluo-config.test.mjs`

Expected: FAIL；`PageTransition` 还没有 `offsetY` 参数，足迹页仍使用默认 `20px` 位移。

- [ ] **Step 3: 写最小实现**

```tsx
export default function PageTransition({
  children,
  className = "",
  offsetY = 20,
}: {
  children: ReactNode;
  className?: string;
  offsetY?: number;
}) {
  return (
    <motion.div
      initial={{ y: offsetY, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ ease: "easeOut", duration: 0.8 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
```

足迹页：

```tsx
<PageTransition className="flex-1" offsetY={0}>
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
git add XHBlogs/components/PageTransition.tsx XHBlogs/app/footprints/page.tsx XHBlogs/tests/ziyeluo-config.test.mjs docs/superpowers/plans/2026-11-28-footprints-stable-entry.md
git commit -m "fix: keep footprints entry vertically stable"
```
