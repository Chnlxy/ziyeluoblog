import type { Metadata } from "next";
import { Suspense } from "react";

import Navbar from "../../components/Navbar";
import PageTransition from "../../components/PageTransition";
import TimelineArchive from "../../components/TimelineArchive";
import { getPosts } from "../../lib/content";
import { siteConfig } from "../../siteConfig";

export const metadata: Metadata = {
  title: `归档 | ${siteConfig.title}`,
  description: "梓叶落の幻想郷文章归档",
};

export default function TimelinePage() {
  const posts = getPosts();

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

          <Suspense
            fallback={
              <div className="glass-card p-12 text-center text-slate-400">
                正在整理归档……
              </div>
            }
          >
            <TimelineArchive posts={posts} />
          </Suspense>
        </main>
      </PageTransition>
    </div>
  );
}
