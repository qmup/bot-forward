const { COMPETITIONS, TIMEZONE } = require("../config");

function formatVnTime(utcDate) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(utcDate));
}

function formatVnDate(date) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: TIMEZONE,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function teamName(team) {
  return team?.shortName || team?.name || "Unknown";
}

function formatScore(score) {
  const home = score?.fullTime?.home;
  const away = score?.fullTime?.away;

  if (home == null || away == null) {
    return null;
  }

  return `${home}–${away}`;
}

function formatMatchLine(match) {
  const score = formatScore(match.score);

  if (!score) {
    return null;
  }

  return `${formatVnTime(match.utcDate)} - ${teamName(match.homeTeam)} ${score} ${teamName(match.awayTeam)}`;
}

function formatMessage(matches, now = new Date()) {
  const byCode = new Map();

  for (const match of matches) {
    const code = match.competition?.code;

    if (!code) {
      continue;
    }

    if (!byCode.has(code)) {
      byCode.set(code, []);
    }

    byCode.get(code).push(match);
  }

  const sections = [];

  for (const { code, title } of COMPETITIONS) {
    const list = byCode.get(code);

    if (!list?.length) {
      continue;
    }

    list.sort(
      (a, b) => new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime()
    );

    const lines = list.map(formatMatchLine).filter(Boolean);

    if (!lines.length) {
      continue;
    }

    sections.push(`${title}\n${lines.join("\n")}`);
  }

  if (!sections.length) {
    return null;
  }

  return [
    "⚽ KẾT QUẢ BÓNG ĐÁ",
    `🗓 24 giờ qua · ${formatVnDate(now)}`,
    "",
    sections.join("\n\n"),
  ].join("\n");
}

module.exports = { formatMessage };
