# 🏠 我們家的小助手 (Family Utility Site)

這是一個結合 **「智慧行事曆」** 與 **「食譜計算神器」** 的全端 Web App，專為家庭生活設計。
透過現代化的網頁技術與玻璃擬態 (Glassmorphism) 設計風格，讓記錄生活與下廚變得更優雅、更直覺。

## ✨ 核心功能

### 📅 智慧行事曆 (Schedule Manager)
不再忘記重要行程，全家人資訊同步！

- **雲端即時同步**：整合 **Google Firebase** 資料庫，手機新增行程，電腦馬上看得到。
- **倒數計時器**：自動計算距離目標日期還有幾天，緊急事件（3天內）會有呼吸燈特效提醒。
- **🆕 自訂類別**：除了內建標籤外，支援新增與刪除自訂類別，滿足個人化需求。
- **🆕 彈性時段**：支援設定行程結束時間（如 14:00 - 16:00），時間安排更精確。
- **直覺分類**：內建「阿弟排班」、「剪頭髮」、「洗牙」等常用標籤，支援篩選功能。
- **歷史歸檔**：過期的行程會自動變暗並移至列表底部，保持介面清爽。
- **🆕 智慧搜尋**：關鍵字搜尋 + 多選分類 + 日期區間篩選，快速找到目標行程。
- **🆕 復原刪除**：誤刪行程？5 秒內可以一鍵復原，不用擔心手滑！
- **🆕 批次操作**：支援多選批次刪除行程，提升管理效率。
- **🆕 快速預覽**：「即將到來」與「回顧過往」按鈕可快速預覽行程，多個行程時可透過下拉選單切換查看。
- **🆕 智慧分頁**：月曆每頁顯示 5 個事件，保持介面清爽易讀。

### 🍳 食譜比例轉換神器 (Kitchen AI)
解決「食譜寫 4 人份，但我只想煮 1 人份」的數學難題。

- **雙模式換算**：
  1. **依份量**：直接拉動滑桿，將 4 人份食譜一鍵轉為 2.5 人份。
  2. **依食材**：冰箱只剩 100g 麵粉？輸入現有重量，系統自動反推所有食材比例。
- **沈浸式體驗 (Immersive Mode)**：打開食譜時，導航列自動隱藏，鎖定背景滾動，給你全螢幕的專注體驗。
- **響應式混合佈局 (Hybrid Layout)**：
  - **電腦版**：全螢幕儀表板，左側控制面板固定，右側清單滾動。
  - **手機版**：置中卡片式設計，單手也能輕鬆操作。
- **🆕 復原刪除**：誤刪食譜也能輕鬆還原！
- **🆕 批次操作**：支援多選批次刪除食譜，管理更輕鬆。
- **🆕 PDF 匯出**：可將食譜匯出為 PDF 格式，方便列印或分享。
- **🆕 智慧分頁**：每頁顯示 12 個食譜，快速瀏覽不卡頓。

### 📱 PWA 漸進式網頁應用 (Progressive Web App)
讓網頁 App 像原生應用一樣好用！

- **安裝到主畫面**：可以將應用安裝到手機或桌面主畫面，一鍵開啟，體驗更接近原生 App。
- **離線瀏覽**：支援離線訪問已載入的資料，透過 LocalStorage 快取機制，即使沒有網路也能查看行程與食譜。
- **自動快取靜態資源**：Service Worker 自動快取 CSS、JavaScript、圖片等靜態檔案，加速後續訪問。
- **智慧更新提示**：當應用有新版本時，會自動顯示更新提示，點擊即可重新載入最新版本。
- **全平台支援**：支援 iOS、Android、Windows、macOS 等所有主流平台。

## 🛠️ 技術棧 (Tech Stack)

本專案採用 **Vibe Coding** 模式開發，強調快速迭代與極致的 UI/UX 體驗。

- **Frontend Framework**: [Next.js 16 (App Router)](https://nextjs.org/)
- **Language**: TypeScript
- **Styling**: Tailwind CSS (Glassmorphism 視覺風格)
- **Backend / Database**: Google Firebase (Firestore)
- **Authentication**: Firebase Auth (Google 登入)
- **PWA**: [@ducanh2912/next-pwa](https://github.com/DuCanhGH/next-pwa) (Service Worker 自動生成)
- **Deployment**: GitHub Pages
- **Notifications**: LINE Bot API (定時推送)

## 💡 技術亮點

1. **Smart Navbar (智慧導航列)**
   - 瀏覽時自動偵測滑動方向：往下滑動隱藏，往上滑動顯示。
   - 封裝 `useImmersiveMode` Hook，在開啟 Modal 時強制接管導航列狀態。

2. **解決響應式痛點**
   - 針對手機版 (Mobile) 與電腦版 (Desktop) 實作不同的 Layout 策略。
   - 解決 iOS Safari 上常見的 `100vh` 與 Z-index 遮擋問題。

3. **資料庫 CRUD**
   - 完整的增刪查改功能，並實作資料庫即時監聽。
   - LocalStorage 快取機制，實現秒速載入體驗。

4. **🆕 進階搜尋與篩選**
   - 關鍵字搜尋支援標題與描述欄位
   - 多選分類篩選（可同時選擇多個標籤）
   - 日期區間篩選（查看特定期間的行程）
   - 即時顯示篩選結果數量

5. **🆕 樂觀更新 (Optimistic UI)**
   - 刪除操作立即反映在 UI，提供流暢體驗
   - Toast 通知附帶復原按鈕，5 秒內可撤銷操作
   - 錯誤時自動回復狀態，確保資料一致性

6. **🆕 無障礙設計 (Accessibility)**
   - 完整的 ARIA 標籤支援
   - 鍵盤快捷鍵（ESC 關閉 Modal、Tab 導航）
   - 增強的焦點指示器（紫色外框）
   - 螢幕閱讀器友善

7. **🆕 批次操作系統**
   - 支援多選行程或食譜進行批次刪除
   - 視覺化選取狀態（勾選框與高亮效果）
   - 全選/取消全選快速操作
   - 批次模式下顯示已選取數量

8. **🆕 智慧分頁**
   - 行程月曆：每頁 5 個事件，避免滾動過長
   - 食譜列表：每頁 12 個食譜，網格佈局最佳化
   - 上一頁/下一頁導航，顯示當前頁碼

9. **🆕 預覽卡片下拉選單**
   - 「即將到來」按鈕：快速預覽最近的未來行程
   - 「回顧過往」按鈕：回顧最近完成的行程
   - 多個行程時提供下拉選單切換查看
   - 顯示行程計數器（第 X 個，共 Y 個）
   - 一鍵跳轉到月曆詳細檢視

10. **🆕 PWA 漸進式網頁應用**
    - Service Worker 自動快取靜態資源，加速載入
    - 支援離線訪問與安裝到主畫面
    - 智慧更新偵測與提示機制
    - 全平台相容（iOS、Android、Desktop）

## 🚀 快速開始 (Local Development)

如果你想在本地端運行此專案：

1. **安裝依賴**
   ```bash
   npm install
   ```

2. **設定環境變數**
請在根目錄建立 `.env.local` 檔案，並填入你的 Firebase Config：
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
...
```


3. **啟動開發伺服器**
```bash
npm run dev
```


打開瀏覽器輸入 `http://localhost:3000` 即可預覽。

**注意**: 開發模式下 PWA 功能會自動停用，僅在 Production 建置時啟用。

## 🌐 部署 (Deployment)

本專案已設定好 GitHub Pages 自動部署流程。

1. **編譯與輸出**
   ```bash
   npm run build
   ```
   
   此指令會使用 `--webpack` 旗標進行建置，並自動生成 Service Worker 檔案（位於 `public/sw.js`）。
   
   **重要**: PWA 套件需要使用 Webpack 建置器，不支援 Turbopack。

2. **部署至 GitHub Pages**
   ```bash
   npm run deploy
   ```

*(需確保 `next.config.ts` 中的 `basePath` 與 `gh-pages` 套件已設定正確)*

## 📂 PWA 相關檔案說明

本專案整合了 PWA 功能，以下是相關檔案的說明：

| 檔案路徑 | 功能說明 |
|---------|---------|
| `public/manifest.json` | PWA 應用配置檔（名稱、圖示、主題色等） |
| `public/icon-192.png` | PWA 圖示（192x192，用於主畫面） |
| `public/icon-512.png` | PWA 圖示（512x512，用於啟動畫面） |
| `public/sw.js` | Service Worker 檔案（自動生成，已加入 `.gitignore`） |
| `src/hooks/useServiceWorker.ts` | Service Worker 更新偵測 Hook |
| `src/components/UpdatePrompt.tsx` | 更新提示 UI 元件 |
| `src/components/PWAUpdateProvider.tsx` | PWA 更新功能整合元件 |
| `next.config.ts` | Next.js 配置（整合 PWA 插件） |

**自動生成檔案**: `public/sw.js`、`public/workbox-*.js` 等 Service Worker 相關檔案會在建置時自動產生，無需手動編輯。

---

## 🎯 最新更新

### v3.2 (2026/01) - PWA 漸進式網頁應用

#### ✅ 新增功能
- **PWA 支援**：應用現在可以安裝到手機或桌面主畫面，體驗更接近原生 App。
- **離線瀏覽**：支援離線訪問已載入的資料，透過 Service Worker 快取靜態資源。
- **自動更新提示**：當有新版本時，會自動顯示更新提示，讓使用者隨時保持最新狀態。
- **跨平台安裝**：支援 iOS、Android、Windows、macOS 等所有主流平台。

#### 🔧 技術改進
- **整合 @ducanh2912/next-pwa**：自動生成 Service Worker 並管理快取策略。
- **useServiceWorker Hook**：封裝 Service Worker 註冊與更新偵測邏輯。
- **PWAUpdateProvider**：提供全域更新提示功能，無需在每個頁面重複實作。
- **Webpack 建置**：使用 `--webpack` 旗標確保 PWA 功能正常運作。
- **Manifest 配置**：定義應用名稱、圖示、主題色等 PWA 元資料。

#### 📊 使用範例
```bash
# 安裝到主畫面（以 Chrome 為例）
1. 開啟應用網址
2. 點擊瀏覽器的「安裝」按鈕
3. 應用會出現在主畫面，點擊即可開啟

# 體驗離線功能
1. 正常訪問應用並載入資料
2. 關閉網路連線
3. 重新開啟應用，仍可查看已快取的資料

# 更新應用
1. 當有新版本時，會自動顯示更新提示
2. 點擊「立即更新」按鈕
3. 頁面重新載入，套用最新版本
```

### v3.1 (2026/01) - 自訂類別與時間優化

#### ✅ 新增功能
- **自訂類別 (Custom Categories)**：使用者可自由新增/刪除行程類別，不再受限於預設選項。
- **時間區段 (Time Range)**：行程時間欄位升級，支援「開始時間」與「結束時間」（選填）。

#### 🔧 技術改進
- **資料結構升級**：拆分 `time` 欄位為 `startTime` 與 `endTime`。
- **向下相容 (Backward Compatibility)**：`useDates` Hook 自動轉換舊版資料格式，確保無縫升級。
- **通知機器人同步**：Python 通知腳本 (`daily_notify.py`) 支援新的時間區段顯示格式。

### v3.0 (2026/01) - 批次操作與預覽增強

#### ✅ 新增功能
- **批次操作系統**: 支援多選批次刪除行程與食譜，提升管理效率
- **智慧分頁**: 行程 5 個/頁，食譜 12 個/頁，改善閱讀體驗
- **預覽卡片下拉選單**: 即將到來/回顧過往按鈕可快速預覽行程，多個行程時可切換查看
- **PDF 匯出功能**: 食譜可匯出為 PDF 格式，方便列印與分享

#### 🔧 技術改進
- 新增 `deleteDates()` 和 `deleteRecipes()` 批次刪除方法
- 整合 jspdf 和 html2canvas 實現 PDF 匯出
- 優化預覽卡片 UI，支援下拉選單與視覺化計數器
- 批次模式視覺反饋（勾選框、高亮效果、動畫）

#### 📊 使用範例
```typescript
// 批次刪除多個行程
1. 點擊「批次操作」按鈕
2. 勾選要刪除的行程
3. 點擊「刪除 (N)」按鈕

// 快速預覽即將到來的行程
點擊「即將到來」按鈕 → 顯示預覽卡片 → 使用下拉選單切換查看

// 匯出食譜為 PDF
開啟食譜計算器 → 調整份量 → 點擊「匯出 PDF」按鈕
```

---

## 📝 更新歷史

### v3.2 (2026/01) - PWA 漸進式網頁應用
- 整合 PWA 功能、支援離線瀏覽、安裝到主畫面、自動更新提示

### v3.1 (2026/01) - 自訂類別與時間優化
- 新增自訂類別系統、支援行程結束時間、資料向下相容

### v3.0 (2026/01) - 批次操作與預覽增強
- 新增批次操作、分頁、PDF 匯出、預覽卡片下拉選單

### v2.0 (2026/01) - 搜尋與無障礙
- 智慧搜尋系統、復原刪除、無障礙改善

### v1.0 (2025/12) - 核心功能
- 智慧行事曆、食譜計算器、Firebase 整合

---

### 👨‍💻 Author

Created by **Brian** | 2026
*Built with passion, coffee, and AI.*
