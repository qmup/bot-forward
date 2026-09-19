const path = require("path");

require("dotenv").config({
  path: path.join(__dirname, "..", ".env"),
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
  configPath: __filename,
};
