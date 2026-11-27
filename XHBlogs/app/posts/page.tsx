import type { Metadata } from "next";
import Link from "next/link";

import Navbar from "../../components/Navbar";
import PageTransition from "../../components/PageTransition";
import { getPosts } from "../../lib/content";
import { formatContentDate } from "../../lib/format";
import { siteConfig } from "../../siteConfig";

export const metadata: Metadata = {
  title: `文章 | ${siteConfig.title}`,
  description: "梓叶落の幻想郷文章列表",
};

export default function PostsPage() {
  const posts = getPosts();

  return (
    <div className="min-h-screen">
      <Navbar />
      <PageTransition>
        <main className="mx-auto w-full max-w-5xl px-4 pb-20 pt-24 sm:px-6 md:pt-28">
          <header className="mb-10">
            <p className="text-[10px] font-black uppercase tracking-[0.35em] text-indigo-300">
              Archive
            </p>
            <h1 className="mt-3 text-4xl font-black tracking-tight text-white">
              文章
            </h1>
            <p className="mt-3 text-sm leading-7 text-slate-300">
              把想留下来的文字放在这里。
            </p>
          </header>

          {posts.length === 0 ? (
            <div className="glass-card p-12 text-center text-slate-300">
              这里还没有文章。
            </div>
          ) : (
            <div className="grid gap-5">
              {posts.map((post) => (
                <Link
                  key={post.slug}
                  href={`/posts/${post.slug}`}
                  className="glass-card group grid min-h-48 grid-cols-1 overflow-hidden transition hover:-translate-y-1 hover:border-indigo-300/30 md:grid-cols-[240px_1fr]"
                >
                  <div className="relative min-h-40 overflow-hidden md:min-h-48">
                    <img
                      src={post.cover}
                      alt=""
                      className="h-full w-full object-cover opacity-90 transition duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#1b1c18]/35" />
                  </div>

                  <div className="flex flex-col justify-center p-6 md:p-8">
                    <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-wider">
                      <time className="text-indigo-300">
                        {formatContentDate(post.date)}
                      </time>
                      {post.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full border border-white/10 px-2 py-1 text-slate-400"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    <h2 className="mt-3 text-2xl font-black text-white transition group-hover:text-indigo-200">
                      {post.title}
                    </h2>
                    <p className="mt-2 line-clamp-2 text-sm leading-7 text-slate-400">
                      {post.description}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </main>
      </PageTransition>
    </div>
  );
}
