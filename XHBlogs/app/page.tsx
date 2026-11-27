import Link from "next/link";

import HomeGallery from "../components/HomeGallery";
import HomeMoments from "../components/HomeMoments";
import LatestPostsCarousel from "../components/LatestPostsCarousel";
import Navbar from "../components/Navbar";
import PageTransition from "../components/PageTransition";
import ProfileCard from "../components/ProfileCard";
import SearchBar from "../components/SearchBar";
import { albums } from "../data/albums";
import { getMoments, getPosts } from "../lib/content";
import { siteConfig } from "../siteConfig";

export default function Home() {
  const posts = getPosts();
  const moments = getMoments();
  const photoCount = albums.reduce(
    (total, album) => total + album.photos.length,
    0,
  );
  const latestMoment = moments[0];

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <PageTransition className="flex-1">
        <main className="mx-auto w-full max-w-6xl px-4 pb-16 pt-24 sm:px-6 desktop:pt-28 desktop-wide:px-10">
          <SearchBar posts={posts} />

          <div className="grid grid-cols-1 gap-6 desktop-wide:grid-cols-12">
            <div className="desktop-wide:col-span-7">
              <ProfileCard
                postCount={posts.length}
                chatterCount={moments.length}
                photoCount={photoCount}
              />
            </div>

            <aside className="glass-card relative flex min-h-[230px] flex-col justify-between overflow-hidden p-6 desktop:p-8 desktop-wide:col-span-5">
              <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-indigo-400/10 blur-3xl" />
              <div className="relative z-10">
                <p className="text-[10px] font-black uppercase tracking-[0.32em] text-indigo-300">
                  A Quiet Corner
                </p>
                <h2 className="mt-3 text-2xl font-black leading-snug text-white">
                  叶子落下的时候，
                  <br />
                  把故事留在这里。
                </h2>
              </div>

              <div className="relative z-10 mt-8 border-t border-white/10 pt-5">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
                  最近状态
                </p>
                <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-300">
                  {latestMoment?.content || "正在慢慢布置这个小小的幻想乡。"}
                </p>
              </div>
            </aside>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 desktop-wide:grid-cols-12">
            <div className="desktop-wide:col-span-5">
              <LatestPostsCarousel posts={posts.slice(0, 5)} />
            </div>
            <div className="desktop-wide:col-span-7">
              <HomeGallery albums={albums} />
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 desktop-wide:grid-cols-12">
            <div className="desktop-wide:col-span-7">
              <HomeMoments moments={moments.slice(0, 3)} />
            </div>

            <div className="grid gap-3 desktop-wide:col-span-5">
              <Link
                href="/friends"
                className="glass-card group flex min-h-32 items-center justify-between p-6 transition hover:-translate-y-1 hover:border-indigo-300/25"
              >
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-300">
                    Friends
                  </p>
                  <h2 className="mt-2 text-xl font-black text-white">朋友们的角落</h2>
                  <p className="mt-1 text-sm text-slate-400">欢迎交换友链</p>
                </div>
                <span className="text-3xl text-indigo-300 transition group-hover:translate-x-1">
                  →
                </span>
              </Link>

              <Link
                href="/about"
                className="glass-card group flex min-h-32 items-center justify-between p-6 transition hover:-translate-y-1 hover:border-indigo-300/25"
              >
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-300">
                    About
                  </p>
                  <h2 className="mt-2 text-xl font-black text-white">关于梓叶落</h2>
                  <p className="mt-1 text-sm text-slate-400">暂时没有喵</p>
                </div>
                <span className="text-3xl text-indigo-300 transition group-hover:translate-x-1">
                  →
                </span>
              </Link>
            </div>
          </div>

          <footer className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-white/10 py-8 text-xs text-slate-500 desktop:flex-row">
            <p>© {new Date().getFullYear()} {siteConfig.authorName}. 保留所有温柔。</p>
            <p>基于 Next.js 构建 · 上游许可署名已保留</p>
          </footer>
        </main>
      </PageTransition>
    </div>
  );
}
