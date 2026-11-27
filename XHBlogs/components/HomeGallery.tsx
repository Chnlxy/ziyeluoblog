import Link from "next/link";
import type { Album } from "../data/albums";
import { formatContentDate } from "../lib/format";

export default function HomeGallery({ albums }: { albums: Album[] }) {
  const album = albums[0];

  if (!album) {
    return (
      <section className="glass-card min-h-64 p-7">
        <p className="text-xs font-black uppercase tracking-[0.28em] text-indigo-400">
          Gallery
        </p>
        <h2 className="mt-3 text-2xl font-black text-white">光影收藏</h2>
        <p className="mt-3 max-w-md text-sm leading-7 text-slate-300">
          把喜欢的画面慢慢放进来。
        </p>
      </section>
    );
  }

  const preview = album.photos.slice(0, 4);

  return (
    <section className="glass-card group relative min-h-72 overflow-hidden">
      <Link href="/photowall" className="block h-full min-h-72">
        <div className="grid h-full min-h-72 grid-cols-2">
          <div className="relative col-span-2 min-h-40 overflow-hidden md:col-span-1 md:min-h-72">
            <img
              src={album.cover}
              alt={album.title}
              className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#171812] via-transparent to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-6 md:p-8">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-300">
                Photo Journal · {formatContentDate(album.date)}
              </p>
              <h2 className="mt-2 text-2xl font-black text-white md:text-3xl">
                {album.title}
              </h2>
              <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-200/80">
                {album.description}
              </p>
            </div>
          </div>

          <div className="col-span-2 grid grid-cols-2 gap-2 p-2 md:col-span-1">
            {preview.map((photo, index) => (
              <div
                key={`${photo.url}-${index}`}
                className="relative min-h-28 overflow-hidden rounded-2xl bg-[#24251f] md:min-h-32"
              >
                <img
                  src={photo.url}
                  alt={photo.caption || "照片墙预览"}
                  className="h-full w-full object-cover opacity-85 transition duration-700 group-hover:scale-105 group-hover:opacity-100"
                />
              </div>
            ))}
          </div>
        </div>
      </Link>
    </section>
  );
}
