import type { Metadata } from "next";
import { notFound } from "next/navigation";

import Navbar from "../../../components/Navbar";
import PageTransition from "../../../components/PageTransition";
import { getMoment, getMoments } from "../../../lib/content";
import { siteConfig } from "../../../siteConfig";
import MomentDetail from "./MomentDetail";

export const dynamicParams = false;

export function generateStaticParams() {
  return getMoments().map((moment) => ({ id: moment.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const moment = getMoment(id);

  return {
    title: moment
      ? `${moment.content.slice(0, 24)} | ${siteConfig.title}`
      : `说说 | ${siteConfig.title}`,
    description: moment?.content ?? "梓叶落的生活碎片",
  };
}

export default async function MomentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  const moment = getMoment(resolvedParams.id);

  if (!moment) notFound();

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <PageTransition className="flex-1">
        <MomentDetail moment={moment} />
      </PageTransition>
    </div>
  );
}
