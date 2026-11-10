import { parseRoundDates } from './matchday.mjs';

// Termin domaćina je upisan u listu "Kontakt podaci ekipa..." kao npr. "Elektronska, ponedeljak, 21h".
// Iz toga i iz datuma kola računamo kada se utakmica igra.
const WEEKDAYS = { ponedeljak: 1, utorak: 2, sreda: 3, cetvrtak: 4, petak: 5, subota: 6, nedelja: 0 };
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const plain = value => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const SLOT = new RegExp(`(${Object.keys(WEEKDAYS).join('|')})\\s*,?\\s*(?:u\\s*)?(\\d{1,2})(?:\\s*[:.]\\s*(\\d{2}))?\\s*(?:h|casova|sati)?`);

/** "Dugi Arena (N.Banja), utorak, 19h" -> { venue: 'Dugi Arena (N.Banja)', weekday: 2, time: '19:00' }. Null if no weekday is found. */
export function parseSlot(text) {
  const match = SLOT.exec(plain(text));
  if (!match) return null;
  const hour = Number(match[2]), minute = Number(match[3] ?? 0);
  if (hour > 23 || minute > 59) return null;
  // Letters keep their length when diacritics are stripped, so the position maps back to the original text.
  const venue = String(text).slice(0, match.index).replace(/[\s,;-]+$/, '').trim();
  return { venue, weekday: WEEKDAYS[match[1]], time: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}` };
}

const toDate = key => new Date(Date.UTC(Math.floor(key / 10000), Math.floor(key / 100) % 100 - 1, key % 100));

/** The date (yyyymmdd) inside the round's range that falls on the given weekday, or null. */
export function dateInRound(round, weekday) {
  const dates = round && parseRoundDates(round.dateLabel);
  if (!dates) return null;
  const start = toDate(dates.start), end = toDate(dates.end);
  for (let d = start; d <= end; d = new Date(d.getTime() + 86400000)) {
    if (d.getUTCDay() === weekday) return d.getUTCFullYear() * 10000 + (d.getUTCMonth() + 1) * 100 + d.getUTCDate();
  }
  return null;
}

/** When and where a match is played, from the home team's regular slot. Null if the slot is unknown. */
export function getKickoff(match, teams, rounds) {
  const home = (teams || []).find(team => team.name === match.home);
  const slot = home && parseSlot(home.venue);
  if (!slot) return null;
  const date = dateInRound((rounds || []).find(round => round.number === match.round), slot.weekday);
  return { ...slot, date, sortKey: date ? date * 10000 + Number(slot.time.slice(0, 2)) * 100 + Number(slot.time.slice(3)) : null };
}

/** "Mon 9 Nov · 21:00" (or "Mon · 21:00" when the round has no readable dates). */
export function kickoffLabel(kickoff) {
  if (!kickoff) return null;
  const day = kickoff.date ? (d => `${DAY_NAMES[d.getUTCDay()]} ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`)(toDate(kickoff.date)) : DAY_NAMES[kickoff.weekday];
  return `${day} · ${kickoff.time}`;
}

/** Current Belgrade wall-clock time as yyyymmddhhmm, comparable with getKickoff().sortKey. */
export function belgradeNowKey(now = new Date()) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Belgrade', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(now).map(p => [p.type, p.value]));
  return Number(`${parts.year}${parts.month}${parts.day}`) * 10000 + Number(parts.hour) * 100 + Number(parts.minute);
}

/**
 * The match to show as "Next up": among the scheduled matches of the current round (and later ones),
 * the earliest one that has not started yet. Without known kick-off times it keeps the sheet order.
 */
export function pickNextUp(nextMatch, matches, teams, rounds, now = new Date()) {
  if (!nextMatch) return nextMatch;
  const nowKey = belgradeNowKey(now);
  const upcoming = matches
    .filter(match => match.status === 'scheduled' && match.round >= nextMatch.round)
    .map((match, order) => ({ match, order, key: getKickoff(match, teams, rounds)?.sortKey ?? null }))
    .filter(item => item.key != null && item.key >= nowKey && item.match.round === nextMatch.round)
    .sort((a, b) => a.key - b.key || a.order - b.order);
  return upcoming[0]?.match ?? nextMatch;
}
