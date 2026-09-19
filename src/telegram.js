const { TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");
const config = require("./config");

function createClient(options = {}) {
  const { session = config.session, ...clientOptions } = options;

  return new TelegramClient(
    new StringSession(session),
    config.apiId,
    config.apiHash,
    {
      connectionRetries: 10,
      autoReconnect: true,
      ...clientOptions,
    }
  );
}

module.exports = { createClient };
