"use client";

import { useState } from "react";

import BackButton from "../../components/BackButton";
import { friendsData } from "../../data/friends";
import { siteConfig } from "../../siteConfig";

export default function FriendsBoard() {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(siteConfig.friendLinkApplyFormat);
    setIsCopied(true);
    window.setTimeout(() => setIsCopied(false), 1800);
  };

  return (
    <div className="mx-auto w-full max-w-5xl px-4 pb-20 pt-24 sm:px-6 md:pt-28">
      <BackButton />

      <header className="mb-10">
        <p className="text-[10px] font-black uppercase tracking-[0.35em] text-indigo-300">
          Friends
        </p>
        <h1 className="mt-3 text-4xl font-black text-white">朋友们的角落</h1>
        <p className="mt-3 text-sm leading-7 text-slate-300">
          把喜欢的人与有趣的网站放在一起。
        </p>
      </header>

      {friendsData.length === 0 ? (
        <section className="glass-card flex min-h-64 flex-col items-center justify-center p-8 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-indigo-500/15 text-3xl text-indigo-300">
            ✦
          </div>
          <h2 className="mt-5 text-2xl font-black text-white">等待交换友链</h2>
          <p className="mt-2 max-w-md text-sm leading-7 text-slate-400">
            朋友们的链接之后会慢慢出现在这里。
          </p>
        </section>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {friendsData.map((friend) => (
            <a
              key={friend.id}
              href={friend.url}
              target="_blank"
              rel="noopener noreferrer"
              className="glass-card group p-6 transition hover:-translate-y-1 hover:border-indigo-300/30"
            >
              <div className="flex items-center gap-4">
                <img
                  src={friend.avatar}
                  alt=""
                  className="h-14 w-14 rounded-2xl object-cover"
                />
                <div className="min-w-0">
                  <h2 className="truncate font-black text-white group-hover:text-indigo-200">
                    {friend.name}
                  </h2>
                  <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-indigo-300">
                    访问网站 →
                  </p>
                </div>
              </div>
              <p className="mt-5 line-clamp-3 text-sm leading-6 text-slate-400">
                {friend.description}
              </p>
            </a>
          ))}
        </div>
      )}

      <section className="glass-card mx-auto mt-10 max-w-3xl p-6 md:p-8">
        <div className="text-center">
          <h2 className="text-xl font-black text-white">交换友链</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            复制下面的格式，之后可以通过邮件或聊天发给我。
          </p>
        </div>

        <div className="relative mt-6 rounded-2xl border border-white/10 bg-black/20 p-5 pr-14">
          <pre className="whitespace-pre-wrap break-words font-mono text-xs leading-6 text-slate-300">
            {siteConfig.friendLinkApplyFormat}
          </pre>
          <button
            type="button"
            onClick={handleCopy}
            className="absolute right-3 top-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-slate-300 transition hover:bg-indigo-500 hover:text-white"
          >
            {isCopied ? "已复制" : "复制"}
          </button>
        </div>
      </section>
    </div>
  );
}
