/* require("dotenv").config({
  path: `${__dirname}/.env`,
});

const { TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");
const { NewMessage } = require("telegram/events");

const apiId = Number(process.env.API_ID);
const apiHash = process.env.API_HASH;
const session = process.env.SESSION;

const SOURCE_GROUP_ID = -1004424683355;
const TARGET_USER_ID = 1830174364;
const TARGET_GROUP_ID = 1078433024;

const stringSession = new StringSession(session);

async function sendToTargets(client, message, file = null) {
  const targets = [
    TARGET_USER_ID,
    TARGET_GROUP_ID,
  ];

  for (const target of targets) {
    await client.sendMessage(target, {
      message,
      file,
    });
  }
}

async function start() {
  const client = new TelegramClient(
    stringSession,
    apiId,
    apiHash,
    {
      connectionRetries: 10,
      autoReconnect: true,
    }
  );

  console.log("Connecting to Telegram...");

  await client.connect();

  const me = await client.getMe();

  console.log(
    `Logged in as: ${me.username || me.firstName}`
  );

  console.log("Forwarder is running...");

  client.addEventHandler(
    async (event) => {
      try {
        const msg = event.message;

        if (!msg) return;

        const text = msg.text || "";

        // Text-only message
        if (!msg.media) {
          if (!text) return;

          await sendToTargets(client, text);

          console.log("Forwarded text:", text);
          return;
        }

        // Media message
        //
        // For non-restricted sources, media can be copied
        // and sent as a new message.
        const file = await client.downloadMedia(msg);

        await sendToTargets(client, text, file);

        console.log(
          `Forwarded media message ${msg.id}`
        );
      } catch (err) {
        console.log(
          "Forward error:",
          err.message
        );
      }
    },
    new NewMessage({
      chats: [SOURCE_GROUP_ID],
    })
  );
}

start().catch(console.error); */

require("dotenv").config({
  path: `${__dirname}/.env`,
});

const { TelegramClient, Api } = require("telegram");
const { StringSession } = require("telegram/sessions");
const { NewMessage } = require("telegram/events");
const { CustomFile } = require("telegram/client/uploads");

// ======================================================
// ENV
// ======================================================

const apiId = Number(process.env.API_ID);
const apiHash = process.env.API_HASH;
const session = process.env.SESSION;

// ======================================================
// CHAT IDS
// ======================================================

const SOURCE_GROUP_ID = -1004424683355;

const TARGET_USER_ID = 1830174364;
const TARGET_GROUP_ID = 1078433024;

const TARGETS = [
  TARGET_USER_ID,
  TARGET_GROUP_ID,
];

const stringSession = new StringSession(session);

// ======================================================
// HELPERS
// ======================================================

function getText(msg) {
  return msg.message || msg.text || "";
}

/**
 * Lấy extension dựa vào MIME type.
 * Chỉ dùng khi Telegram document không có filename gốc.
 */
function extensionFromMime(mimeType = "") {
  const map = {
    "image/jpeg": ".jpg",
    "image/jpg": ".jpg",
    "image/png": ".png",
    "image/gif": ".gif",
    "image/webp": ".webp",

    "video/mp4": ".mp4",
    "video/webm": ".webm",
    "video/quicktime": ".mov",
    "video/x-matroska": ".mkv",

    "audio/mpeg": ".mp3",
    "audio/mp4": ".m4a",
    "audio/ogg": ".ogg",
    "audio/wav": ".wav",
    "audio/x-wav": ".wav",
    "audio/flac": ".flac",

    "application/pdf": ".pdf",
    "application/zip": ".zip",
    "application/x-rar-compressed": ".rar",
    "application/x-7z-compressed": ".7z",
    "application/json": ".json",
    "text/plain": ".txt",
  };

  return map[mimeType] || ".bin";
}

/**
 * Lấy filename gốc của document.
 */
function getDocumentFileName(document, msgId) {
  const attributes = document.attributes || [];

  const filenameAttribute = attributes.find(
    (attr) =>
      attr instanceof Api.DocumentAttributeFilename
  );

  if (filenameAttribute?.fileName) {
    return filenameAttribute.fileName;
  }

  const extension = extensionFromMime(
    document.mimeType
  );

  return `file_${msgId}${extension}`;
}

/**
 * Phân tích document của Telegram:
 * video, voice, audio, gif, sticker...
 */
function getDocumentInfo(document) {
  const attributes = document.attributes || [];

  const videoAttribute = attributes.find(
    (attr) =>
      attr instanceof Api.DocumentAttributeVideo
  );

  const audioAttribute = attributes.find(
    (attr) =>
      attr instanceof Api.DocumentAttributeAudio
  );

  const animatedAttribute = attributes.find(
    (attr) =>
      attr instanceof Api.DocumentAttributeAnimated
  );

  const stickerAttribute = attributes.find(
    (attr) =>
      attr instanceof Api.DocumentAttributeSticker
  );

  return {
    isVideo: Boolean(videoAttribute),
    isVideoNote: Boolean(
      videoAttribute?.roundMessage
    ),

    supportsStreaming: Boolean(
      videoAttribute?.supportsStreaming
    ),

    isAudio: Boolean(audioAttribute),
    isVoice: Boolean(
      audioAttribute?.voice
    ),

    isAnimated: Boolean(animatedAttribute),
    isSticker: Boolean(stickerAttribute),
  };
}

/**
 * Download media về Buffer.
 */
async function downloadMediaBuffer(client, msg) {
  const buffer = await client.downloadMedia(msg);

  if (!buffer) {
    throw new Error(
      `Unable to download media for message ${msg.id}`
    );
  }

  if (!Buffer.isBuffer(buffer)) {
    throw new Error(
      `downloadMedia did not return a Buffer for message ${msg.id}`
    );
  }

  return buffer;
}

// ======================================================
// TEXT / WEB PREVIEW
// ======================================================

async function sendTextMessageToTargets(
  client,
  msg,
  linkPreview
) {
  const text = getText(msg);

  if (!text) {
    return;
  }

  for (const target of TARGETS) {
    await client.sendMessage(target, {
      message: text,

      // Giữ bold / italic / URL entity...
      formattingEntities:
        msg.entities || undefined,

      // true với YouTube / website preview
      linkPreview,
    });
  }
}

// ======================================================
// PHOTO
// ======================================================

async function sendPhotoToTargets(
  client,
  msg
) {
  const text = getText(msg);

  console.log(
    `Downloading photo ${msg.id}...`
  );

  const buffer =
    await downloadMediaBuffer(
      client,
      msg
    );

  const fileName =
    `photo_${msg.id}.jpg`;

  console.log(
    `Photo downloaded: ${fileName} - ${buffer.length} bytes`
  );

  for (const target of TARGETS) {
    // Tạo CustomFile riêng cho mỗi upload.
    //
    // Đây là phần fix lỗi:
    //
    // unnamed
    // xx KB - Download
    //
    const file = new CustomFile(
      fileName,
      buffer.length,
      "",
      buffer
    );

    await client.sendFile(target, {
      file,

      caption: text,

      formattingEntities:
        msg.entities || undefined,

      // QUAN TRỌNG:
      // gửi như PHOTO chứ không phải document
      forceDocument: false,
    });
  }
}

// ======================================================
// DOCUMENT / VIDEO / AUDIO / GIF / STICKER
// ======================================================

async function sendDocumentToTargets(
  client,
  msg
) {
  const text = getText(msg);

  const document = msg.media.document;

  if (
    !document ||
    !(document instanceof Api.Document)
  ) {
    throw new Error(
      `Invalid document in message ${msg.id}`
    );
  }

  const info =
    getDocumentInfo(document);

  const fileName =
    getDocumentFileName(
      document,
      msg.id
    );

  console.log(
    `Downloading document ${msg.id}:`,
    {
      fileName,
      mimeType: document.mimeType,
      isVideo: info.isVideo,
      isVideoNote: info.isVideoNote,
      isAudio: info.isAudio,
      isVoice: info.isVoice,
      isAnimated: info.isAnimated,
      isSticker: info.isSticker,
    }
  );

  const buffer =
    await downloadMediaBuffer(
      client,
      msg
    );

  /*
   * Nếu là những media Telegram có UI riêng:
   *
   * video
   * voice
   * audio
   * GIF
   * sticker
   *
   * thì không ép thành generic document.
   *
   * PDF, ZIP, PNG gửi dạng file... thì giữ document.
   */
  const shouldForceDocument =
    !info.isVideo &&
    !info.isAudio &&
    !info.isAnimated &&
    !info.isSticker;

  for (const target of TARGETS) {
    const file = new CustomFile(
      fileName,
      buffer.length,
      "",
      buffer
    );

    await client.sendFile(target, {
      file,

      caption: text,

      formattingEntities:
        msg.entities || undefined,

      forceDocument:
        shouldForceDocument,

      // Giữ metadata gốc.
      //
      // Quan trọng với video duration,
      // resolution, audio, sticker...
      attributes:
        document.attributes || undefined,

      voiceNote:
        info.isVoice,

      videoNote:
        info.isVideoNote,

      supportsStreaming:
        info.isVideo &&
        (
          info.supportsStreaming ||
          document.mimeType ===
            "video/mp4"
        ),
    });
  }
}

// ======================================================
// OTHER MEDIA
// ======================================================

async function sendOtherMediaToTargets(
  client,
  msg
) {
  /*
   * Location / contact / poll / dice...
   *
   * Với những media không cần download file,
   * thử để GramJS copy object của message.
   */

  for (const target of TARGETS) {
    await client.sendMessage(target, {
      message: msg,
    });
  }
}

// ======================================================
// MESSAGE HANDLER
// ======================================================

async function handleMessage(
  client,
  msg
) {
  if (!msg) return;

  const text = getText(msg);

  console.log(
    "\n================================"
  );

  console.log(
    `Received message ${msg.id}`
  );

  console.log({
    text:
      text.length > 100
        ? `${text.substring(0, 100)}...`
        : text,

    media:
      msg.media?.className ||
      msg.media?.constructor?.name ||
      null,
  });

  // ==================================================
  // 1. TEXT ONLY
  // ==================================================

  if (!msg.media) {
    if (!text) {
      console.log(
        "Empty text message, skipped"
      );

      return;
    }

    /*
     * Không có MessageMediaWebPage tức source
     * không có preview.
     *
     * Nếu trong text có URL nhưng source đã
     * disable preview thì destination cũng
     * không tự tạo preview.
     */
    await sendTextMessageToTargets(
      client,
      msg,
      false
    );

    console.log(
      `Forwarded text message ${msg.id}`
    );

    return;
  }

  // ==================================================
  // 2. WEB PAGE / YOUTUBE PREVIEW
  // ==================================================

  if (
    msg.media instanceof
    Api.MessageMediaWebPage
  ) {
    /*
     * Không download preview thumbnail.
     *
     * Gửi lại text + URL,
     * Telegram sẽ generate preview mới.
     */
    await sendTextMessageToTargets(
      client,
      msg,
      true
    );

    console.log(
      `Forwarded web preview message ${msg.id}`
    );

    return;
  }

  // ==================================================
  // 3. PHOTO
  // ==================================================

  if (
    msg.media instanceof
    Api.MessageMediaPhoto
  ) {
    await sendPhotoToTargets(
      client,
      msg
    );

    console.log(
      `Forwarded photo ${msg.id}`
    );

    return;
  }

  // ==================================================
  // 4. DOCUMENT
  //
  // Telegram dùng Document cho:
  // - video
  // - gif
  // - mp3
  // - voice
  // - sticker
  // - pdf
  // - zip
  // - file...
  // ==================================================

  if (
    msg.media instanceof
    Api.MessageMediaDocument
  ) {
    await sendDocumentToTargets(
      client,
      msg
    );

    console.log(
      `Forwarded document/media ${msg.id}`
    );

    return;
  }

  // ==================================================
  // 5. OTHER TELEGRAM MEDIA
  // ==================================================

  console.log(
    `Other media type: ${
      msg.media.className ||
      msg.media.constructor?.name
    }`
  );

  await sendOtherMediaToTargets(
    client,
    msg
  );

  console.log(
    `Forwarded other media ${msg.id}`
  );
}

// ======================================================
// START CLIENT
// ======================================================

async function start() {
  const client = new TelegramClient(
    stringSession,
    apiId,
    apiHash,
    {
      connectionRetries: 10,
      autoReconnect: true,
    }
  );

  console.log(
    "Connecting to Telegram..."
  );

  await client.connect();

  const me = await client.getMe();

  console.log(
    `Logged in as: ${
      me.username ||
      me.firstName ||
      me.id
    }`
  );

  console.log(
    "Forwarder is running..."
  );

  console.log(
    `Source: ${SOURCE_GROUP_ID}`
  );

  console.log(
    `Targets: ${TARGETS.join(", ")}`
  );

  // ==================================================
  // EVENT HANDLER
  // ==================================================

  client.addEventHandler(
    async (event) => {
      try {
        await handleMessage(
          client,
          event.message
        );
      } catch (err) {
        console.error(
          "\nForward error:"
        );

        console.error(
          err?.stack ||
          err?.message ||
          err
        );
      }
    },

    new NewMessage({
      chats: [
        SOURCE_GROUP_ID,
      ],
    })
  );
}

// ======================================================
// RUN
// ======================================================

start().catch((err) => {
  console.error(
    "Fatal error:",
    err?.stack ||
    err?.message ||
    err
  );

  process.exit(1);
});