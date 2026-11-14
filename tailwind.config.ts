import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      // 與 src/lib/motion.ts 的 EASE_OUT 相同，讓 CSS 過渡與 motion 動畫手感一致
      transitionTimingFunction: {
        "out-expo": "cubic-bezier(0.16, 1, 0.3, 1)",
      },
      // 與 src/lib/motion.ts 的 DURATION 刻度一致，避免 CSS 過渡另外長出 200ms／300ms 等第二套節奏
      transitionDuration: {
        fast: "150ms",
        base: "250ms",
        slow: "400ms",
      },
    },
  },
  plugins: [],
};
export default config;
