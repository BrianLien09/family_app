import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  images: {
    unoptimized: true,
  },
  // If deploying to a subpath (e.g. username.github.io/repo-name),
  // uncomment and set the repo name here:
  // basePath: '/family-site',
};

export default nextConfig;
