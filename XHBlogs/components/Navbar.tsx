"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { siteConfig } from "../siteConfig";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const navLinks = siteConfig.navigation;

  const isActive = (href: string) =>
    pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 hidden border-b border-white/10 bg-[#171812]/65 shadow-lg backdrop-blur-2xl md:block">
        <div className="mx-auto flex h-16 w-[90%] max-w-6xl items-center justify-between px-4">
          <Link
            href="/"
            className="font-serif text-xl font-black tracking-tight text-white transition hover:text-indigo-300"
          >
            {siteConfig.navTitle}
            <span className="mx-1 text-indigo-400">{siteConfig.navSuffix}</span>
            {siteConfig.navAfter}
          </Link>

          <nav aria-label="主导航" className="flex items-center gap-7 text-sm font-bold">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                aria-current={isActive(link.href) ? "page" : undefined}
                className={`relative py-1 transition ${
                  isActive(link.href)
                    ? "text-indigo-300"
                    : "text-slate-200 hover:text-indigo-300"
                }`}
              >
                {link.name}
                {isActive(link.href) && (
                  <span className="absolute -bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-indigo-400" />
                )}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <div className="md:hidden">
        <button
          type="button"
          aria-expanded={isOpen}
          aria-controls="mobile-navigation"
          aria-label="打开导航"
          onClick={() => setIsOpen(true)}
          className="fixed right-0 top-1/2 z-[60] flex h-24 w-11 -translate-y-1/2 items-center justify-center rounded-l-full border-y border-l border-white/20 bg-indigo-500/85 text-white shadow-xl backdrop-blur-xl"
        >
          <span className="flex flex-col gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-white" />
            <span className="h-1.5 w-1.5 rounded-full bg-white" />
            <span className="h-1.5 w-1.5 rounded-full bg-white" />
          </span>
        </button>

        <AnimatePresence>
          {isOpen && (
            <>
              <motion.button
                type="button"
                aria-label="关闭导航"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsOpen(false)}
                className="fixed inset-0 z-[65] bg-[#10110d]/75 backdrop-blur-md"
              />

              <motion.div
                id="mobile-navigation"
                role="dialog"
                aria-modal="true"
                aria-label="站点导航"
                initial={{ opacity: 0, scale: 0.82, rotate: -8 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                exit={{ opacity: 0, scale: 0.82, rotate: 8 }}
                transition={{ type: "spring", damping: 22, stiffness: 170 }}
                className="fixed left-1/2 top-1/2 z-[70] h-[320px] w-[320px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/20 bg-[#20211b]/75 shadow-2xl backdrop-blur-3xl"
              >
                <button
                  type="button"
                  aria-label="关闭导航"
                  onClick={() => setIsOpen(false)}
                  className="absolute left-1/2 top-1/2 z-20 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-indigo-500 text-xl font-black text-white shadow-lg transition hover:rotate-90 hover:bg-[#8d6f38]"
                >
                  ✕
                </button>

                {navLinks.map((link, index) => {
                  const angle = (index * 360) / navLinks.length - 90;
                  const radians = (angle * Math.PI) / 180;
                  const x = 50 + Math.cos(radians) * 35;
                  const y = 50 + Math.sin(radians) * 35;

                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setIsOpen(false)}
                      aria-current={isActive(link.href) ? "page" : undefined}
                      className={`absolute flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border text-[11px] font-black shadow-lg transition hover:scale-110 ${
                        isActive(link.href)
                          ? "border-indigo-300/50 bg-indigo-500 text-white"
                          : "border-white/15 bg-[#303128]/85 text-slate-100 hover:bg-[#3b3c31]"
                      }`}
                      style={{ left: `${x}%`, top: `${y}%` }}
                    >
                      {link.name}
                    </Link>
                  );
                })}
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
