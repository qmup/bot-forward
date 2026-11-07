const { cronSecret } = require("./config");

function isAuthorized(req) {
  return (
    Boolean(cronSecret) &&
    req.headers.authorization === `Bearer ${cronSecret}`
  );
}

function scheduledHandler(name, run) {
  return async (req, res) => {
    if (!isAuthorized(req)) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    try {
      const result = await run();
      console.log(`${name} done:`, JSON.stringify(result));
      res.status(200).json(result);
    } catch (err) {
      console.error(`${name} failed:`, err?.stack || err?.message || err);
      res.status(500).json({ error: err?.message || String(err) });
    }
  };
}

module.exports = { scheduledHandler };
