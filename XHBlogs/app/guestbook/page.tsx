import type { Metadata } from "next";

import Navbar from "../../components/Navbar";
import PageTransition from "../../components/PageTransition";
import { siteConfig } from "../../siteConfig";
import GuestbookClient from "./GuestbookClient";

export const metadata: Metadata = {
  title: `留言 | ${siteConfig.title}`,
  description: "在梓叶落的幻想郷留下一句话。",
};

export default function GuestbookPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <PageTransition className="flex-1">
        <GuestbookClient />
      </PageTransition>
    </div>
  );
}
