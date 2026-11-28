import {
  buildMaintenanceCalendar,
  buildMaintenanceStats,
  type MaintenanceEntry,
} from "../lib/maintenance";

const MONTHS = [
  "1月",
  "2月",
  "3月",
  "4月",
  "5月",
  "6月",
  "7月",
  "8月",
  "9月",
  "10月",
  "11月",
  "12月",
];

const WEEKDAYS = ["日", "", "一", "", "三", "", "五"];

export default function MaintenanceCalendar({
  entries,
}: {
  entries: MaintenanceEntry[];
}) {
  const calendar = buildMaintenanceCalendar(entries);
  const stats = buildMaintenanceStats(entries);
  const kindRows = [
    {
      label: "站点",
      count: stats.kindCounts.site,
      barClass: "bg-[#eadc9d]",
    },
    {
      label: "文章",
      count: stats.kindCounts.post,
      barClass: "bg-[#93b58a]",
    },
    {
      label: "说说",
      count: stats.kindCounts.moment,
      barClass: "bg-[#7ca8c9]",
    },
  ];
  let previousMonth = -1;
  const monthLabels = calendar.weeks.map((week) => {
    const month = Number(week[0].date.slice(5, 7));
    if (month === previousMonth) return "";
    previousMonth = month;
    return MONTHS[month - 1];
  });

  return (
    <section className="glass-card flex h-full min-w-0 flex-col p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.28em] text-indigo-300">
            Maintenance
          </p>
          <h2 className="mt-2 text-lg font-black text-white">上线维护</h2>
        </div>
        <p className="text-xs text-slate-400">
          过去一年 · {calendar.total} 项记录
        </p>
      </div>

      <div className="maintenance-calendar-scroll mt-5">
        <div
          className="maintenance-calendar-months"
          style={{
            gridTemplateColumns: `repeat(${calendar.weeks.length}, minmax(0, 1fr))`,
          }}
          aria-hidden="true"
        >
          {monthLabels.map((label, index) => (
            <span
              key={`${calendar.weeks[index][0].date}-${label}`}
              style={{ gridColumn: index + 1 }}
            >
              {label}
            </span>
          ))}
        </div>

        <div className="mt-1 flex gap-2">
          <div className="maintenance-calendar-weekdays" aria-hidden="true">
            {WEEKDAYS.map((weekday, index) => (
              <span key={index}>{weekday}</span>
            ))}
          </div>
          <div
            className="maintenance-calendar-grid flex-1"
            aria-label="过去一年网站维护日历"
            style={{
              gridTemplateColumns: `repeat(${calendar.weeks.length}, minmax(0, 1fr))`,
            }}
          >
            {calendar.weeks.flatMap((week) =>
              week.map((day) => {
                const description = day.count
                  ? `${day.count} 项：${day.titles.join("、")}`
                  : "无维护记录";
                return (
                  <span
                    key={day.date}
                    className={`maintenance-calendar-day maintenance-calendar-day--level-${day.level}`}
                    title={`${day.date} · ${description}`}
                    aria-label={`${day.date} · ${description}`}
                  />
                );
              }),
            )}
          </div>
        </div>
      </div>

      <div className="maintenance-calendar-legend mt-4 flex items-center justify-end gap-1.5 text-[10px] text-slate-500">
        <span>少</span>
        {[0, 1, 2, 3, 4].map((level) => (
          <span
            key={level}
            className={`maintenance-calendar-day maintenance-calendar-day--legend maintenance-calendar-day--level-${level}`}
            aria-hidden="true"
          />
        ))}
        <span>多</span>
      </div>

      <div className="mt-auto border-t border-white/10 pt-5">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-3">
            <p className="text-[10px] text-slate-500">维护天数</p>
            <p className="mt-1 text-xl font-black text-white">
              {stats.totalDays}
              <span className="ml-1 text-xs text-slate-400">天</span>
            </p>
          </div>
          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-3">
            <p className="text-[10px] text-slate-500">当前连续</p>
            <p className="mt-1 text-xl font-black text-white">
              {stats.currentStreak}
              <span className="ml-1 text-xs text-slate-400">天</span>
            </p>
          </div>
          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-3">
            <p className="text-[10px] text-slate-500">最长连续</p>
            <p className="mt-1 text-xl font-black text-white">
              {stats.longestStreak}
              <span className="ml-1 text-xs text-slate-400">天</span>
            </p>
          </div>
          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-3">
            <p className="text-[10px] text-slate-500">最活跃月份</p>
            <p className="mt-1 text-sm font-black text-white">
              {stats.busiestMonth}
            </p>
            <p className="mt-0.5 text-[10px] text-slate-500">
              {stats.busiestMonthCount} 项记录
            </p>
          </div>
        </div>

        <div className="mt-5">
          <p className="text-xs font-bold text-slate-300">维护构成</p>
          <div className="mt-3 space-y-3">
            {kindRows.map((row) => {
              const percentage = calendar.total
                ? Math.round((row.count / calendar.total) * 100)
                : 0;
              return (
                <div key={row.label}>
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-slate-400">{row.label}</span>
                    <span className="text-slate-500">
                      {row.count} 项 · {percentage}%
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                    <div
                      className={`h-full rounded-full ${row.barClass}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
