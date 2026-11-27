import { siteConfig } from '../siteConfig';

export default function SplashScreen() {
  return (
    <div className="splash-screen" aria-hidden="true">
      <div className="relative z-10 flex flex-col items-center">
        <div className="relative mb-8 h-32 w-32">
          <div className="splash-ring absolute -inset-1.5 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-60 blur-[3px]" />
          <div className="relative h-full w-full rounded-full bg-white/95 p-1.5 shadow-xl dark:bg-slate-900">
            <img
              src={siteConfig.splashImageUrl}
              alt=""
              fetchPriority="high"
              className="h-full w-full rounded-full object-contain [image-rendering:pixelated]"
            />
          </div>
        </div>

        <h1 className="mb-2 text-2xl font-black uppercase tracking-[0.2em] text-slate-800 dark:text-white">
          少女祈祷中
          <span className="splash-dots" aria-hidden="true">
            <span className="splash-dot">.</span>
            <span className="splash-dot">.</span>
            <span className="splash-dot">.</span>
          </span>
        </h1>
        <p className="mb-12 text-[10px] font-black tracking-[0.5em] text-slate-400">
          GATHERING LEAVES
        </p>

        <div className="relative h-[1.5px] w-40 bg-slate-200 dark:bg-slate-800">
          <div className="splash-progress absolute inset-y-0 left-0 h-full bg-indigo-500 shadow-[0_0_12px_rgba(180,147,79,0.8)]" />
        </div>
      </div>
    </div>
  );
}
