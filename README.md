# 齊家出國登峰競賽 — 協作 Repo

正式站：https://tools.benebuyhouse.com/sales-contest.html（齊家業務工具站的一頁）

這個 repo 是**競賽看板的程式碼協作區**，只包含競賽功能本身的檔案，供協作者（與協作者的 AI 工具）讀取、修改、發 PR。正式部署與後端不在這裡（見下方「界線」）。

## 檔案對應

| 本 repo | 部署位置（qijia-tools 主專案） | 說明 |
|---|---|---|
| `sales-contest.html` | `/sales-contest.html` | 看板本體：單檔 HTML+CSS+JS，無框架、無外部依賴（僅 Google Fonts） |
| `contest-guide.html` | `/contest-guide.html` | 遊戲說明簡報（11 頁，←→ 翻頁、F 全螢幕） |
| `assets/wheel-kit.js` | `/assets/wheel-kit.js` | 輪盤配樂引擎（Web Audio 即時合成，四曲風），與獎勵輪盤共用——**改它會影響別頁，動之前先在 PR 說明** |
| `assets/logo-color.png` | `/assets/logo-color.png` | 齊家 logo（頂欄 chip 用），僅供本機預覽，勿改 |
| `docs/api-contest.md` | —（後端在主專案） | `/api/contest` 雲端同步契約 |

## 本機預覽

```bash
python -m http.server 8080
```

開 `http://localhost:8080/sales-contest.html`。**沒有登入 session 時頁面自動降級成單機模式**（資料存 localStorage、輪盤與編輯全開），正好適合開發測試；正式站上「業務唯讀／管理者可編輯」的行為由 `/api/contest` 的 session 驗證決定（見 docs）。

視窗 ≥1400px 是投影版型（App Shell 內捲）、1024–1399 文件流、≤767 兩分頁（競賽看板／更新業績）。

## 遊戲規則不可變式（PR 紅線，改壞任何一條不會被 merge）

1. **恰好 7 階**（`TIERS.length===7`）。
2. **獎金總和恆等式**：`sum(reward)×4 = 15,000`；單組滿階＝3,750。
3. 門檻與獎金**嚴格遞增**，且步距與獎金增幅**最後兩階最大**（推升曲線）。
4. 每階 4 席，**席次＝送出順序**（內部單調遞增 `seq`，不是時間字串排序）。
5. **獎金鎖定後不因業績下降釋出**；只能在「達標紀錄管理」手動撤銷，撤銷後**不自動遞補**。
6. `TIERS` 是程式常數，**不進 localStorage／雲端狀態**（防壞資料改寫獎金數學）。
7. 雲端同步：`hasWork()` 為 false 的空白範本**絕不能蓋掉雲端真資料**。

改動後請至少手動驗：門檻邊界（149,999 在起跑區、150,000 進第 1 階，依此類推）、四組登頂總獎金剛好 15,000、第 5 組達標只標「達標未獲獎」。

## 設計規範（齊家 CIS）

- 色票：主色 `#1C3D65`、強調 `#325B8E`、淺藍 `#7DA3CA`、底 `#F7F8F8`、線 `#DCDDDD`、成功綠 `#407864`、警示琥珀 `#D97706`、錯誤 `#DC2626`。**金色 `#C9A84C` 已退役，禁止使用。**
- 字體 Noto Sans TC；數字 `tabular-nums`。
- 圖示一律 SVG 線性圖示，**不用 emoji**。
- 按鈕與輸入框 ≥44px、支援 `prefers-reduced-motion`（關動畫時直接切位置）、對比至少 WCAG AA。

## 已知雷（別再踩）

- `*{margin:0}` reset 會洗掉 `<dialog>` 的預設 `margin:auto` → 對話框黏左上角（已補 `dialog{margin:auto}`，勿刪）。
- 輪盤**轉動中**不可重繪盤面 SVG（指針落點會跟公布結果對不上）；轉動中按鈕已鎖，勿解。
- 事件代理掛在 `#wheelcard`（不是 `#wheelbody`）——標題列的「確定成組」鈕在 body 之外。
- 1366×768 投影機是常見場景，改版面請在該尺寸驗過無水平捲動、階梯一屏可見。

## 界線與協作流程

- **後端（`/api/contest`、LINE 登入、session）不在本 repo**，契約見 `docs/api-contest.md`；要動後端請在 PR 描述提需求，由維護者（小白）在主專案處理。
- **部署權只在主專案**：本 repo merge 後由維護者同步進 qijia-tools 並部署正式站，協作者不需要任何金鑰。
- 流程：開 branch → PR（說明改了什麼、為什麼、驗過什麼）→ 維護者 review／merge → 同步部署。**請勿直接 push main。**
- 頁面含公司內部人員姓名，repo 維持 **private**，勿公開、勿轉載。
