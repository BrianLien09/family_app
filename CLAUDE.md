# CLAUDE.md

本檔是這個專案唯一的規則來源；`AGENTS.md` 只導向此檔，不要在那裡另外撰寫規則。

## 專案概覽

Famly Hub：Next.js 16（App Router）+ React 19 + TypeScript strict 的家庭工具，提供總覽／行事曆、食譜、家庭帳本與購買紀錄。Tailwind CSS 3（Woven & Weft 大地色系）、`motion` 動畫、Firebase（Firestore + Auth）、靜態匯出部署到 GitHub Pages。

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

- 測試使用 Node.js 內建 `node:test`、`assert` 與 TypeScript transpile，不連線正式 Firebase；`package.json` 沒有 `test` script。
- 開發伺服器使用預設 Turbopack，不要加入 `--webpack`；正式建置仍使用 Webpack。GitHub Pages 本機預覽路徑為 `http://localhost:3000/family_app`。
- 提交前依序確認：`npx tsc --noEmit`、`npm run lint`、`node --test tests/*.test.mjs`、`npm run build`。受限 Windows 環境若出現測試子程序 `spawn EPERM`，改用 `node --test --experimental-test-isolation=none tests/*.test.mjs`；型別檢查可加 `--incremental false` 避開快取檔寫入限制。

## 架構與資料流程

- `src/app/` 是路由頁面；`layout.tsx` 掛載 `MotionProvider`、Navbar、Toast 與 PWA 更新提示。頁面組合 `src/components/` 的功能 UI，透過 `src/hooks/` 存取資料，Firebase 初始化與轉換工具在 `src/lib/`，共用型別集中於 `src/types/index.ts`。路徑別名用 `@/`。
- 修改資料行為時，先追蹤頁面使用的 Hook 到 Firestore 實作，避免只改 UI 而漏掉同步或快取邏輯。
- `useSharedCollection` 是資料 Hook 的即時同步與快取層：登入後監聽頂層家庭共用 Firestore 集合，以 UID 區分 LocalStorage 快取；帳號切換會清除記憶體資料並隔離舊監聽結果。各功能 Hook 負責集合操作與領域邏輯；行程、食譜、帳本刪除包含樂觀更新與復原 toast。
- Firebase Auth 的用戶端檢查不是資料安全邊界，實際存取權由 Firestore Rules 控制；Rules 未納入此 repository，新增或變更集合時需確認已部署的 Rules 允許家庭帳號存取。
- `next.config.ts` 使用 `output: "export"` 與 `basePath: "/family_app"`，沒有 Next.js server runtime。`NEXT_PUBLIC_FIREBASE_*` 設定放在本機 `.env.local` 或 GitHub Actions；完整變數清單見 `README.md`。
- PWA 由 `@ducanh2912/next-pwa` 建置，開發模式停用；驗證 Service Worker 請執行 production build。`public/sw.js` 與 `public/workbox-*.js` 為產生檔，不要手動修改。
- 每日行程 LINE 提醒是獨立於前端的 Python 工作：`.github/workflows/schedule_job.yml` 在台灣時間每日 17:50 執行 `daily_notify.py`。
- `Immersive Mode`（`useImmersiveMode`）：Modal 開啟時鎖定 body 捲動並隱藏 Navbar，卸載時還原。

## 程式碼規範

- 型別：元件 props 與物件用 `interface`，聯集與函式簽章用 `type`；共用型別放 `src/types/index.ts`。禁止 `any`、`@ts-ignore`、`eslint-disable`。
- 命名：元件檔 PascalCase、hook／工具檔 camelCase；布林用 `is*`／`has*`／`should*`；事件處理 `handle*`／`on*`；常數 UPPER_SNAKE_CASE。
- 元件順序：hooks → 衍生值（useMemo／useCallback）→ handler → 載入狀態早退 → JSX。需要 hook 的檔案必須加 `'use client'`。
- 不引入全域狀態庫；UI 狀態用 local state，資料用 custom hooks。
- 非同步操作一律 try-catch，失敗時 `toast.error` 並回復樂觀更新，不使用 `alert()`。
- 程式碼註解使用繁體中文台灣用語，說明「為什麼」而非「做了什麼」；刪除未使用的程式碼，不註解保留。
- 行內樣式（inline style）不使用 `background` 等縮寫屬性，拆成 `backgroundColor`、`backgroundImage`；在多個主要狀態（loading／內容／錯誤）間切換的外層容器要加唯一 `key`。

## UI 規範

**設計系統（Woven & Weft 大地色系）**
- 背景 `#e6e2d8`、卡片 `#f0ece1`、邊框 `#dcd0c2`（常用 dashed）、文字 `#3d3a36`、次要文字 `#5f6368`。
- 主色鐵鏽 `#b87e6b`、輔色石板藍 `#5f7186`、警示 `#9b4436`。圖表與成員色維持大地色調，不使用霓虹色。
- `.glass-card` 不使用 `backdrop-blur`（長清單會拖慢捲動）；陰影用輕量、靜態的值。
- Mobile-first（`md:`、`lg:`），觸控目標至少 44px；容器與彈窗保留足夠內邊距，`input` 不使用緊貼的窄框。

**共用元件（`src/components/ui/`）**：`Button`、`IconButton`（必填 `aria-label`）、`Chip`、`SearchInput`、`SelectCheckbox`、`BatchToolbar`、`EmptyState`、`PageShell`／`PageHeader`、`LoadingGate`。新增畫面先找可覆用的元件，不要每頁手刻按鈕、篩選膠囊或空狀態。載入畫面優先使用 `CapybaraLoader`（經 `LoadingGate`）。

**樣式寫法**：Tailwind 優先，用 `clsx` 組合條件 class；只過渡需要的屬性（`transition-colors` 等），不使用 `transition-all`；不新增元件專屬 CSS 檔（`CapybaraLoader.module.css` 為既有例外）。

**動畫（`motion`）**
- 時長、easing 與 variants 集中在 `src/lib/motion.ts`（`EASE_OUT`、`DURATION`、`fadeUp`、`popIn`、`collapse`、`listItem`），元件內不自訂。
- 使用 `m.*`（LazyMotion strict）；`MotionProvider` 以 `reducedMotion="user"` 處理減少動態效果，`globals.css` 另有 CSS 動畫的全域兜底。
- 需要離場動畫的元件，由呼叫端用 `AnimatePresence` 包住條件渲染；`Modal` 只負責自身進出場，離場期間會忽略鍵盤與點擊。
- 路由切換只做進場（`src/app/template.tsx`），App Router 無法穩定做離場；載入 → 內容使用 `LoadingGate`。
- 列表進出場使用 `AnimatePresence initial={false}`，避免首次載入整排播放。

**無障礙**：純圖示按鈕要有 `aria-label`；切換按鈕用 `aria-pressed`；批次選取的卡片用 `role="checkbox"` 與 `aria-checked`；Modal 要有 `role="dialog"`、`aria-modal`、ESC 關閉與焦點管理；頁面要有一個 `<h1>`（可視覺隱藏），整站只有 layout 的一個 `<main>`。

## 彈窗與表單注意事項

- 所有模態視窗使用 `src/components/Modal.tsx`，沿用 `useModalViewport` 與 `useImmersiveMode`；手機先聚焦容器，避免開啟即叫出鍵盤。
- 彈窗操作列必須放在同一個 `<form>` 內並使用 `type="submit"`，否則會繞過原生必填驗證。
- 主表單內的自訂分類／子分類有各自的儲存範圍：子分類名稱按 Enter 必須阻止外層表單送出，中文輸入法組字中（`isComposing`）不得誤觸發。
- 食材反推不可把份數四捨五入後儲存（1 份／1000g 反推 1g 應保留 0.001 份）；儲存前檢查正數與有限值，無效輸入時不得保留舊結果或允許另存、匯出。
- 收入分類選單的值直接提交，不被固定字串覆蓋；舊紀錄的既有分類編輯時仍要能顯示。
- `Add*Modal`、`PurchaseModal` 的測試（`tests/modalForms.test.mjs`、`tests/addDateModal.test.mjs`）以固定模組清單模擬依賴，這些檔案不要新增未列在測試模擬清單中的 import，否則會出現 `Unexpected import`。

## 開發環境注意事項

- 遇到 `Failed to write app endpoint` 先讀 panic log 的 `Caused by`，不要僅憑回報連結中的版本字串就重裝套件。`next.config.ts` 以 `turbopack.root: __dirname` 固定模組解析邊界。
- 設定修改後若反覆重載，先停止此專案的開發程序、清除 `.next/dev` 快取再重啟；不要同時啟動兩個程序共用快取，也不要停止其他專案的 Node 程序。

## CI 與版本流程

- `.github/workflows/deploy.yml` 在 `main` 推送後建置 `out/` 並部署 GitHub Pages（Node.js 20，Firebase 公開設定由 GitHub Secrets 注入）。
- `.github/workflows/release-please.yml` 依 `main` 的 Conventional Commit 建立版本更新 PR；`feat`、`fix` 與 `BREAKING CHANGE` 會影響版本號。

## Git Commit

- 使用 Conventional Commits：`type(scope): 簡短中文描述`，類型為 `feat`、`fix`、`docs`、`refactor`、`style`、`test`、`chore`，內文用條列說明重點。
- 不要在 commit 訊息加入 Claude 的 `Co-Authored-By` 署名（GitHub 會顯示為參與人）。
