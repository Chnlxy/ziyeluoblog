import "katex/dist/katex.min.css";
import type { Metadata } from "next";
import { Geist, Geist_Mono, Noto_Serif_SC } from "next/font/google";
import "./globals.css";

import MobileBackButton from "../components/MobileBackButton";
import ResponsiveBackground from "../components/ResponsiveBackground";
import SplashScreen from "../components/SplashScreen";
import { ThemeProvider } from "../components/ThemeProvider";
import { siteConfig } from "../siteConfig";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});
const notoSerif = Noto_Serif_SC({
  subsets: ["latin"],
  weight: ["400", "700", "900"],
  variable: "--font-serif",
  display: "swap",
});

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
      className={`${geistSans.variable} ${geistMono.variable} ${notoSerif.variable} dark h-full antialiased`}
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
