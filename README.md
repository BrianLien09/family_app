# 🏠 我們家的小助手 (Family Utility Site)

這是一個專為我們家設計的溫馨實用網站，用來記錄生活中的重要日子，還有廚房裡的食譜小幫手。

![Project Preview](https://placehold.co/600x400?text=Family+Site+Preview)
_(部署後可以換成實際截圖)_

## ✨ 功能特色

### 📅 重要日期總覽

不再忘記重要行程！

- **倒數計時**：自動計算距離今天還有幾天，或標示「今天」、「明天」。
- **分類管理**：阿弟排班、剪頭髮、洗牙、聚餐...一目瞭然。
- **歷史回顧**：過期的行程會自動歸類到下方，方便查詢。

### 🍳 食譜比例轉換神器

煮飯不再按計算機！

- **私房食譜**：紀錄家裡愛吃的每一道菜。
- **自動換算**：只要輸入一次，下次想煮多一點或少一點，拉動滑桿，食材克數自動幫你算好！

## 🛠️ 技術說明

這個網站使用最新的網頁技術建置，且完全免費託管。

- **框架**：Next.js + TypeScript
- **設計**：Glassmorphism (毛玻璃質感) + Vanilla CSS
- **資料儲存**：瀏覽器 LocalStorage (資料存你電腦裡，安全但換裝置要重新輸入)

## 🚀 快速開始

如果你想在自己的電腦上跑跑看：

1. **安裝套件**

   ```bash
   npm install
   ```

2. **啟動測試伺服器**
   ```bash
   npm run dev
   ```
   打開瀏覽器輸入 `http://localhost:3000` 就可以看到了！

## 🌐 如何發布 (部署到 GitHub Pages)

只要執行一行指令，就能把網站更新到網路上給全家人看。

1. **設定 GitHub** (第一次才要)
   請確保你已經建立好 GitHub Repository 並連結了。

   ```bash
   git remote add origin https://github.com/你的帳號/你的專案名.git
   ```

2. **區分路徑 (重要)**
   如果你的網址後面有專案名 (例如 `username.github.io/family-site`)，
   請記得去 `next.config.ts` 把 `basePath` 打開。

3. **一鍵部署**
   在此資料夾開啟終端機，輸入：
   ```bash
   npm run deploy
   ```
   等它跑完，去 GitHub Pages 設定的網址就能看到了！

---

Made with ❤️ for Family.
