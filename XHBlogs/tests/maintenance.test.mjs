import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  buildMaintenanceCalendar,
  createMaintenanceEntries,
} from "../lib/maintenance.ts";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

function entry(date, kind) {
  return {
    date,
    kind,
    title: `${kind} on ${date}`,
    href: null,
  };
}

test("merges articles, moments, and site maintenance newest first", () => {
  const entries = createMaintenanceEntries({
    posts: [
      {
        slug: "post-a",
        title: "Post A",
        description: "",
        date: "2026-11-26",
        tags: [],
        cover: "",
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

test("replaces recent content cards with maintenance activity", () => {
  const about = fs.readFileSync(
    path.join(root, "app", "about", "page.tsx"),
    "utf8",
  );
  const calendar = fs.readFileSync(
    path.join(root, "components", "MaintenanceCalendar.tsx"),
    "utf8",
  );
  const styles = fs.readFileSync(
    path.join(root, "app", "globals.css"),
    "utf8",
  );

  assert.match(about, /createMaintenanceEntries/);
  assert.match(about, /最近维护/);
  assert.match(about, /MaintenanceCalendar/);
  assert.doesNotMatch(about, /最近文章/);
  assert.doesNotMatch(about, /最近说说/);
  assert.match(calendar, /过去一年/);
  assert.match(calendar, /maintenance-calendar-grid/);
  assert.match(
    styles,
    /\.maintenance-calendar-scroll\s*\{[^}]*direction:\s*rtl;/,
  );
});
