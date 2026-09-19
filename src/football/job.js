const config = require("../config");
const { createClient } = require("../telegram");
const { getFetchWindow, fetchFinishedMatches } = require("./fetch");
const { formatMessage } = require("./format");

async function runFootballJob(now = new Date()) {
  const window = getFetchWindow(now);

  console.log(
    `Fetching finished matches ${window.dateFrom} → ${window.dateTo} (exclusive)`
  );

  const matches = await fetchFinishedMatches({
    token: config.footballDataToken,
    ...window,
  });

  const text = formatMessage(matches, now);

  if (!text) {
    console.log("No finished matches in the last 24h, skip send.");
    return { sent: false, text: null, count: 0 };
  }

  console.log(text);

  const client = createClient({
    connectionRetries: 5,
    autoReconnect: false,
  });

  await client.connect();

  try {
    for (const target of config.TARGETS) {
      await client.sendMessage(target, { message: text });
      console.log(`Sent football results to ${target}`);
    }
  } finally {
    await client.disconnect();
  }

  return { sent: true, text, count: matches.length };
}

module.exports = { runFootballJob };
