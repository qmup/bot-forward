# bot-forward

Telegram userbot: forward tin nhắn từ một group nguồn, và gửi kết quả 6 giải hàng đầu châu Âu lúc 08:00 GMT+7.

Có hai cách chạy:

- **Vercel (mặc định):** quét group nguồn mỗi 15 phút từ 17:00 đến 03:00 (GMT+7), gửi kết quả bóng đá lúc 08:00.
- **Máy chủ luôn bật (PM2):** forward realtime 24/7.

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

## Vercel

Push lên `main` sẽ tự deploy. Schedules khai báo trong `vercel.json`:

- `forwarder` — `*/15 17-23,0-2 * * *`, `Asia/Ho_Chi_Minh`, gọi `/api/forward`
- `football-results` — `0 8 * * *`, `Asia/Ho_Chi_Minh`, gọi `/api/football`

Hobby chạy mỗi lượt trễ tối đa 15 phút. Lượt đầu tiên sau khi bot nghỉ chỉ đánh dấu mốc, không chuyển tin cũ. Mỗi lượt xử lý tối đa 20 tin, file trên 20 MB được thay bằng link tới tin gốc (`src/config.js`).

Biến môi trường trên Vercel: `API_ID`, `API_HASH`, `SESSION`, `FOOTBALL_DATA_TOKEN`, `CRON_SECRET`, và `KV_REST_API_URL` / `KV_REST_API_TOKEN` (Upstash Redis, lưu ID tin đã chuyển).

Chạy thử một lượt:

```bash
vercel schedules invoke forwarder
vercel schedules invoke football-results
```

Đổi `SESSION` hoặc ID nhóm: cập nhật env trên Vercel / `src/config.js`, rồi deploy lại.

## Máy chủ luôn bật (PM2)

```bash
npm start              # forwarder realtime
npm run football       # gửi kết quả 24h qua (chạy tay)
pm2 start ecosystem.config.js
```

- `forward-bot` — process dài, lắng nghe group nguồn
- `football-results` — cron `0 8 * * *` theo giờ máy (đặt timezone máy là GMT+7)

Không chạy cả Vercel và PM2 cùng lúc, nếu không tin sẽ bị gửi hai lần.

Không commit file `.env`. Session string đủ quyền vào tài khoản Telegram.
