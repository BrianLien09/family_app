# 🏠 我們家的小助手 (Family Utility Site)

這是一個結合 **「智慧行事曆」** 與 **「食譜計算神器」** 的全端 Web App，專為家庭生活設計。
透過現代化的網頁技術與玻璃擬態 (Glassmorphism) 設計風格，讓記錄生活與下廚變得更優雅、更直覺。

## ✨ 核心功能

### 📅 智慧行事曆 (Schedule Manager)
不再忘記重要行程，全家人資訊同步！

- **雲端即時同步**：整合 **Google Firebase** 資料庫，手機新增行程，電腦馬上看得到。
- **倒數計時器**：自動計算距離目標日期還有幾天，緊急事件（3天內）會有呼吸燈特效提醒。
- **直覺分類**：內建「阿弟排班」、「剪頭髮」、「洗牙」等常用標籤，支援篩選功能。
- **歷史歸檔**：過期的行程會自動變暗並移至列表底部，保持介面清爽。

### 🍳 食譜比例轉換神器 (Kitchen AI)
解決「食譜寫 4 人份，但我只想煮 1 人份」的數學難題。

- **雙模式換算**：
  1. **依份量**：直接拉動滑桿，將 4 人份食譜一鍵轉為 2.5 人份。
  2. **依食材**：冰箱只剩 100g 麵粉？輸入現有重量，系統自動反推所有食材比例。
- **沈浸式體驗 (Immersive Mode)**：打開食譜時，導航列自動隱藏，鎖定背景滾動，給你全螢幕的專注體驗。
- **響應式混合佈局 (Hybrid Layout)**：
  - **電腦版**：全螢幕儀表板，左側控制面板固定，右側清單滾動。
  - **手機版**：置中卡片式設計，單手也能輕鬆操作。

## 🛠️ 技術棧 (Tech Stack)

本專案採用 **Vibe Coding** 模式開發，強調快速迭代與極致的 UI/UX 體驗。

- **Frontend Framework**: [Next.js 14 (App Router)](https://nextjs.org/)
- **Language**: TypeScript
- **Styling**: Tailwind CSS (Glassmorphism 視覺風格)
- **Backend / Database**: Google Firebase (Firestore)
- **Authentication**: Firebase Auth (Google 登入)
- **Deployment**: GitHub Pages

## 💡 技術亮點

1. **Smart Navbar (智慧導航列)**
   - 瀏覽時自動偵測滑動方向：往下滑動隱藏，往上滑動顯示。
   - 封裝 `useImmersiveMode` Hook，在開啟 Modal 時強制接管導航列狀態。

2. **解決響應式痛點**
   - 針對手機版 (Mobile) 與電腦版 (Desktop) 實作不同的 Layout 策略。
   - 解決 iOS Safari 上常見的 `100vh` 與 Z-index 遮擋問題。

3. **資料庫 CRUD**
   - 完整的增刪查改功能，並實作資料庫即時監聽。

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

## 🌐 部署 (Deployment)

本專案已設定好 GitHub Pages 自動部署流程。

1. **編譯與輸出**
```bash
npm run build

```


2. **部署至 GitHub Pages**
```bash
npm run deploy

```


*(需確保 `next.config.ts` 中的 `basePath` 與 `gh-pages` 套件已設定正確)*

---

### 👨‍💻 Author

Created by **Brian** | 2026
*Built with passion, coffee, and AI.*

