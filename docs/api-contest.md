# `/api/contest` 雲端同步契約

後端＝qijia-tools 主專案的 Cloudflare Pages Function（不在本 repo）。看板整份狀態存雲端 D1 KV（`contest/board`），前端以 45 秒輪詢同步。

## 身分

- 請求頭 `X-Session`：LINE 登入簽出的 HMAC session token（工具站發的）。
- 角色：`staff`（一般業務，經核准）／`admin`（管理者）。共用密碼登入可換一張**恆為非管理者**的唯讀 token（`/api/pwd-session`）。
- 沒有有效 session → 前端自動降級單機模式（localStorage），不打 API。

## GET `/api/contest`（staff 以上可讀）

```
200 { ok:true, state:<看板整份狀態|null>, rev:<版本號>, at:<ms時間戳>, by:<最後更新者顯示名> }
403 { error:"forbidden" }
```

`state` 結構＝前端 `defaultState()` 那份（config／teams／sales／updatedAt／records／seq／wheel）。`rev` 每次寫入 +1。

## POST `/api/contest`（僅 admin 可寫）

```
body: { state:<整份狀態>, by:<顯示名> }
200 { ok:true, rev, at }
400 { error:"bad" }        // state 缺 teams 陣列等
403 { error:"forbidden" }  // 非 admin
413 { error:"too large" }  // JSON 字串 > 200,000 字元
```

目前是**整份覆蓋**（last-write-wins，`rev` 僅記錄不做樂觀鎖）；因此前端規則：
- 唯讀者（staff）永遠不 POST；頁面以 `body[data-ro]` 隱藏輪盤／業績更新／設定。
- `hasWork()` 判定本機是空白範本時，**不得**把空白 POST 上去蓋掉雲端真資料。

## 前端掛勾位置（sales-contest.html）

- `cloudPull()`／`cloudPush()`：GET／POST 的封裝，搜尋 `api/contest` 即達。
- 若要做「組長可寫」「逐組寫入」「伺服器判定達標先後」等，都需要動後端——請在 PR 描述提需求，由維護者在主專案實作，本 repo 只改前端。
