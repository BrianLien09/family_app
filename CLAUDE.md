# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 常用指令

```bash
npm install              # 安裝相依套件
npm run dev              # 啟動開發伺服器
npm run lint             # 執行 ESLint
npx tsc --noEmit         # 執行 TypeScript 型別檢查
npm run build            # 建置 Next.js 靜態匯出至 out/
npm run deploy           # 建置並發佈 out/ 至 gh-pages
node --test tests/*.test.mjs
node --test tests/sync.test.mjs
node --test --test-name-pattern="即時更新" tests/sync.test.mjs
```

`AGENTS.md` 中「目前沒有測試框架」的註記已過時：`tests/*.test.mjs` 使用 Node.js 內建 `node:test`、`assert` 與 TypeScript transpile，測試不連線正式 Firebase；但 `package.json` 沒有 `test` script。最後兩個指令分別執行單一測試檔及依名稱篩選單一測試。

開發伺服器使用預設 Turbopack 模式，不要加入 `--webpack`；正式建置仍使用 Webpack。GitHub Pages 的本機預覽路徑為 `http://localhost:3000/family_app`。

## 架構與資料流程

- 這是 Next.js App Router 的家庭工具，提供總覽／行事曆、食譜、家庭帳本與購買紀錄。`src/app/` 負責路由頁面；`src/app/layout.tsx` 掛載全站 Navbar、Toast 與 PWA 更新提示。
- 頁面元件組合 `src/components/` 的功能 UI，並透過 `src/hooks/` 存取資料與執行功能邏輯；Firebase 初始化與共用轉換工具放在 `src/lib/`，共用資料型別集中於 `src/types/index.ts`。修改資料行為時，先追蹤頁面使用的 Hook 到 Firestore 實作，避免只改 UI 而漏掉同步或快取邏輯。
- `useSharedCollection` 是資料 Hook 共用的即時同步與快取層：登入後監聽頂層家庭共用 Firestore 集合，並以 UID 區分 LocalStorage 快取；帳號切換會清除記憶體資料並隔離舊監聽結果。各功能 Hook 負責集合操作與領域邏輯；行程、食譜及帳本刪除流程包含樂觀更新與復原。Firebase Auth 的用戶端檢查不是資料安全邊界，實際存取權由 Firestore Rules 控制；Rules 未納入此 repository，新增或變更集合時需確認已部署的 Rules 允許家庭帳號存取。
- `next.config.ts` 使用 `output: "export"` 與 `basePath: "/family_app"`，部署目標是 GitHub Pages，沒有 Next.js server runtime。Firebase 的 `NEXT_PUBLIC_FIREBASE_*` 設定需在本機 `.env.local` 或 GitHub Actions build 環境提供；完整變數清單見 `README.md`。
- PWA 由 `@ducanh2912/next-pwa` 建置，開發模式會停用；要驗證 Service Worker 行為請執行 production build。`public/sw.js` 與 `public/workbox-*.js` 是產生檔，不要手動修改。
- 每日行程 LINE 提醒是獨立於 Next.js 前端的 Python 工作：`.github/workflows/schedule_job.yml` 在台灣時間每日 17:50 執行 `daily_notify.py`，從 Firestore 讀取行程並推播。

## CI 與版本流程

- `.github/workflows/deploy.yml` 在 `main` 推送後建置 `out/` 並部署 GitHub Pages；建置使用 Node.js 20，Firebase 公開設定由 GitHub Secrets 注入。
- `.github/workflows/release-please.yml` 依 `main` 的 Conventional Commit 建立版本更新 PR；`feat`、`fix` 與 `BREAKING CHANGE` 會影響版本號。
- Repository root 的 `AGENTS.md` 補充程式碼風格與 UI 慣例；本檔聚焦於指令、架構及部署流程，避免重複列出相同規範。
