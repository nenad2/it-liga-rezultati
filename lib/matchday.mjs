const DATE_RANGE = /(\d{1,2})\.\s*(\d{1,2})\.\s*(\d{4})\.?\s*-\s*(\d{1,2})\.\s*(\d{1,2})\.\s*(\d{4})/;
const key = (y, m, d) => y * 10000 + m * 100 + d;

/** Today's date in Belgrade as yyyymmdd (the league plays in Niš). */
export function todayKey(now = new Date()) {
  const [y, m, d] = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Belgrade', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now).split('-').map(Number);
  return key(y, m, d);
}

/** Parses "9.11.2026. - 15.11.2026." into { start, end } as yyyymmdd. Returns null for "TBD" or unreadable labels. */
export function parseRoundDates(label) {
  const m = DATE_RANGE.exec(label || '');
  if (!m) return null;
  const [, d1, m1, y1, d2, m2, y2] = m.map(Number);
  const end = key(y2, m2, d2);
  const days = (y, m, d) => Date.UTC(y, m - 1, d) / 86400000;
  let startYear = y1;
  // A typo in the start year (e.g. 2020 instead of 2026) must not break the round: a round lasts about a week.
  if (days(y1, m1, d1) > days(y2, m2, d2) || days(y2, m2, d2) - days(y1, m1, d1) > 45) startYear = y2;
  if (days(startYear, m1, d1) > days(y2, m2, d2)) startYear = y2 - 1;
  const start = key(startYear, m1, d1);
  return { start, end };
}

/**
 * The round whose dates include today. Between two rounds it stays on the one that started last;
 * before the first round it returns null.
 */
export function getRoundByDate(rounds, now = new Date()) {
  const today = todayKey(now);
  let found = null;
  for (const round of rounds || []) {
    const dates = parseRoundDates(round.dateLabel);
    if (!dates || dates.start > today) continue;
    if (!found || dates.start > found.start) found = { number: round.number, start: dates.start };
  }
  return found ? found.number : null;
}

/**
 * @template {{ round: number, status: string }} T
 * @param {T[]} matches
 * @param {{ currentRound: number, round: number } | null} [selection]
 * @param {{ rounds?: { number: number, dateLabel?: string }[], now?: Date }} [options]
 *   With `rounds`, the current matchday is the one running today by its dates (or a later one that
 *   already has results). Without them, it is the latest round that has a finished match.
 */
export function getMatchdayFocus(matches, selection = null, options = {}) {
  const byResults = matches.reduce((latest, match) => match.status === 'finished' ? Math.max(latest, match.round) : latest, 1);
  const byDate = options.rounds ? getRoundByDate(options.rounds, options.now) : null;
  const currentRound = Math.max(byResults, byDate ?? 1);
  // Keep manual browsing until the season moves to another matchday.
  const round = selection?.currentRound === currentRound ? selection.round : currentRound;
  const nextMatch = matches.filter(match => match.status === 'scheduled' && match.round >= currentRound).sort((a, b) => a.round - b.round)[0];
  return { currentRound, round, nextMatch };
}
