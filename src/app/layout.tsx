import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MiniLED Tester — Backlight & HDR Test Tool",
  description: "Free online MiniLED display backlight testing tool. Test local dimming zones, HDR brightness up to 10000 nits with real PQ-encoded AVIF, blooming/halo detection, and starfield black-level analysis.",
  keywords: [
    "MiniLED", "MiniLED tester", "MiniLED test", "backlight test",
    "local dimming", "local dimming zone", "HDR test", "HDR brightness test",
    "blooming test", "halo test", "display test", "monitor test",
    "DisplayHDR", "DisplayHDR 1000", "DisplayHDR 1400",
    "nits", "PQ AVIF", "black level test", "starfield test",
    "MiniLED显示器测试", "背光分区测试", "控光测试", "光晕测试",
    "HDR亮度测试", "灯珠分区", "星空黑场",
  ],
  authors: [{ name: "ZackMount", url: "https://github.com/ZackMount" }],
  openGraph: {
    title: "MiniLED Tester — Backlight & HDR Test Tool",
    description: "Free online tool to test MiniLED local dimming, HDR brightness (0-10000 nits), blooming detection, and starfield black-level.",
    type: "website",
    url: "https://github.com/ZackMount/miniled-tester",
    siteName: "MiniLED Tester",
  },
  twitter: {
    card: "summary",
    title: "MiniLED Tester — Backlight & HDR Test Tool",
    description: "Test MiniLED local dimming zones, HDR brightness, blooming, and starfield black-level — all in your browser.",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-black text-white overflow-hidden select-none m-0 p-0 w-screen h-screen" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>
        {children}
      </body>
    </html>
  );
}
