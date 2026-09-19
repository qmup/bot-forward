const { NewMessage } = require("telegram/events");
const { SOURCE_GROUP_ID, TARGETS } = require("../config");
const { createClient } = require("../telegram");
const { handleMessage } = require("./handler");

async function start() {
  const client = createClient();

  console.log("Connecting to Telegram...");

  await client.connect();

  const me = await client.getMe();

  console.log(`Logged in as: ${me.username || me.firstName || me.id}`);
  console.log("Forwarder is running...");
  console.log(`Source: ${SOURCE_GROUP_ID}`);
  console.log(`Targets: ${TARGETS.join(", ")}`);

  client.addEventHandler(
    async (event) => {
      try {
        await handleMessage(client, event.message);
      } catch (err) {
        console.error("\nForward error:");
        console.error(err?.stack || err?.message || err);
      }
    },
    new NewMessage({
      chats: [SOURCE_GROUP_ID],
    })
  );
}

module.exports = { start };
