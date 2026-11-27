import "katex/dist/katex.min.css";
import type { Metadata } from "next";
import "./globals.css";

import MobileBackButton from "../components/MobileBackButton";
import ResponsiveBackground from "../components/ResponsiveBackground";
import SplashScreen from "../components/SplashScreen";
import { ThemeProvider } from "../components/ThemeProvider";
import { siteConfig } from "../siteConfig";

export const metadata: Metadata = {
  title: siteConfig.title,
  description: siteConfig.bio,
  icons: {
    icon: siteConfig.faviconUrl,
    apple: siteConfig.faviconUrl,
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="zh-CN"
      className="dark h-full antialiased"
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <body className="relative min-h-screen overflow-x-hidden bg-[#1b1c18] font-serif text-slate-100">
        <ThemeProvider>
          <ResponsiveBackground />
          <SplashScreen />
          <div
            id="app-mount-root"
            className="relative z-10 flex min-h-screen flex-col"
          >
            {children}
          </div>
          <div className="md:hidden">
            <MobileBackButton />
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
