import type { NextConfig } from "next";
import withPWA from "@ducanh2912/next-pwa";

const nextConfig: NextConfig = {
  output: "export",
  images: {
    unoptimized: true,
  },
  // 固定模組解析邊界，避免開發程序將其他目錄誤認為工作區根目錄。
  turbopack: {
    root: __dirname,
  },
  // 部署到 GitHub Pages 子路徑時需要設定 basePath
  basePath: '/family_app',
};

export default withPWA({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
})(nextConfig);
