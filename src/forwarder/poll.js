const config = require("../config");
const state = require("../state");
const { createClient } = require("../telegram");
const { handleMessage } = require("./handler");

const LAST_ID_KEY = "forwarder:lastId";
const LAST_RUN_KEY = "forwarder:lastRunAt";
const LOCK_KEY = "forwarder:lock";

async function pollOnce() {
  const startedAt = Date.now();
  const lock = await state.acquireLock(LOCK_KEY, 290);

  if (!lock) {
    console.log("Another poll is running, skip.");
    return { mode: "locked" };
  }

  const client = createClient({ connectionRetries: 3, autoReconnect: false });

  try {
    await client.connect();

    const lastId = await state.getNumber(LAST_ID_KEY);
    const lastRunAt = await state.getNumber(LAST_RUN_KEY);
    const isNewWindow =
      lastId == null ||
      lastRunAt == null ||
      startedAt - lastRunAt > config.POLL_NEW_WINDOW_GAP_MS;

    if (isNewWindow) {
      const [latest] = await client.getMessages(config.SOURCE_GROUP_ID, {
        limit: 1,
      });
      const baselineId = latest?.id ?? 0;

      await state.setNumber(LAST_ID_KEY, baselineId);
      console.log(`New window, baseline at message ${baselineId}`);
      return { mode: "baseline", lastId: baselineId };
    }

    const messages = await client.getMessages(config.SOURCE_GROUP_ID, {
      minId: lastId,
      limit: config.POLL_MAX_MESSAGES,
      reverse: true,
    });

    const pending = messages
      .filter((msg) => msg.id > lastId)
      .sort((a, b) => a.id - b.id);

    let forwarded = 0;
    let failed = 0;
    let cursor = lastId;

    for (const msg of pending) {
      if (Date.now() - startedAt > config.POLL_TIME_BUDGET_MS) {
        console.log("Time budget reached, continue next run.");
        break;
      }

      try {
        await handleMessage(client, msg, {
          maxFileBytes: config.POLL_MAX_FILE_BYTES,
        });
        forwarded += 1;
      } catch (err) {
        failed += 1;
        console.error(`Forward error for message ${msg.id}:`);
        console.error(err?.stack || err?.message || err);
      }

      cursor = msg.id;
      await state.setNumber(LAST_ID_KEY, cursor);
    }

    return { mode: "poll", forwarded, failed, lastId: cursor };
  } finally {
    await state.setNumber(LAST_RUN_KEY, startedAt);
    await client.destroy();
    await state.releaseLock(LOCK_KEY, lock);
  }
}

module.exports = { pollOnce };
