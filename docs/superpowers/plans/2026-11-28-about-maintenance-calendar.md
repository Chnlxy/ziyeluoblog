# About Maintenance Calendar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the About page’s recent-posts/recent-moments cards with a recent-maintenance list and a GitHub-style yearly maintenance calendar.

**Architecture:** Collect article, moment, and manually recorded site-maintenance events into one sorted activity stream. Render the newest entries on the left and aggregate all entries into a 53-week calendar on the right; no runtime API or database is required.

**Tech Stack:** Next.js server components, React, TypeScript, CSS Grid, Node test runner

**Spec:** User selected option 1: “文章、说说和网站功能更新都累计进日历；以后改网站时同步记录。”

## Global Constraints

- Preserve the existing About page content and styling above the cards.
- Article and moment entries are collected automatically.
- Site-maintenance entries come from one explicit data file that can be extended later.
- The calendar covers the current week plus the preceding 52 weeks.
- Calendar intensity increases with the number of activity entries on that date.
- The calendar scrolls horizontally on narrow screens instead of shrinking illegibly.

---

### Task 1: Build the maintenance activity model and calendar data

**Files:**

- Create: `XHBlogs/data/maintenance.ts`
- Create: `XHBlogs/lib/maintenance.ts`
- Test: `XHBlogs/tests/maintenance.test.mjs`

**Interfaces:**

- Consumes: `PostSummary[]`, `MomentSummary[]`, `MaintenanceRecord[]`
- Produces:
  - `MaintenanceEntry`
  - `createMaintenanceEntries({ posts, moments, siteUpdates }): MaintenanceEntry[]`
  - `buildMaintenanceCalendar(entries, asOf): MaintenanceCalendar`

- [ ] **Step 1: Write failing model tests**

```javascript
test("merges articles, moments, and site maintenance newest first", () => {
  const entries = createMaintenanceEntries({
    posts: [
      {
        slug: "post-a",
        title: "Post A",
        description: "",
        date: "2026-11-26",
        cover: "",
        tags: [],
      },
    ],
    moments: [
      {
        id: "moment-a",
        date: "2026-11-27T20:30:00+08:00",
        location: "",
        images: [],
        content: "Moment A",
      },
    ],
    siteUpdates: [
      {
        date: "2026-11-28",
        title: "Site update",
      },
    ],
  });

  assert.deepEqual(
    entries.map(({ date, kind, title, href }) => ({
      date,
      kind,
      title,
      href,
    })),
    [
      {
        date: "2026-11-28",
        kind: "site",
        title: "Site update",
        href: null,
      },
      {
        date: "2026-11-27",
        kind: "moment",
        title: "Moment A",
        href: "/moments/moment-a/",
      },
      {
        date: "2026-11-26",
        kind: "post",
        title: "Post A",
        href: "/posts/post-a/",
      },
    ],
  );
});

test("builds a 53-week calendar with four intensity levels", () => {
  const entries = [
    entry("2026-11-28", "site"),
    entry("2026-11-28", "post"),
    entry("2026-11-28", "moment"),
    entry("2026-11-28", "site"),
    entry("2026-11-27", "site"),
  ];
  const calendar = buildMaintenanceCalendar(
    entries,
    new Date("2026-11-28T12:00:00+08:00"),
  );

  assert.equal(calendar.weeks.length, 53);
  assert.equal(calendar.total, 5);
  assert.equal(calendar.byDate.get("2026-11-28").level, 4);
  assert.equal(calendar.byDate.get("2026-11-27").level, 1);
  assert.equal(calendar.byDate.get("2026-11-26").level, 0);
});
```

- [ ] **Step 2: Run the tests and confirm failure**

Expected: FAIL because `lib/maintenance.ts` does not exist.

- [ ] **Step 3: Implement the maintenance model and seed records**

Create `data/maintenance.ts` with five current site-maintenance records covering the NASA clouds, first-load texture fix, detail exit animation, footprints release, and initial site build.

Create typed collection and calendar utilities that:

```typescript
export type MaintenanceKind = "site" | "post" | "moment";

export interface MaintenanceEntry {
  date: string;
  kind: MaintenanceKind;
  title: string;
  href: string | null;
}

export interface MaintenanceDay {
  date: string;
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
  titles: string[];
}
```

Normalize every date with `value.slice(0, 10)`. Sort descending by date, then site/post/moment ordering for stable ties. Calendar range starts at the Sunday 52 weeks before the Saturday ending the current week.

- [ ] **Step 4: Run model tests to verify they pass**

```powershell
$env:CI='true'; pnpm exec node --test tests/maintenance.test.mjs
```

Expected: PASS.

---

### Task 2: Replace the About cards and add the calendar UI

**Files:**

- Create: `XHBlogs/components/MaintenanceCalendar.tsx`
- Modify: `XHBlogs/app/about/page.tsx`
- Modify: `XHBlogs/app/globals.css`
- Test: `XHBlogs/tests/maintenance.test.mjs`

**Interfaces:**

- Consumes: `MaintenanceEntry[]` from `createMaintenanceEntries`
- Produces: `<MaintenanceCalendar entries={entries} />`

- [ ] **Step 1: Write failing About integration tests**

```javascript
test("replaces recent content cards with maintenance activity", () => {
  const about = fs.readFileSync(
    path.join(root, "app", "about", "page.tsx"),
    "utf8",
  );
  const calendar = fs.readFileSync(
    path.join(root, "components", "MaintenanceCalendar.tsx"),
    "utf8",
  );

  assert.match(about, /createMaintenanceEntries/);
  assert.match(about, /最近维护/);
  assert.match(about, /MaintenanceCalendar/);
  assert.doesNotMatch(about, /最近文章/);
  assert.doesNotMatch(about, /最近说说/);
  assert.match(calendar, /过去一年/);
  assert.match(calendar, /maintenance-calendar-grid/);
});
```

- [ ] **Step 2: Run the integration test and confirm failure**

Expected: FAIL because About still renders the two old cards.

- [ ] **Step 3: Implement the About layout**

Load all posts and moments, merge them with `siteMaintenance`, and render:

- left card titled `最近维护`, showing the four newest entries with kind label, date, title, and a link when available;
- right card containing `<MaintenanceCalendar entries={maintenanceEntries} />`.

Use a two-column desktop layout and one-column mobile layout.

- [ ] **Step 4: Implement the GitHub-style calendar**

Render 53 CSS Grid columns, seven rows per column, month labels, weekday hints, per-cell `title` text, four gold/green intensity levels, a legend, and horizontal scrolling.

- [ ] **Step 5: Run tests, TypeScript, and build**

```powershell
$env:CI='true'; pnpm test
$env:CI='true'; pnpm exec tsc --noEmit
$env:CI='true'; pnpm build
```

Expected: all pass.

- [ ] **Step 6: Visually verify and commit**

Open `/about` at desktop and mobile widths. Confirm the left list links correctly, the calendar displays one year, tooltips show maintenance titles, and mobile overflow scrolls horizontally.

```powershell
git add XHBlogs/data/maintenance.ts XHBlogs/lib/maintenance.ts XHBlogs/components/MaintenanceCalendar.tsx XHBlogs/app/about/page.tsx XHBlogs/app/globals.css XHBlogs/tests/maintenance.test.mjs docs/superpowers/plans/2026-11-28-about-maintenance-calendar.md
git commit -m "feat: add about maintenance calendar"
```
