# Maintenance Summary Stats Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fill the unused lower area of the maintenance calendar card with useful yearly statistics and activity composition.

**Architecture:** Extend the existing maintenance utility with a deterministic yearly summary, then render four summary metrics and three proportional activity bars beneath the heatmap.

**Tech Stack:** TypeScript, React server components, CSS, Node test runner

**Spec:** User selected option 1: cumulative maintenance days, current streak, longest streak, busiest month, and site/post/moment composition.

## Global Constraints

- Summary calculations cover the same one-year window as the calendar.
- Current streak permits the latest active day to be yesterday when today has no record.
- Activity composition counts site, article, and moment records separately.
- The calendar remains fully visible without horizontal scrolling.
- Do not add dependencies or client-side JavaScript.

---

### Task 1: Add yearly maintenance summary

**Files:**

- Modify: `XHBlogs/lib/maintenance.ts`
- Modify: `XHBlogs/components/MaintenanceCalendar.tsx`
- Test: `XHBlogs/tests/maintenance.test.mjs`

**Interfaces:**

- Consumes: `MaintenanceEntry[]`
- Produces: `buildMaintenanceStats(entries, asOf): MaintenanceStats`

- [ ] **Step 1: Write the failing summary test**

```javascript
test("summarizes maintenance days, streaks, busiest month, and kinds", () => {
  const entries = [
    entry("2026-11-23", "site"),
    entry("2026-11-25", "site"),
    entry("2026-11-25", "post"),
    entry("2026-11-25", "moment"),
    entry("2026-11-26", "post"),
    entry("2026-11-26", "moment"),
    entry("2026-11-27", "site"),
    entry("2026-11-27", "post"),
    entry("2026-11-27", "moment"),
    entry("2026-11-28", "site"),
    entry("2026-11-28", "site"),
  ];
  const stats = buildMaintenanceStats(
    entries,
    new Date("2026-11-28T12:00:00+08:00"),
  );

  assert.deepEqual(stats, {
    totalDays: 5,
    currentStreak: 4,
    longestStreak: 4,
    busiestMonth: "2026年11月",
    busiestMonthCount: 11,
    kindCounts: {
      site: 5,
      post: 3,
      moment: 3,
    },
  });
});
```

- [ ] **Step 2: Run the test and confirm failure**

Expected: FAIL because `buildMaintenanceStats` is not exported.

- [ ] **Step 3: Implement summary calculation**

Filter entries to the calendar window, count unique active dates, calculate streaks over unique dates, count records per month, and count entries by kind.

- [ ] **Step 4: Run the focused summary test**

```powershell
$env:CI='true'; pnpm exec node --test --test-name-pattern="summarizes maintenance" tests/maintenance.test.mjs
```

Expected: PASS.

- [ ] **Step 5: Add failing UI assertions**

Assert that `MaintenanceCalendar.tsx` renders:

- `维护天数`
- `当前连续`
- `最长连续`
- `最活跃月份`
- `维护构成`
- `站点 / 文章 / 说说` bars

- [ ] **Step 6: Implement the lower summary area**

Make the calendar card a full-height flex column. After the calendar legend, render:

```tsx
<div className="mt-auto border-t border-white/10 pt-5">
  <div className="grid grid-cols-2 gap-3">
    ...four metric cards...
  </div>
  <div className="mt-5 space-y-3">
    ...three proportional bars...
  </div>
</div>
```

Use gold, jade, and cool-blue bars for site, article, and moment records.

- [ ] **Step 7: Verify and commit**

```powershell
$env:CI='true'; pnpm test
$env:CI='true'; pnpm exec tsc --noEmit
$env:CI='true'; pnpm build
git add XHBlogs/lib/maintenance.ts XHBlogs/components/MaintenanceCalendar.tsx XHBlogs/tests/maintenance.test.mjs docs/superpowers/plans/2026-11-28-maintenance-summary-stats.md
git commit -m "feat: summarize maintenance activity"
```

Then inspect the About page at desktop and mobile widths to confirm the summary fills the lower whitespace without compressing the calendar.
