const { start } = require("../src/forwarder");

start().catch((err) => {
  console.error("Fatal error:", err?.stack || err?.message || err);
  process.exit(1);
});
