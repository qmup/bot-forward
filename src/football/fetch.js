const { COMPETITIONS } = require("../config");

const COMPETITION_CODES = COMPETITIONS.map((item) => item.code).join(",");

function utcDateOnly(date) {
  return date.toISOString().slice(0, 10);
}

function getFetchWindow(now = new Date()) {
  const from = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const to = now;
  const dateFrom = utcDateOnly(from);
  const dateTo = utcDateOnly(
    new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1)
    )
  );

  return { from, to, dateFrom, dateTo };
}

function isInWindow(utcDate, from, to) {
  const timestamp = new Date(utcDate).getTime();
  return timestamp >= from.getTime() && timestamp <= to.getTime();
}

async function fetchFinishedMatches({
  token,
  from,
  to,
  dateFrom,
  dateTo,
} = {}) {
  if (!token) {
    throw new Error("FOOTBALL_DATA_TOKEN is missing");
  }

  const window = from && to && dateFrom && dateTo
    ? { from, to, dateFrom, dateTo }
    : getFetchWindow();

  const url =
    `https://api.football-data.org/v4/matches` +
    `?competitions=${COMPETITION_CODES}` +
    `&dateFrom=${window.dateFrom}` +
    `&dateTo=${window.dateTo}` +
    `&status=FINISHED`;

  const response = await fetch(url, {
    headers: {
      "X-Auth-Token": token,
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`football-data.org ${response.status}: ${body}`);
  }

  const data = await response.json();
  const matches = Array.isArray(data.matches) ? data.matches : [];

  return matches.filter(
    (match) => match.utcDate && isInWindow(match.utcDate, window.from, window.to)
  );
}

module.exports = {
  getFetchWindow,
  fetchFinishedMatches,
};
