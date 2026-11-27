import type { Metadata } from "next";

import Navbar from "../../components/Navbar";
import PageTransition from "../../components/PageTransition";
import { siteConfig } from "../../siteConfig";
import FootprintsClient from "./FootprintsClient";

export const metadata: Metadata = {
  title: `足迹 | ${siteConfig.title}`,
  description: "从杭州出发，记录去过的地方。",
};

export default function FootprintsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <PageTransition className="flex-1" offsetY={0}>
        <FootprintsClient />
      </PageTransition>
    </div>
  );
}
