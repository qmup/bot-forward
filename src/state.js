const crypto = require("crypto");
const { Redis } = require("@upstash/redis");

let redis;

function getRedis() {
  if (!redis) {
    const url =
      process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
    const token =
      process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

    if (!url || !token) {
      throw new Error(
        "Upstash Redis env is missing (KV_REST_API_URL / KV_REST_API_TOKEN)"
      );
    }

    redis = new Redis({ url, token });
  }

  return redis;
}

async function getNumber(key) {
  const value = await getRedis().get(key);
  return value == null ? null : Number(value);
}

async function setNumber(key, value) {
  await getRedis().set(key, String(value));
}

async function acquireLock(key, ttlSeconds) {
  const token = crypto.randomUUID();
  const result = await getRedis().set(key, token, { nx: true, ex: ttlSeconds });
  return result === "OK" ? token : null;
}

async function releaseLock(key, token) {
  if ((await getRedis().get(key)) === token) {
    await getRedis().del(key);
  }
}

module.exports = { getNumber, setNumber, acquireLock, releaseLock };
