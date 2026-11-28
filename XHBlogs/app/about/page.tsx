import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import Link from "next/link";

import "highlight.js/styles/atom-one-dark.css";

import BackButton from "../../components/BackButton";
import MaintenanceCalendar from "../../components/MaintenanceCalendar";
import Navbar from "../../components/Navbar";
import PageTransition from "../../components/PageTransition";
import { siteMaintenance } from "../../data/maintenance";
import { getMoments, getPosts } from "../../lib/content";
import { formatContentDate } from "../../lib/format";
import { createMaintenanceEntries } from "../../lib/maintenance";
import { renderMarkdown } from "../../lib/renderMarkdown.mjs";
import { siteConfig } from "../../siteConfig";

export const metadata = {
  title: `关于 | ${siteConfig.title}`,
  description: `关于${siteConfig.authorName}`,
};

export default async function AboutPage() {
  const sourcePath = path.join(process.cwd(), "app", "about", "about.md");
  const fileContents = fs.readFileSync(sourcePath, "utf8");
  const parsed = matter(fileContents);
  const data = parsed.data;
  let content = parsed.content;

  content = content
    .replace(/\r\n/g, "\n")
    .replace(/^[ \t]+$/gm, "");
  content = content
    .split(/(```[\s\S]*?```)/g)
    .map((block, index) => {
      if (index % 2 === 1) return block;
      return block.replace(/\n{3,}/g, (match) => {
        const brCount = match.length - 2;
        return "\n\n" + '<br/>'.repeat(brCount) + "\n\n";
      });
    })
    .join("");

  const contentHtml = (await renderMarkdown(content)).toString();
  const maintenanceEntries = createMaintenanceEntries({
    posts: getPosts(),
    moments: getMoments(),
    siteUpdates: siteMaintenance,
  });
  const recentMaintenance = maintenanceEntries.slice(0, 4);
  const kindLabels = {
    site: "站点",
    post: "文章",
    moment: "说说",
  } as const;

  return (
    <div className="min-h-screen">
      <Navbar />
      <PageTransition>
        <main className="mx-auto w-full max-w-4xl px-4 pb-20 pt-24 sm:px-6 md:pt-28">
          <BackButton />

          <section className="glass-card overflow-hidden">
            <div className="relative h-44 overflow-hidden md:h-64">
              <img
                src={data.cover || "/images/backgrounds/desktop.webp"}
                alt=""
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#171812] via-[#171812]/25 to-transparent" />
            </div>

            <div className="relative px-6 pb-10 pt-0 md:px-12 md:pb-14">
              <div className="-mt-14 h-24 w-24 overflow-hidden rounded-3xl border-4 border-[#26271f] bg-[#26271f] shadow-2xl md:h-28 md:w-28">
                <img
                  src={siteConfig.avatarUrl}
                  alt={siteConfig.authorName}
                  className="h-full w-full object-cover"
                />
              </div>

              <p className="mt-5 text-[10px] font-black uppercase tracking-[0.35em] text-indigo-300">
                About
              </p>
              <h1 className="mt-2 text-4xl font-black text-white md:text-5xl">
                关于梓叶落
              </h1>

              <div
                className="article-prose mt-8"
                dangerouslySetInnerHTML={{ __html: contentHtml }}
              />
            </div>
          </section>

          <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)]">
            <section className="glass-card p-6">
              <p className="text-[10px] font-black uppercase tracking-[0.28em] text-indigo-300">
                Changelog
              </p>
              <h2 className="mt-2 text-lg font-black text-white">
                最近维护
              </h2>
              <div className="mt-4 space-y-3">
                {recentMaintenance.map((entry) => {
                  const content = (
                    <>
                      <div className="flex items-center justify-between gap-3">
                        <span className="rounded-full border border-indigo-300/20 bg-indigo-500/10 px-2 py-0.5 text-[10px] font-bold text-indigo-300">
                          {kindLabels[entry.kind]}
                        </span>
                        <time
                          dateTime={entry.date}
                          className="text-[10px] text-slate-500"
                        >
                          {formatContentDate(entry.date)}
                        </time>
                      </div>
                      <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-200">
                        {entry.title}
                      </p>
                    </>
                  );

                  return entry.href ? (
                    <Link
                      key={`${entry.kind}-${entry.date}-${entry.title}`}
                      href={entry.href}
                      className="block rounded-2xl border border-white/10 p-4 transition hover:border-indigo-300/30 hover:bg-white/5"
                    >
                      {content}
                    </Link>
                  ) : (
                    <div
                      key={`${entry.kind}-${entry.date}-${entry.title}`}
                      className="rounded-2xl border border-white/10 p-4"
                    >
                      {content}
                    </div>
                  );
                })}
              </div>
            </section>

            <MaintenanceCalendar entries={maintenanceEntries} />
          </div>
        </main>
      </PageTransition>
    </div>
  );
}
