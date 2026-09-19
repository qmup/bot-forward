# bot-forward

Telegram userbot: lắng nghe tin nhắn từ một group nguồn rồi gửi lại tới user/group đích.

## Cài đặt

```bash
npm install
cp .env.example .env
```

Điền `API_ID`, `API_HASH` (từ [my.telegram.org](https://my.telegram.org)), `PHONE`, rồi lấy session:

```bash
npm run get-id
```

Copy session string vào `.env` (`SESSION=`), chỉnh `SOURCE_GROUP_ID` / target IDs trong `index.js`, rồi chạy:

```bash
npm start
```

Không commit file `.env`. Session string đủ quyền vào tài khoản Telegram.
