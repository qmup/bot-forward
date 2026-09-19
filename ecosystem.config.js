module.exports = {
  apps: [
    {
      name: "forward-bot",
      script: "bin/forward.js",
      cwd: __dirname,
    },
    {
      name: "football-results",
      script: "bin/football.js",
      cwd: __dirname,
      cron_restart: "0 8 * * *",
      tz: "Asia/Ho_Chi_Minh",
      autorestart: false,
    },
  ],
};
