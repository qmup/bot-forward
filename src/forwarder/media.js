const { Api } = require("telegram");

function getText(msg) {
  return msg.message || msg.text || "";
}

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

function getDocumentFileName(document, msgId) {
  const attributes = document.attributes || [];

  const filenameAttribute = attributes.find(
    (attr) => attr instanceof Api.DocumentAttributeFilename
  );

  if (filenameAttribute?.fileName) {
    return filenameAttribute.fileName;
  }

  return `file_${msgId}${extensionFromMime(document.mimeType)}`;
}

function getDocumentInfo(document) {
  const attributes = document.attributes || [];

  const videoAttribute = attributes.find(
    (attr) => attr instanceof Api.DocumentAttributeVideo
  );
  const audioAttribute = attributes.find(
    (attr) => attr instanceof Api.DocumentAttributeAudio
  );
  const animatedAttribute = attributes.find(
    (attr) => attr instanceof Api.DocumentAttributeAnimated
  );
  const stickerAttribute = attributes.find(
    (attr) => attr instanceof Api.DocumentAttributeSticker
  );

  return {
    isVideo: Boolean(videoAttribute),
    isVideoNote: Boolean(videoAttribute?.roundMessage),
    supportsStreaming: Boolean(videoAttribute?.supportsStreaming),
    isAudio: Boolean(audioAttribute),
    isVoice: Boolean(audioAttribute?.voice),
    isAnimated: Boolean(animatedAttribute),
    isSticker: Boolean(stickerAttribute),
  };
}

async function downloadMediaBuffer(client, msg) {
  const buffer = await client.downloadMedia(msg);

  if (!buffer) {
    throw new Error(`Unable to download media for message ${msg.id}`);
  }

  if (!Buffer.isBuffer(buffer)) {
    throw new Error(
      `downloadMedia did not return a Buffer for message ${msg.id}`
    );
  }

  return buffer;
}

module.exports = {
  getText,
  extensionFromMime,
  getDocumentFileName,
  getDocumentInfo,
  downloadMediaBuffer,
};
