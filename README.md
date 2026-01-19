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
- **🆕 智慧搜尋**：關鍵字搜尋 + 多選分類 + 日期區間篩選，快速找到目標行程。
- **🆕 復原刪除**：誤刪行程？5 秒內可以一鍵復原，不用擔心手滑！

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

## 🛠️ 技術棧 (Tech Stack)

本專案採用 **Vibe Coding** 模式開發，強調快速迭代與極致的 UI/UX 體驗。

- **Frontend Framework**: [Next.js 16 (App Router)](https://nextjs.org/)
- **Language**: TypeScript
- **Styling**: Tailwind CSS (Glassmorphism 視覺風格)
- **Backend / Database**: Google Firebase (Firestore)
- **Authentication**: Firebase Auth (Google 登入)
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

## 🎯 最新更新 (v2.0 - 2026/01)

### ✅ 新增功能
- **智慧搜尋系統**: 支援關鍵字、多選分類、日期區間三重篩選
- **復原刪除功能**: 誤刪行程/食譜可在 5 秒內一鍵復原
- **無障礙改善**: ESC 快捷鍵、ARIA 標籤、增強焦點指示器

### 🔧 技術改進
- 將 `useDates.ts` 和 `useRecipes.ts` 升級為 `.tsx` 以支援 JSX
- 實作樂觀更新模式，提升操作流暢度
- 加入全域焦點樣式，改善鍵盤導航體驗

### 📊 使用範例
```typescript
// 搜尋 "剪頭髮" 的行程
搜尋框: "剪頭髮"

// 查看 1 月份的繳費項目
分類: [繳費]
日期區間: 2026-01-01 ~ 2026-01-31

// 復原誤刪的行程
刪除後 5 秒內點擊 Toast 的「復原」按鈕
```

---

### 👨‍💻 Author

Created by **Brian** | 2026
*Built with passion, coffee, and AI.*

