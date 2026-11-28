import type { Metadata } from "next";

import Navbar from "../../components/Navbar";
import PageTransition from "../../components/PageTransition";
import { getMoments } from "../../lib/content";
import { siteConfig } from "../../siteConfig";
import MomentList from "./MomentList";

export const metadata: Metadata = {
  title: `说说 | ${siteConfig.title}`,
  description: "梓叶落的生活碎片",
};

export default function MomentsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <PageTransition className="flex-1">
        <MomentList moments={getMoments()} />
      </PageTransition>
    </div>
  );
}
