import Link from "next/link";
import type { MomentSummary } from "../lib/content-types";
import { formatContentDate } from "../lib/format";

export default function HomeMoments({ moments }: { moments: MomentSummary[] }) {
  return (
    <section className="glass-card p-6 md:p-7">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400">
            Moments
          </p>
          <h2 className="mt-1 text-2xl font-black text-white">生活碎片</h2>
        </div>
        <Link
          href="/moments"
          className="text-xs font-bold text-indigo-300 transition hover:text-indigo-200"
        >
          全部记录 →
        </Link>
      </div>

      {moments.length === 0 ? (
        <p className="py-10 text-center text-sm text-slate-400">
          还没有留下生活碎片。
        </p>
      ) : (
        <div className="space-y-3">
          {moments.map((moment) => (
            <Link
              href="/moments"
              key={moment.id}
              className="group block rounded-2xl border border-white/10 bg-white/[0.04] p-4 transition hover:border-indigo-400/30 hover:bg-white/[0.07]"
            >
              <div className="flex items-center justify-between gap-3 text-[10px] font-bold uppercase tracking-wider">
                <span className="text-indigo-300">
                  {formatContentDate(moment.date)}
                </span>
                {moment.location && (
                  <span className="truncate text-slate-500">
                    {moment.location}
                  </span>
                )}
              </div>
              <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-300 transition group-hover:text-slate-100">
                {moment.content}
              </p>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
