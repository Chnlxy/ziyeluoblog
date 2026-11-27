import type { Metadata } from "next";
import Link from "next/link";

import Navbar from "../../components/Navbar";
import PageTransition from "../../components/PageTransition";
import { getPosts } from "../../lib/content";
import { formatContentDate } from "../../lib/format";
import { siteConfig } from "../../siteConfig";

export const metadata: Metadata = {
  title: `归档 | ${siteConfig.title}`,
  description: "梓叶落の幻想郷文章归档",
};

export default function TimelinePage() {
  const posts = getPosts();
  const groups = posts.reduce<Record<string, typeof posts>>((result, post) => {
    const date = new Date(post.date);
    const year = Number.isNaN(date.getTime())
      ? "未分类"
      : String(date.getFullYear());
    result[year] = [...(result[year] || []), post];
    return result;
  }, {});

  return (
    <div className="min-h-screen">
      <Navbar />
      <PageTransition>
        <main className="mx-auto w-full max-w-4xl px-4 pb-20 pt-24 sm:px-6 md:pt-28">
          <header className="mb-12">
            <p className="text-[10px] font-black uppercase tracking-[0.35em] text-indigo-300">
              Timeline
            </p>
            <h1 className="mt-3 text-4xl font-black text-white">归档</h1>
            <p className="mt-3 text-sm text-slate-300">
              按时间整理留下的文字。
            </p>
          </header>

          {posts.length === 0 ? (
            <div className="glass-card p-12 text-center text-slate-400">
              这里还没有文章。
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
                        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
                          <div>
                            <h3 className="font-black text-white transition group-hover:text-indigo-200">
                              {post.title}
                            </h3>
                            <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-400">
                              {post.description}
                            </p>
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
        </main>
      </PageTransition>
    </div>
  );
}
