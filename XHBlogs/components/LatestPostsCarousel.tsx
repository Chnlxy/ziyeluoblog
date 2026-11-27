"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import type { PostSummary } from "../lib/content-types";
import { formatContentDate } from "../lib/format";

export default function LatestPostsCarousel({
  posts,
}: {
  posts: PostSummary[];
}) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (posts.length <= 1) return;

    const timer = window.setInterval(() => {
      setCurrentIndex((index) => (index + 1) % posts.length);
    }, 6000);

    return () => window.clearInterval(timer);
  }, [posts.length]);

  if (posts.length === 0) {
    return (
      <div className="glass-card flex min-h-[420px] flex-col justify-end p-7">
        <p className="text-xs font-black uppercase tracking-[0.3em] text-indigo-300">
          Latest Insight
        </p>
        <h2 className="mt-3 text-3xl font-black text-white">这里还没有文章</h2>
        <p className="mt-3 text-sm leading-7 text-slate-300">
          第一篇文字还在路上。
        </p>
      </div>
    );
  }

  const activeIndex = currentIndex % posts.length;
  const currentPost = posts[activeIndex];

  return (
    <section className="glass-card group relative min-h-[420px] overflow-hidden">
      <Link
        href={`/posts/${currentPost.slug}`}
        className="absolute inset-0 z-20"
        aria-label={`阅读 ${currentPost.title}`}
      />

      <AnimatePresence mode="wait">
        <motion.div
          key={currentPost.slug}
          initial={{ opacity: 0, scale: 1.025 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.65 }}
          className="absolute inset-0"
        >
          <img
            src={currentPost.cover}
            alt=""
            className="h-full w-full object-cover transition duration-1000 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#11120e] via-[#11120e]/45 to-transparent" />
        </motion.div>
      </AnimatePresence>

      <div className="pointer-events-none relative z-10 flex min-h-[420px] flex-col justify-end p-6 desktop:p-8">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-indigo-500/85 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-white backdrop-blur-md">
            最新记录
          </span>
          {currentPost.date && (
            <span className="rounded-full border border-white/15 bg-black/30 px-3 py-1 text-[10px] text-white/80 backdrop-blur-md">
              {formatContentDate(currentPost.date)}
            </span>
          )}
        </div>
        <h2 className="max-w-xl text-2xl font-black leading-tight text-white desktop:text-3xl">
          {currentPost.title}
        </h2>
        <p className="mt-3 line-clamp-3 max-w-xl text-sm leading-7 text-slate-200/85">
          {currentPost.description}
        </p>
      </div>

      {posts.length > 1 && (
        <div className="absolute bottom-5 right-6 z-30 flex gap-2">
          {posts.map((post, index) => (
            <button
              key={post.slug}
              type="button"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                setCurrentIndex(index);
              }}
              aria-label={`切换到第 ${index + 1} 篇文章`}
              aria-current={index === activeIndex}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                index === activeIndex
                  ? "w-7 bg-indigo-300"
                  : "w-2 bg-white/40 hover:bg-white/80"
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
