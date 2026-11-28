"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import type { PostSummary } from "../lib/content-types";
import { formatContentDate } from "../lib/format";
import { filterPosts } from "../lib/postSearch";

export default function TimelineArchive({
  posts,
}: {
  posts: PostSummary[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlQuery = searchParams.get("q") || "";
  const [query, setQuery] = useState(urlQuery);

  useEffect(() => {
    setQuery(urlQuery);
  }, [urlQuery]);

  const filteredPosts = useMemo(
    () => filterPosts(posts, query),
    [posts, query],
  );
  const groups = filteredPosts.reduce<Record<string, PostSummary[]>>(
    (result, post) => {
      const date = new Date(post.date);
      const year = Number.isNaN(date.getTime())
        ? "未分类"
        : String(date.getFullYear());
      result[year] = [...(result[year] || []), post];
      return result;
    },
    {},
  );

  const updateUrl = () => {
    const nextQuery = query.trim();
    router.replace(
      nextQuery
        ? `/timeline?q=${encodeURIComponent(nextQuery)}`
        : "/timeline",
      { scroll: false },
    );
  };

  return (
    <div>
      <form
        role="search"
        onSubmit={(event) => {
          event.preventDefault();
          updateUrl();
        }}
        className="mb-8 flex gap-3"
      >
        <label className="relative min-w-0 flex-1">
          <span className="sr-only">搜索归档文章</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="搜索标题、简介或标签"
            className="h-12 w-full rounded-2xl border border-white/15 bg-[#171812]/70 px-5 pr-12 text-sm text-slate-100 shadow-lg backdrop-blur-xl outline-none transition placeholder:text-slate-500 focus:ring-2 focus:ring-indigo-400/45"
          />
          {query && (
            <button
              type="button"
              aria-label="清除搜索"
              onClick={() => {
                setQuery("");
                router.replace("/timeline", { scroll: false });
              }}
              className="absolute inset-y-0 right-3 my-auto flex h-7 w-7 items-center justify-center rounded-full text-slate-500 transition hover:bg-white/10 hover:text-slate-200"
            >
              ✕
            </button>
          )}
        </label>
        <button
          type="submit"
          className="rounded-2xl border border-indigo-300/25 bg-indigo-400/10 px-5 text-sm font-bold text-indigo-200 transition hover:bg-indigo-400/20"
        >
          搜索
        </button>
      </form>

      <div className="mb-5 flex items-center justify-between text-xs text-slate-500">
        <span>
          {query.trim()
            ? `“${query.trim()}”找到 ${filteredPosts.length} 篇文章`
            : `共 ${posts.length} 篇文章`}
        </span>
        {query.trim() && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              router.replace("/timeline", { scroll: false });
            }}
            className="text-indigo-300 hover:text-indigo-200"
          >
            显示全部
          </button>
        )}
      </div>

      {filteredPosts.length === 0 ? (
        <div className="rounded-3xl border border-white/10 bg-[#23241d]/55 p-12 text-center text-slate-400 backdrop-blur-xl">
          没有找到匹配的文章，换个关键词试试。
        </div>
      ) : (
        <div className="space-y-12">
          {Object.entries(groups).map(([year, yearPosts]) => (
            <section key={year}>
              <div className="mb-5 flex items-center gap-4">
                <h2 className="font-mono text-3xl font-black text-indigo-300">
                  {year}
                </h2>
                <div className="h-px flex-1 bg-white/10" />
                <span className="text-xs text-slate-500">
                  {yearPosts.length} 篇
                </span>
              </div>

              <div className="space-y-3 border-l border-white/10 pl-5 md:pl-7">
                {yearPosts.map((post) => (
                  <Link
                    key={post.slug}
                    href={`/posts/${post.slug}`}
                    className="group relative block rounded-2xl border border-white/10 bg-[#23241d]/55 p-5 backdrop-blur-xl transition hover:border-indigo-300/30 hover:bg-[#292a22]/75"
                  >
                    <span className="absolute -left-[30px] top-1/2 h-3 w-3 -translate-y-1/2 rounded-full border-2 border-indigo-400 bg-[#1b1c18] md:-left-[38px]" />
                    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                      <div className="min-w-0">
                        <h3 className="font-black text-white transition group-hover:text-indigo-200">
                          {post.title}
                        </h3>
                        <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-400">
                          {post.description}
                        </p>
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <span className="text-[10px] font-bold text-slate-500">
                            {post.author.name}
                          </span>
                          {post.tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] text-slate-400"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                      <time className="shrink-0 text-[10px] font-bold text-slate-500">
                        {formatContentDate(post.date)}
                      </time>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
