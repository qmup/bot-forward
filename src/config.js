const path = require("path");

require("dotenv").config({
  path: path.join(__dirname, "..", ".env"),
  quiet: true,
});

const SOURCE_GROUP_ID = -1004424683355;

const TARGET_USER_ID = 1830174364;
const TARGET_GROUP_ID = 1078433024;

const TARGETS = [TARGET_USER_ID, TARGET_GROUP_ID];

const COMPETITIONS = [
  { code: "CL", title: "🏆 Champions League" },
  { code: "PL", title: "🏴󠁧󠁢󠁥󠁮󠁧󠁿 Premier League" },
  { code: "PD", title: "🇪🇸 La Liga" },
  { code: "SA", title: "🇮🇹 Serie A" },
  { code: "BL1", title: "🇩🇪 Bundesliga" },
  { code: "FL1", title: "🇫🇷 Ligue 1" },
];

const TIMEZONE = "Asia/Ho_Chi_Minh";

// Polling mode (Vercel): keeps each run well inside the Hobby 300s limit.
const POLL_MAX_MESSAGES = 20;
const POLL_MAX_FILE_BYTES = 20 * 1024 * 1024;
const POLL_TIME_BUDGET_MS = 240 * 1000;
// A gap this long since the last run means the bot was off-hours: skip the backlog.
const POLL_NEW_WINDOW_GAP_MS = 2 * 60 * 60 * 1000;

module.exports = {
  apiId: Number(process.env.API_ID),
  apiHash: process.env.API_HASH,
  session: process.env.SESSION || "",
  phone: process.env.PHONE,
  footballDataToken: process.env.FOOTBALL_DATA_TOKEN,
  SOURCE_GROUP_ID,
  TARGETS,
  COMPETITIONS,
  TIMEZONE,
  POLL_MAX_MESSAGES,
  POLL_MAX_FILE_BYTES,
  POLL_TIME_BUDGET_MS,
  POLL_NEW_WINDOW_GAP_MS,
  cronSecret: process.env.CRON_SECRET,
  configPath: __filename,
};
