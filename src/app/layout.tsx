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
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "家庭助手",
  },
};

export const viewport: Viewport = {
  themeColor: "#a855f7",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW">
      <head>
        <link rel="icon" type="image/png" href="/icon-192x192.png" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
      </head>
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
