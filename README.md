# bot-forward

Telegram userbot: forward tin nhắn từ một group nguồn, và gửi kết quả 6 giải hàng đầu châu Âu lúc 08:00 GMT+7.

## Cài đặt

```bash
npm install
cp .env.example .env
```

Điền `API_ID`, `API_HASH` (từ [my.telegram.org](https://my.telegram.org)), `PHONE`, `SESSION`, và `FOOTBALL_DATA_TOKEN` (từ [football-data.org](https://www.football-data.org/)).

Lấy session / chọn group nguồn:

```bash
npm run get-id
```

Copy session string vào `.env` (`SESSION=`). Source/target IDs nằm trong `src/config.js`.

## Chạy

```bash
npm start              # forwarder
npm run football       # gửi kết quả 24h qua (chạy tay)
pm2 start ecosystem.config.js
```

PM2:

- `forward-bot` — process dài, lắng nghe group nguồn
- `football-results` — cron `0 8 * * *` timezone `Asia/Ho_Chi_Minh`, `autorestart: false`

Không commit file `.env`. Session string đủ quyền vào tài khoản Telegram.
