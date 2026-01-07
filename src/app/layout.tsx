import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";

const outfit = Outfit({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "我們家的小助手",
  description: "紀錄重要日期與食譜轉換",
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
      </body>
    </html>
  );
}
