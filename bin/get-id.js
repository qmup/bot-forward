const fs = require("fs");
const { execSync } = require("child_process");
const readline = require("readline-sync");
const config = require("../src/config");
const { createClient } = require("../src/telegram");

async function run() {
  const client = createClient({
    session: "",
    connectionRetries: 5,
    autoReconnect: false,
  });

  console.log("Logging in to Telegram...\n");

  await client.start({
    phoneNumber: async () => config.phone,
    phoneCode: async () => readline.question("Enter Telegram OTP: "),
    password: async () =>
      readline.question(
        "Enter 2FA password (press Enter if not required): "
      ),
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

  const choice = Number(
    readline.question("\nSELECT SOURCE GROUP (TYPE NUMBER): ")
  );

  if (!Number.isInteger(choice) || choice < 1 || choice > dialogs.length) {
    console.log("\n❌ Invalid selection!");
    await client.disconnect();
    process.exit(1);
  }

  const selected = dialogs[choice - 1];

  console.log(`\n✅ Selected: ${selected.title} (${selected.id})`);

  if (!fs.existsSync(config.configPath)) {
    console.log(`\n❌ config.js not found: ${config.configPath}`);
    await client.disconnect();
    process.exit(1);
  }

  let content = fs.readFileSync(config.configPath, "utf8");
  const sourceGroupRegex = /const SOURCE_GROUP_ID\s*=\s*-?\d+\s*;/;

  if (!sourceGroupRegex.test(content)) {
    console.log("\n❌ SOURCE_GROUP_ID not found in src/config.js");
    await client.disconnect();
    process.exit(1);
  }

  content = content.replace(
    sourceGroupRegex,
    `const SOURCE_GROUP_ID = ${selected.id};`
  );

  fs.writeFileSync(config.configPath, content, "utf8");

  console.log("\n✅ SOURCE_GROUP_ID updated successfully.");
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
