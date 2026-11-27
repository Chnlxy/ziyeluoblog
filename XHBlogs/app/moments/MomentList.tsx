"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Search, X } from "lucide-react";

import { formatContentDate } from "../../lib/format";
import type { MomentSummary } from "../../lib/content-types";

export default function MomentList({
  moments,
  authorName,
  avatarUrl,
}: {
  moments: MomentSummary[];
  authorName: string;
  avatarUrl: string;
}) {
  const [query, setQuery] = useState("");
  const [order, setOrder] = useState<"new" | "old">("new");
  const [lightbox, setLightbox] = useState<{
    images: string[];
    index: number;
  } | null>(null);

  const visibleMoments = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return moments
      .filter((moment) => {
        if (!keyword) return true;
        return (
          moment.content.toLowerCase().includes(keyword) ||
          moment.location.toLowerCase().includes(keyword)
        );
      })
      .sort((a, b) => {
        const difference =
          new Date(a.date).getTime() - new Date(b.date).getTime();
        return order === "new" ? -difference : difference;
      });
  }, [moments, order, query]);

  const moveLightbox = (direction: number) => {
    if (!lightbox) return;

    setLightbox({
      ...lightbox,
      index:
        (lightbox.index + direction + lightbox.images.length) %
        lightbox.images.length,
    });
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-24 pt-24 sm:px-6 md:pt-28">
      <header className="text-center">
        <p className="text-[10px] font-black uppercase tracking-[0.35em] text-indigo-300">
          Moments
        </p>
        <h1 className="mt-3 text-4xl font-black text-white">生活碎片</h1>
        <p className="mt-3 text-sm text-slate-400">
          记录一些想留住的片刻。
        </p>
      </header>

      <div className="mx-auto mt-8 flex max-w-2xl flex-col items-center gap-3 sm:flex-row">
        <label className="relative w-full">
          <span className="sr-only">搜索说说</span>
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="搜索内容或地点"
            className="h-12 w-full rounded-2xl border border-white/10 bg-[#25261f]/80 pl-11 pr-4 text-sm text-slate-200 outline-none backdrop-blur-xl transition placeholder:text-slate-500 focus:border-indigo-300/40"
          />
        </label>

        <div className="flex rounded-2xl border border-white/10 bg-[#25261f]/80 p-1 backdrop-blur-xl">
          <button
            type="button"
            onClick={() => setOrder("new")}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
              order === "new"
                ? "bg-indigo-500 text-white"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            最新
          </button>
          <button
            type="button"
            onClick={() => setOrder("old")}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
              order === "old"
                ? "bg-indigo-500 text-white"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            最早
          </button>
        </div>
      </div>

      {visibleMoments.length === 0 ? (
        <div className="glass-card mx-auto mt-10 max-w-lg p-12 text-center text-slate-400">
          这里还没有留下内容。
        </div>
      ) : (
        <div className="mt-10 columns-1 gap-5 md:columns-2">
          {visibleMoments.map((moment) => (
            <article
              key={moment.id}
              className="glass-card mb-5 break-inside-avoid p-6 md:p-7"
            >
              <header className="flex items-center gap-3">
                <img
                  src={avatarUrl}
                  alt=""
                  className="h-11 w-11 rounded-2xl object-cover"
                />
                <div>
                  <h2 className="font-black text-white">{authorName}</h2>
                  <p className="mt-0.5 text-[10px] font-bold text-indigo-300">
                    {formatContentDate(moment.date)}
                  </p>
                </div>
              </header>

              <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-7 text-slate-200">
                {moment.content}
              </p>

              {moment.images.length > 0 && (
                <div
                  className={`mt-4 grid gap-2 ${
                    moment.images.length === 1
                      ? "grid-cols-1"
                      : "grid-cols-2"
                  }`}
                >
                  {moment.images.map((image, index) => (
                    <button
                      key={image}
                      type="button"
                      onClick={() =>
                        setLightbox({ images: moment.images, index })
                      }
                      className="overflow-hidden rounded-2xl border border-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    >
                      <img
                        src={image}
                        alt={`说说配图 ${index + 1}`}
                        className="max-h-96 w-full object-cover transition duration-500 hover:scale-105"
                      />
                    </button>
                  ))}
                </div>
              )}

              {moment.location && (
                <p className="mt-4 inline-flex rounded-full bg-indigo-500/10 px-3 py-1 text-[10px] font-bold text-indigo-300">
                  {moment.location}
                </p>
              )}
            </article>
          ))}
        </div>
      )}

      {lightbox && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="查看图片"
          className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/95 p-4 backdrop-blur-xl"
        >
          <button
            type="button"
            aria-label="关闭图片"
            onClick={() => setLightbox(null)}
            className="absolute right-5 top-5 rounded-full bg-white/10 p-3 text-white transition hover:bg-white/20"
          >
            <X size={20} />
          </button>

          {lightbox.images.length > 1 && (
            <>
              <button
                type="button"
                aria-label="上一张"
                onClick={() => moveLightbox(-1)}
                className="absolute left-4 rounded-full bg-white/10 p-3 text-white transition hover:bg-white/20"
              >
                <ChevronLeft size={24} />
              </button>
              <button
                type="button"
                aria-label="下一张"
                onClick={() => moveLightbox(1)}
                className="absolute right-4 rounded-full bg-white/10 p-3 text-white transition hover:bg-white/20"
              >
                <ChevronRight size={24} />
              </button>
            </>
          )}

          <img
            src={lightbox.images[lightbox.index]}
            alt=""
            className="max-h-[85vh] max-w-full rounded-2xl object-contain shadow-2xl"
          />
          <p className="absolute bottom-6 rounded-full bg-white/10 px-4 py-2 text-xs text-white">
            {lightbox.index + 1} / {lightbox.images.length}
          </p>
        </div>
      )}
    </div>
  );
}
