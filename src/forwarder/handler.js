const { Api } = require("telegram");
const { CustomFile } = require("telegram/client/uploads");
const { TARGETS } = require("../config");
const {
  getText,
  getDocumentFileName,
  getDocumentInfo,
  downloadMediaBuffer,
} = require("./media");

async function sendTextMessageToTargets(client, msg, linkPreview) {
  const text = getText(msg);

  if (!text) {
    return;
  }

  for (const target of TARGETS) {
    await client.sendMessage(target, {
      message: text,
      formattingEntities: msg.entities || undefined,
      linkPreview,
    });
  }
}

async function sendPhotoToTargets(client, msg) {
  const text = getText(msg);

  console.log(`Downloading photo ${msg.id}...`);

  const buffer = await downloadMediaBuffer(client, msg);
  const fileName = `photo_${msg.id}.jpg`;

  console.log(`Photo downloaded: ${fileName} - ${buffer.length} bytes`);

  for (const target of TARGETS) {
    const file = new CustomFile(fileName, buffer.length, "", buffer);

    await client.sendFile(target, {
      file,
      caption: text,
      formattingEntities: msg.entities || undefined,
      forceDocument: false,
    });
  }
}

async function sendDocumentToTargets(client, msg) {
  const text = getText(msg);
  const document = msg.media.document;

  if (!document || !(document instanceof Api.Document)) {
    throw new Error(`Invalid document in message ${msg.id}`);
  }

  const info = getDocumentInfo(document);
  const fileName = getDocumentFileName(document, msg.id);

  console.log(`Downloading document ${msg.id}:`, {
    fileName,
    mimeType: document.mimeType,
    isVideo: info.isVideo,
    isVideoNote: info.isVideoNote,
    isAudio: info.isAudio,
    isVoice: info.isVoice,
    isAnimated: info.isAnimated,
    isSticker: info.isSticker,
  });

  const buffer = await downloadMediaBuffer(client, msg);

  const shouldForceDocument =
    !info.isVideo && !info.isAudio && !info.isAnimated && !info.isSticker;

  for (const target of TARGETS) {
    const file = new CustomFile(fileName, buffer.length, "", buffer);

    await client.sendFile(target, {
      file,
      caption: text,
      formattingEntities: msg.entities || undefined,
      forceDocument: shouldForceDocument,
      attributes: document.attributes || undefined,
      voiceNote: info.isVoice,
      videoNote: info.isVideoNote,
      supportsStreaming:
        info.isVideo &&
        (info.supportsStreaming || document.mimeType === "video/mp4"),
    });
  }
}

async function sendOtherMediaToTargets(client, msg) {
  for (const target of TARGETS) {
    await client.sendMessage(target, {
      message: msg,
    });
  }
}

async function handleMessage(client, msg) {
  if (!msg) return;

  const text = getText(msg);

  console.log("\n================================");
  console.log(`Received message ${msg.id}`);
  console.log({
    text: text.length > 100 ? `${text.substring(0, 100)}...` : text,
    media: msg.media?.className || msg.media?.constructor?.name || null,
  });

  if (!msg.media) {
    if (!text) {
      console.log("Empty text message, skipped");
      return;
    }

    await sendTextMessageToTargets(client, msg, false);
    console.log(`Forwarded text message ${msg.id}`);
    return;
  }

  if (msg.media instanceof Api.MessageMediaWebPage) {
    await sendTextMessageToTargets(client, msg, true);
    console.log(`Forwarded web preview message ${msg.id}`);
    return;
  }

  if (msg.media instanceof Api.MessageMediaPhoto) {
    await sendPhotoToTargets(client, msg);
    console.log(`Forwarded photo ${msg.id}`);
    return;
  }

  if (msg.media instanceof Api.MessageMediaDocument) {
    await sendDocumentToTargets(client, msg);
    console.log(`Forwarded document/media ${msg.id}`);
    return;
  }

  console.log(
    `Other media type: ${msg.media.className || msg.media.constructor?.name}`
  );

  await sendOtherMediaToTargets(client, msg);
  console.log(`Forwarded other media ${msg.id}`);
}

module.exports = { handleMessage };
