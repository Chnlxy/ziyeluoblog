import type {
  MomentSummary,
  PostSummary,
} from "./content-types";
import type { MaintenanceRecord } from "../data/maintenance";

const DAY_MS = 24 * 60 * 60 * 1000;

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

export interface MaintenanceCalendar {
  weeks: MaintenanceDay[][];
  total: number;
  byDate: Map<string, MaintenanceDay>;
}

export interface MaintenanceStats {
  totalDays: number;
  currentStreak: number;
  longestStreak: number;
  busiestMonth: string;
  busiestMonthCount: number;
  kindCounts: Record<MaintenanceKind, number>;
}

function normalizedDate(value: string) {
  return value.slice(0, 10);
}

function utcDateString(timestamp: number) {
  const date = new Date(timestamp);
  return [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(2, "0"),
    String(date.getUTCDate()).padStart(2, "0"),
  ].join("-");
}

export function createMaintenanceEntries({
  posts,
  moments,
  siteUpdates,
}: {
  posts: PostSummary[];
  moments: MomentSummary[];
  siteUpdates: MaintenanceRecord[];
}): MaintenanceEntry[] {
  const kindOrder: Record<MaintenanceKind, number> = {
    site: 0,
    post: 1,
    moment: 2,
  };
  const entries: MaintenanceEntry[] = [
    ...siteUpdates.map((record) => ({
      date: normalizedDate(record.date),
      kind: "site" as const,
      title: record.title,
      href: null,
    })),
    ...posts.map((post) => ({
      date: normalizedDate(post.date),
      kind: "post" as const,
      title: post.title,
      href: `/posts/${post.slug}/`,
    })),
    ...moments.map((moment) => ({
      date: normalizedDate(moment.date),
      kind: "moment" as const,
      title: moment.content.trim() || "发布了新的说说",
      href: `/moments/${moment.id}/`,
    })),
  ];

  return entries.sort(
    (left, right) =>
      right.date.localeCompare(left.date) ||
      kindOrder[left.kind] - kindOrder[right.kind] ||
      left.title.localeCompare(right.title, "zh-CN"),
  );
}

export function buildMaintenanceCalendar(
  entries: MaintenanceEntry[],
  asOf = new Date(),
): MaintenanceCalendar {
  const currentDay = Date.UTC(
    asOf.getUTCFullYear(),
    asOf.getUTCMonth(),
    asOf.getUTCDate(),
  );
  const currentWeekday = new Date(currentDay).getUTCDay();
  const endTimestamp =
    currentDay + (6 - currentWeekday) * DAY_MS;
  const startTimestamp = endTimestamp - 370 * DAY_MS;
  const titlesByDate = new Map<string, string[]>();

  for (const entry of entries) {
    const titles = titlesByDate.get(entry.date) ?? [];
    titles.push(entry.title);
    titlesByDate.set(entry.date, titles);
  }

  const days: MaintenanceDay[] = [];
  for (
    let timestamp = startTimestamp;
    timestamp <= endTimestamp;
    timestamp += DAY_MS
  ) {
    const date = utcDateString(timestamp);
    const titles = titlesByDate.get(date) ?? [];
    days.push({
      date,
      count: titles.length,
      level: Math.min(titles.length, 4) as MaintenanceDay["level"],
      titles,
    });
  }

  const weeks: MaintenanceDay[][] = [];
  for (let index = 0; index < days.length; index += 7) {
    weeks.push(days.slice(index, index + 7));
  }

  return {
    weeks,
    total: days.reduce((total, day) => total + day.count, 0),
    byDate: new Map(days.map((day) => [day.date, day])),
  };
}

function dateTimestamp(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  return Date.UTC(year, month - 1, day);
}

export function buildMaintenanceStats(
  entries: MaintenanceEntry[],
  asOf = new Date(),
): MaintenanceStats {
  const currentDay = Date.UTC(
    asOf.getUTCFullYear(),
    asOf.getUTCMonth(),
    asOf.getUTCDate(),
  );
  const end = currentDay + (6 - new Date(currentDay).getUTCDay()) * DAY_MS;
  const start = end - 370 * DAY_MS;
  const startDate = utcDateString(start);
  const endDate = utcDateString(end);
  const windowEntries = entries.filter(
    (entry) => entry.date >= startDate && entry.date <= endDate,
  );
  const uniqueDays = [...new Set(windowEntries.map((entry) => entry.date))]
    .sort()
    .map(dateTimestamp);

  let longestStreak = 0;
  let rollingStreak = 0;
  for (let index = 0; index < uniqueDays.length; index++) {
    rollingStreak =
      index > 0 && uniqueDays[index] - uniqueDays[index - 1] === DAY_MS
        ? rollingStreak + 1
        : 1;
    longestStreak = Math.max(longestStreak, rollingStreak);
  }

  const activeDays = new Set(uniqueDays);
  let streakCursor = currentDay;
  if (!activeDays.has(streakCursor)) streakCursor -= DAY_MS;
  let currentStreak = 0;
  while (activeDays.has(streakCursor)) {
    currentStreak += 1;
    streakCursor -= DAY_MS;
  }

  const monthCounts = new Map<string, number>();
  const kindCounts: Record<MaintenanceKind, number> = {
    site: 0,
    post: 0,
    moment: 0,
  };
  for (const entry of windowEntries) {
    const month = entry.date.slice(0, 7);
    monthCounts.set(month, (monthCounts.get(month) ?? 0) + 1);
    kindCounts[entry.kind] += 1;
  }

  const busiest = [...monthCounts.entries()].sort(
    ([leftMonth, leftCount], [rightMonth, rightCount]) =>
      rightCount - leftCount ||
      rightMonth.localeCompare(leftMonth),
  )[0];

  return {
    totalDays: uniqueDays.length,
    currentStreak,
    longestStreak,
    busiestMonth: busiest
      ? `${busiest[0].slice(0, 4)}年${Number(busiest[0].slice(5, 7))}月`
      : "暂无记录",
    busiestMonthCount: busiest?.[1] ?? 0,
    kindCounts,
  };
}
