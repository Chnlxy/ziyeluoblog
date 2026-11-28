"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import MomentImageLightbox from "../../../components/MomentImageLightbox";
import { formatContentDate } from "../../../lib/format";
import type { MomentSummary } from "../../../lib/content-types";

export default function MomentDetail({
  moment,
}: {
  moment: MomentSummary;
}) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  return (
    <main className="mx-auto w-full max-w-4xl px-4 pb-24 pt-24 sm:px-6 md:pt-28">
      <Link
        href="/moments/"
        className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-[#25261f]/75 px-4 py-2 text-xs font-bold text-slate-300 backdrop-blur-xl transition hover:border-indigo-300/30 hover:text-white"
      >
        <ArrowLeft size={15} />
        返回全部说说
      </Link>

      <article className="glass-card mt-6 overflow-hidden p-6 sm:p-8 md:p-10">
        <header className="flex items-center gap-4 border-b border-white/10 pb-6">
          <img
            src={moment.author.avatarUrl}
            alt=""
            className="h-14 w-14 rounded-2xl object-cover"
          />
          <div className="min-w-0">
            <h1 className="text-xl font-black text-white">{moment.author.name}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] font-bold">
              <time
                dateTime={moment.date}
                className="text-indigo-300"
              >
                {formatContentDate(moment.date)}
              </time>
              {moment.location && (
                <span className="rounded-full bg-indigo-500/10 px-2.5 py-1 text-indigo-300">
                  {moment.location}
                </span>
              )}
            </div>
          </div>
        </header>

        <p className="mt-7 whitespace-pre-wrap break-words text-base leading-8 text-slate-100 sm:text-lg sm:leading-9">
          {moment.content}
        </p>

        {moment.images.length > 0 && (
          <div
            className={`mt-8 grid gap-3 ${
              moment.images.length === 1 ? "grid-cols-1" : "grid-cols-2"
            }`}
          >
            {moment.images.map((image, index) => (
              <button
                key={image}
                type="button"
                onClick={() => setLightboxIndex(index)}
                className="overflow-hidden rounded-2xl border border-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-300"
              >
                <img
                  src={image}
                  alt={`说说配图 ${index + 1}`}
                  className="max-h-[70dvh] w-full object-cover transition duration-500 hover:scale-105"
                />
              </button>
            ))}
          </div>
        )}
      </article>

      {lightboxIndex !== null && (
        <MomentImageLightbox
          images={moment.images}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onChange={setLightboxIndex}
        />
      )}
    </main>
  );
}
