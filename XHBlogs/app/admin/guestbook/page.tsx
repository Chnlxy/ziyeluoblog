import type { Metadata } from "next";
import Link from "next/link";

import Navbar from "../../../components/Navbar";
import PageTransition from "../../../components/PageTransition";
import { siteConfig } from "../../../siteConfig";
import AdminGuestbookClient from "./AdminGuestbookClient";

export const metadata: Metadata = {
  title: `留言审核 | ${siteConfig.title}`,
  robots: { index: false, follow: false },
};

export default function AdminGuestbookPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <PageTransition className="flex-1">
        <main className="mx-auto w-full max-w-5xl px-4 pb-24 pt-24 sm:px-6 md:pt-28">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-300">
                Moderation
              </p>
              <h1 className="mt-2 text-3xl font-black text-white">留言审核</h1>
              <p className="mt-2 text-sm text-slate-400">
                输入本站管理员密码后即可审核。
              </p>
            </div>
            <Link
              href="/guestbook/"
              className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-slate-300 transition hover:bg-white/10"
            >
              查看公开留言墙
            </Link>
          </div>
          <AdminGuestbookClient />
        </main>
      </PageTransition>
    </div>
  );
}
