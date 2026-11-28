"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";

import { filterPosts } from "../lib/postSearch";

interface Post {
  slug: string;
  title: string;
  description: string;
  tags: string[];
  date: string;
}

const escapeRegExp = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function Highlight({
  text = "",
  query = "",
}: {
  text?: string;
  query?: string;
}) {
  if (!query.trim() || !text) return <>{text}</>;

  const regex = new RegExp(`(${escapeRegExp(query)})`, "gi");
  return (
    <>
      {String(text)
        .split(regex)
        .map((part, index) =>
          part.toLowerCase() === query.toLowerCase() ? (
            <mark
              key={index}
              className="mx-px rounded bg-amber-300/90 px-1 font-bold text-slate-900"
            >
              {part}
            </mark>
          ) : (
            <span key={index}>{part}</span>
          ),
        )}
    </>
  );
}

export default function SearchBar({
  posts = [],
}: {
  posts: Post[];
}) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  const searchResults = useMemo(
    () => filterPosts(posts, searchQuery),
    [posts, searchQuery],
  );
  const visibleResults = searchResults.slice(0, 6);
  const archiveHref = `/timeline?q=${encodeURIComponent(
    searchQuery.trim(),
  )}`;

  useEffect(() => {
    setActiveIndex(-1);
  }, [searchQuery]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const openArchive = () => {
    if (!searchQuery.trim()) return;
    setIsOpen(false);
    router.push(archiveHref);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const activePost = visibleResults[activeIndex];
    if (activePost) {
      setIsOpen(false);
      router.push(`/posts/${activePost.slug}`);
      return;
    }
    openArchive();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      setIsOpen(false);
      setActiveIndex(-1);
      event.currentTarget.blur();
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setIsOpen(true);
      setActiveIndex((current) =>
        Math.min(visibleResults.length - 1, current + 1),
      );
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setIsOpen(true);
      setActiveIndex((current) => Math.max(-1, current - 1));
    }
  };

  const showResults =
    isOpen && searchQuery.trim() !== "";

  return (
    <div
      ref={containerRef}
      className={`relative mx-auto mb-8 w-full max-w-[28rem] ${
        isOpen ? "z-[100]" : "z-40"
      }`}
    >
      <form
        role="search"
        className="group relative"
        onSubmit={handleSubmit}
      >
        <input
          type="search"
          role="combobox"
          aria-label="搜索文章"
          aria-expanded={showResults}
          aria-controls="home-search-results"
          aria-autocomplete="list"
          aria-activedescendant={
            activeIndex >= 0
              ? `home-search-result-${visibleResults[activeIndex]?.slug}`
              : undefined
          }
          className="relative z-0 h-12 w-full rounded-2xl border border-white/15 bg-[#171812]/70 py-3 pl-12 pr-5 text-base font-medium text-slate-100 shadow-xl backdrop-blur-xl transition placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-400/45"
          placeholder="搜索文章标题、简介或标签"
          value={searchQuery}
          onChange={(event) => {
            setSearchQuery(event.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          autoComplete="off"
          spellCheck="false"
        />

        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 flex items-center pl-4">
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5 text-slate-500 transition-colors group-focus-within:text-indigo-300"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </div>
      </form>

      <AnimatePresence>
        {showResults && (
          <motion.div
            id="home-search-results"
            role="listbox"
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.18 }}
            className="absolute left-0 right-0 top-full z-20 mt-2 max-h-[28rem] overflow-y-auto rounded-2xl border border-white/15 bg-[#1d1e18]/95 shadow-2xl backdrop-blur-3xl"
          >
            {visibleResults.length > 0 ? (
              <div className="p-2">
                {visibleResults.map((post, index) => (
                  <Link
                    id={`home-search-result-${post.slug}`}
                    role="option"
                    aria-selected={activeIndex === index}
                    href={`/posts/${post.slug}`}
                    key={post.slug}
                    onClick={() => setIsOpen(false)}
                    onMouseEnter={() => setActiveIndex(index)}
                    className={`block rounded-xl px-4 py-3 transition ${
                      activeIndex === index
                        ? "bg-indigo-400/12"
                        : "hover:bg-white/5"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <h4 className="line-clamp-1 font-bold text-slate-100">
                        <Highlight
                          text={post.title}
                          query={searchQuery}
                        />
                      </h4>
                      {post.date && (
                        <time className="shrink-0 font-mono text-[10px] text-slate-500">
                          {post.date.split(" ")[0]}
                        </time>
                      )}
                    </div>
                    {post.description && (
                      <p className="mt-1 line-clamp-1 text-xs leading-5 text-slate-400">
                        <Highlight
                          text={post.description}
                          query={searchQuery}
                        />
                      </p>
                    )}
                  </Link>
                ))}
              </div>
            ) : (
              <div className="px-5 py-8 text-center text-sm text-slate-400">
                没有找到“{searchQuery}”相关的文章
              </div>
            )}

            <Link
              href={archiveHref}
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-between border-t border-white/10 px-5 py-3 text-xs font-bold text-indigo-300 transition hover:bg-indigo-400/10"
            >
              <span>
                查看全部结果
                {searchResults.length > 0 &&
                  `（${searchResults.length}）`}
              </span>
              <span aria-hidden="true">→</span>
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
