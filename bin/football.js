const { runFootballJob } = require("../src/football/job");

runFootballJob()
  .then((result) => {
    if (result.sent) {
      console.log(`Done. Sent ${result.count} match(es).`);
    }
    process.exit(0);
  })
  .catch((err) => {
    console.error("Football job failed:", err?.stack || err?.message || err);
    process.exit(1);
  });
