# Webhook Studio

### 編寫、預覽，將訊息送到 Discord

![preview-1](https://github.com/AmeMizuki/webhook-studio/releases/download/preview/preview-1.jpg)

[English](README.md) | 繁體中文

透過 Webhook，將文字、圖片、影片與檔案傳送到 Discord 頻道。送出前可預覽內容、自訂顯示名稱，或傳送至現有討論串，不需要註冊帳號。

## 安裝方式

安裝 [Bun](https://bun.sh)，在專案目錄執行：

```sh
bun install
bun run dev
```

開啟 http://127.0.0.1:3002 。若已透過 `PORT` 設定其他連接埠，請使用終端機顯示的網址。

## 開發方式

修改原始碼後，停止伺服器並重新執行 `bun run dev`；頁面不會自動重新載入更新。

```sh
bun run build  # 建置網站至 dist/
bun start      # 啟動已建置的網站
```

若要發布網站，將 `dist/` 內的內容上傳至靜態網站服務即可。

## 操作說明

1. 在 Discord 目標頻道開啟「**頻道設定 → 整合 → Webhook**」，建立或選擇 Webhook，並複製網址。
2. 將網址貼入 Webhook Studio。
3. 輸入最多 2,000 個字元的訊息、加入最多 10 個附件，或同時傳送兩者。有附件時可不填文字，檔案大小依 Discord 頻道限制。
4. 視需要展開「**進階設定**」，填入顯示名稱或現有討論串 ID。論壇／媒體頻道必須指定屬於該頻道的討論串。
5. 確認「**內容預覽**」，按「**送出訊息**」或 **Ctrl／⌘ + Enter**。

### 預覽與編輯

- 預覽顯示純文字與圖片。送出時支援 Markdown，但預覽不會解析格式；影片與其他檔案顯示檔名。
- 單欄版面可使用「查看預覽」及「返回編輯」在區塊之間移動。
- 附件可分次選取或拖放至選檔按鈕，送出前可個別移除。「清空訊息」會一併清除文字與附件；「填入範例」會取代目前的訊息文字。
- 「JSON 請求本文」可查看訊息資料，不包含目的地網址或檔案內容。
- 可切換 **EN／繁中**，不會清除正在編寫的草稿。

### 目的地與安全提醒

- Webhook 只能傳送到綁定的頻道。若要切換頻道，請改用該頻道的 Webhook 網址。
- Webhook 網址等同發送權限，請勿公開。若已外洩，請在 Discord 刪除並重建 Webhook。
- 瀏覽器允許本機儲存時，會記住 Webhook 網址，重新開啟頁面也會帶入；清空網址欄位即可移除記錄，請避免在共用瀏覽器儲存。重新整理會清除草稿與已選檔案，但不會清除已儲存的網址。
- 訊息直接傳送至 Discord，不會觸發 `@everyone` 或其他提及通知。
- 成功送出後會清空訊息與附件，並保留 Webhook 網址；送出失敗則保留草稿與附件。若無法確認是否送達，請先查看 Discord，再決定是否重送，避免重複發送。

## 來源

- [Discord Webhook 使用說明](https://support.discord.com/hc/zh-tw/articles/228383668)
- [Discord Execute Webhook 文件](https://docs.discord.com/developers/resources/webhook#execute-webhook)
- [Discord 檔案上傳文件](https://docs.discord.com/developers/reference#uploading-files)
- [shadcn-svelte 元件](https://www.shadcn-svelte.com/docs/components/button) — 授權見[第三方授權聲明](THIRD_PARTY_LICENSES)。
