"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
} from "framer-motion";
import { CalendarDays, Images, MapPin, MousePointer2 } from "lucide-react";

import TravelDetailPanel from "../../components/TravelDetailPanel";
import { travelPlaces } from "../../data/travel";
import {
  type TravelFallbackPlace,
  buildTravelFallbackPlaces,
  formatTravelDate,
  validateTravelPlaces,
} from "../../lib/travel";
import { detectWebglSupport } from "../../lib/webgl";

const TravelGlobe = dynamic(
  () => import("../../components/TravelGlobe"),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[68dvh] items-center justify-center text-sm text-slate-300">
        正在展开地球……
      </div>
    ),
  },
);

const validationError = (() => {
  try {
    validateTravelPlaces(travelPlaces);
    return "";
  } catch (error) {
    return error instanceof Error ? error.message : "旅行数据格式无效";
  }
})();

let cachedWebglSupport: boolean | null = null;

function getWebglSupport() {
  if (cachedWebglSupport === null) {
    cachedWebglSupport = detectWebglSupport();
  }
  return cachedWebglSupport;
}

function WebglFallback({
  places,
  onSelect,
}: {
  places: TravelFallbackPlace[];
  onSelect: (id: string) => void;
}) {
  return (
    <div className="grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-3">
      {places.map((place) => (
        <button
          key={place.id}
          type="button"
          data-place-id={place.id}
          onClick={() => onSelect(place.id)}
          className="rounded-3xl border border-white/10 bg-white/5 p-5 text-left transition hover:border-indigo-300/30 hover:bg-white/10"
        >
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 text-indigo-300">
              <MapPin size={17} />
            </span>
            <div>
              <h3 className="font-black text-white">
                {place.name}
                <span className="ml-2 text-xs font-bold text-slate-500">
                  {place.country}
                </span>
              </h3>
              <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-400">
                <CalendarDays size={13} />
                {formatTravelDate(
                  place.latestVisitDate,
                  place.latestVisitPrecision,
                )}
              </p>
              <p className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-400">
                <Images size={13} />
                {place.photoCount} 张照片
              </p>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}

export default function FootprintsClient() {
  const reducedMotion = useReducedMotion();
  const motionTransition = reducedMotion
    ? { duration: 0 }
    : {
        duration: 0.3,
        ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
      };
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [webglState, setWebglState] = useState<
    "checking" | "supported" | "unsupported"
  >("checking");

  useEffect(() => {
    let active = true;
    const frame = window.requestAnimationFrame(() => {
      if (!active) return;
      setWebglState(
        getWebglSupport() ? "supported" : "unsupported",
      );
    });
    return () => {
      active = false;
      window.cancelAnimationFrame(frame);
    };
  }, []);

  const selectedPlace = useMemo(
    () =>
      travelPlaces.find((place) => place.id === selectedId) || null,
    [selectedId],
  );
  const fallbackPlaces = useMemo<TravelFallbackPlace[]>(
    () => buildTravelFallbackPlaces(travelPlaces),
    [],
  );
  const closeDetail = () => {
    const placeId = selectedId;
    setSelectedId(null);
    if (!placeId) return;

    window.requestAnimationFrame(() => {
      document
        .querySelector<HTMLElement>(`[data-place-id="${placeId}"]`)
        ?.focus();
    });
  };
  const selectPlace = (id: string | null) => {
    setSelectedId(id);
  };

  return (
    <>
      <main className="mx-auto w-full max-w-7xl px-4 pb-24 pt-24 sm:px-6 md:pt-28">
        <header className="mx-auto max-w-3xl text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.35em] text-indigo-300">
            Footprints
          </p>
          <h1 className="mt-3 text-4xl font-black text-white">足迹</h1>
          <p className="mt-3 text-sm leading-7 text-slate-300">
            从杭州出发，看看那些已经抵达过的地方。
          </p>
          <p className="mt-2 flex items-center justify-center gap-2 text-xs text-slate-500">
            <MousePointer2 size={13} />
            拖动地球探索，点击地点查看旅程。
          </p>
        </header>

        {validationError ? (
          <div className="glass-card mx-auto mt-10 max-w-2xl p-8 text-center text-sm text-rose-200">
            旅行数据暂时无法展示：{validationError}
          </div>
        ) : (
          <div
            className={`footprints-layout ${
              selectedPlace ? "footprints-layout--panel-open" : ""
            }`}
          >
            <section
              className="footprints-globe-stage relative min-h-[68dvh] overflow-hidden rounded-[2rem]"
            >
              <div
                aria-hidden="true"
                className="footprints-globe-backdrop glass-card"
              />
              <div className="relative z-10">
                {webglState === "checking" ? (
                  <div className="flex min-h-[68dvh] items-center justify-center text-sm text-slate-300">
                    正在准备旅程……
                  </div>
                ) : webglState === "supported" ? (
                  <div className="h-[68dvh] min-h-[520px]">
                    <TravelGlobe
                      places={travelPlaces}
                      selectedId={selectedId}
                      onSelect={selectPlace}
                    />
                  </div>
                ) : (
                  <WebglFallback
                    places={fallbackPlaces}
                    onSelect={selectPlace}
                  />
                )}
              </div>
            </section>
            <AnimatePresence initial={false}>
              {selectedPlace && (
                <motion.div
                  key="travel-detail-motion"
                  className="travel-detail-motion"
                  initial={{ opacity: 0, y: 18, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: "auto" }}
                  exit={{ opacity: 0, y: 18, height: 0 }}
                  transition={motionTransition}
                >
                  <TravelDetailPanel
                    key={selectedPlace.id}
                    place={selectedPlace}
                    onClose={closeDetail}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </main>
    </>
  );
}
