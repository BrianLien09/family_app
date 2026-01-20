import type { NextConfig } from "next";
import withPWA from "@ducanh2912/next-pwa";

const nextConfig: NextConfig = {
  output: "export",
  images: {
    unoptimized: true,
  },
  // 添加空的 turbopack 配置以抑制警告
  // 實際建置時會使用 --webpack 旗標
  turbopack: {},
  // If deploying to a subpath (e.g. username.github.io/repo-name),
  // uncomment and set the repo name here:
  // basePath: '/family-site',
};

export default withPWA({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
})(nextConfig);
