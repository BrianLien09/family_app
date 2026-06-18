import type { Metadata, Viewport } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import ToasterContext from '@/components/ToasterContext';
import PWAUpdateProvider from '@/components/PWAUpdateProvider';

const outfit = Outfit({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "我們家的小助手",
  description: "紀錄重要日期與食譜轉換",
  manifest: "/family_app/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "家庭助手",
  },
};

export const viewport: Viewport = {
  // 改為大地色系暖米背景，與 Woven & Weft UI 設計語言一致
  themeColor: "#e6e2d8",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW">

      <body className={`${outfit.className} pb-24 antialiased selection:bg-orange-200 selection:text-orange-900`}>
        <main className="min-h-screen relative z-10">
          {children}
        </main>
        <Navbar />
        <ToasterContext />
        <PWAUpdateProvider />
      </body>
    </html>
  );
}
