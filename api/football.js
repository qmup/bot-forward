const { scheduledHandler } = require("../src/http");
const { runFootballJob } = require("../src/football/job");

module.exports = scheduledHandler("football-results", async () => {
  const { sent, count } = await runFootballJob();
  return { sent, count };
});
