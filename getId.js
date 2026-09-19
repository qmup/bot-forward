require("dotenv").config({
  path: `${__dirname}/.env`,
});

const { TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");
const readline = require("readline-sync");
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const apiId = Number(process.env.API_ID);
const apiHash = process.env.API_HASH;
const phone = process.env.PHONE;

const stringSession = new StringSession("");

async function run() {
  const client = new TelegramClient(stringSession, apiId, apiHash, {
    connectionRetries: 5,
  });

  console.log("Logging in to Telegram...\n");

  await client.start({
    phoneNumber: async () => phone,

    phoneCode: async () => {
      return readline.question("Enter Telegram OTP: ");
    },

    password: async () => {
      return readline.question(
        "Enter 2FA password (press Enter if not required): "
      );
    },

    onError: (err) => console.log(err),
  });

  console.log("\nLogin successful!");

  console.log("\nSession string:");
  console.log(client.session.save());

  console.log("\n===== CHAT LIST =====\n");

  const dialogs = await client.getDialogs();

  dialogs.forEach((d, index) => {
    console.log(`${index + 1}. ${d.title} | ID: ${d.id}`);
  });

  // Select group
  const choice = Number(
    readline.question("\nSELECT SOURCE GROUP (TYPE NUMBER): ")
  );

  if (!Number.isInteger(choice) || choice < 1 || choice > dialogs.length) {
    console.log("\n❌ Invalid selection!");
    await client.disconnect();
    process.exit(1);
  }

  const selected = dialogs[choice - 1];

  console.log(
    `\n✅ Selected: ${selected.title} (${selected.id})`
  );

  // =========================
  // UPDATE index.js
  // =========================

  const indexPath = path.join(__dirname, "index.js");

  if (!fs.existsSync(indexPath)) {
    console.log(`\n❌ index.js not found: ${indexPath}`);
    await client.disconnect();
    process.exit(1);
  }

  let content = fs.readFileSync(indexPath, "utf8");

  const sourceGroupRegex =
    /const SOURCE_GROUP_ID\s*=\s*-?\d+\s*;/;

  if (!sourceGroupRegex.test(content)) {
    console.log(
      "\n❌ SOURCE_GROUP_ID not found in index.js"
    );

    await client.disconnect();
    process.exit(1);
  }

  content = content.replace(
    sourceGroupRegex,
    `const SOURCE_GROUP_ID = ${selected.id};`
  );

  fs.writeFileSync(indexPath, content, "utf8");

  console.log("\n✅ SOURCE_GROUP_ID updated successfully.");

  // =========================
  // RESTART PM2
  // =========================

  console.log("\n🔄 Restarting forward-bot...");

  try {
    execSync("pm2 restart forward-bot", {
      stdio: "inherit",
    });

    console.log("\n✅ forward-bot restarted successfully!");
  } catch (err) {
    console.log("\n❌ Failed to restart forward-bot!");
    console.log(err.message);
  }

  await client.disconnect();

  console.log("\nDone.");
  process.exit();
}

run().catch((err) => {
  console.error("\n❌ Error:", err);
  process.exit(1);
});