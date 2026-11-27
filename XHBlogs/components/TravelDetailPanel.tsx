"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { CalendarDays, Images, MapPin, X } from "lucide-react";

import {
  formatTravelVisitRange,
  type TravelPlace,
} from "../lib/travel";
import MomentImageLightbox from "./MomentImageLightbox";

export default function TravelDetailPanel({
  place,
  onClose,
}: {
  place: TravelPlace;
  onClose: () => void;
}) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const panelRef = useRef<HTMLElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const lightboxIndexRef = useRef<number | null>(null);

  const sortedVisits = useMemo(
    () =>
      [...place.visits].sort((left, right) =>
        right.date.localeCompare(left.date),
      ),
    [place],
  );
  const photos = useMemo(
    () =>
      sortedVisits.flatMap((visit) => visit.photos),
    [sortedVisits],
  );

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusFrame = window.requestAnimationFrame(() => {
      closeButton.current?.focus();
    });

    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (lightboxIndexRef.current !== null) return;

      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  const openLightbox = (index: number) => {
    lightboxIndexRef.current = index;
    setLightboxIndex(index);
  };

  const closeLightbox = useCallback(() => {
    lightboxIndexRef.current = null;
    setLightboxIndex(null);
  }, []);

  const changeLightbox = useCallback((index: number) => {
    lightboxIndexRef.current = index;
    setLightboxIndex(index);
  }, []);

  return (
    <>
      <aside
        ref={panelRef}
        role="dialog"
        aria-label={`${place.name}旅行详情`}
        tabIndex={-1}
        className="fixed inset-x-3 bottom-3 z-[80] max-h-[72dvh] overflow-y-auto rounded-3xl border border-white/15 bg-[#20211b]/95 p-5 shadow-2xl backdrop-blur-3xl desktop:inset-y-24 desktop:bottom-auto desktop:left-auto desktop:right-5 desktop:w-[390px]"
      >
        <header className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-indigo-300">
              Destination
            </p>
            <h2 className="mt-2 flex items-center gap-2 text-2xl font-black text-white">
              <MapPin size={20} className="text-indigo-300" />
              {place.name}
            </h2>
            <p className="mt-1 text-xs text-slate-400">{place.country}</p>
          </div>
          <button
            ref={closeButton}
            type="button"
            aria-label="关闭旅行详情"
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-300 outline-none transition hover:bg-white/10 focus:ring-2 focus:ring-indigo-300"
          >
            <X size={18} />
          </button>
        </header>

        <div className="mt-6 space-y-5">
          {sortedVisits.map((visit, visitIndex) => {
            const precedingPhotos = sortedVisits
              .slice(0, visitIndex)
              .reduce((total, item) => total + item.photos.length, 0);

            return (
              <section
                key={`${visit.date}-${visit.endDate || "single"}`}
                className="rounded-2xl border border-white/10 bg-black/15 p-4"
              >
                <p className="flex items-center gap-2 text-xs font-bold text-indigo-300">
                  <CalendarDays size={14} />
                  {formatTravelVisitRange(visit)}
                </p>
                {visit.note && (
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-200">
                    {visit.note}
                  </p>
                )}
                {visit.photos.length > 0 && (
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    {visit.photos.map((src, photoIndex) => (
                      <button
                        key={`${src}-${photoIndex}`}
                        type="button"
                        aria-label={`查看${place.name}旅行照片 ${precedingPhotos + photoIndex + 1}`}
                        onClick={() =>
                          openLightbox(precedingPhotos + photoIndex)
                        }
                        className="group relative aspect-square overflow-hidden rounded-xl border border-white/10 outline-none focus:ring-2 focus:ring-indigo-300"
                      >
                        <img
                          src={src}
                          alt={
                            visit.note?.trim() || `${place.name}旅行照片`
                          }
                          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </section>
            );
          })}
        </div>

        <p className="mt-5 flex items-center gap-2 text-[11px] text-slate-500">
          <Images size={13} />
          共 {photos.length} 张旅行照片
        </p>
      </aside>

      {lightboxIndex !== null && (
        <MomentImageLightbox
          images={photos}
          index={lightboxIndex}
          onClose={closeLightbox}
          onChange={changeLightbox}
          ariaLabel={`查看${place.name}旅行照片`}
        />
      )}
    </>
  );
}
