import test from 'node:test';
import assert from 'node:assert/strict';
import seed from '../data/league.json' with { type: 'json' };
import { parseSlot, getKickoff, kickoffLabel, pickNextUp } from '../lib/schedule.mjs';

test('reads every team slot written in the sheet, with and without commas and diacritics', () => {
  assert.deepEqual(parseSlot('Elektronska, ponedeljak, 21h'), { venue: 'Elektronska', weekday: 1, time: '21:00' });
  assert.deepEqual(parseSlot('Elektronska, četvrtak 21h'), { venue: 'Elektronska', weekday: 4, time: '21:00' });
  assert.deepEqual(parseSlot('Dugi Arena (N.Banja), utorak, 19h'), { venue: 'Dugi Arena (N.Banja)', weekday: 2, time: '19:00' });
  assert.deepEqual(parseSlot('Bubanj, Sreda, 21:30h'), { venue: 'Bubanj', weekday: 3, time: '21:30' });
  assert.equal(parseSlot('Elektronska'), null);
  assert.equal(parseSlot(''), null);
  for (const team of seed.teams) assert.ok(parseSlot(team.venue), `${team.name}: ${team.venue}`);
});

test('places a match on the weekday inside its round dates', () => {
  const match = seed.matches.find(m => m.round === 7 && m.home === 'Fazi');
  const kickoff = getKickoff(match, seed.teams, seed.rounds);
  assert.equal(kickoff.date, 20261109);
  assert.equal(kickoffLabel(kickoff), 'Mon 9 Nov · 21:00');
  const wed = getKickoff(seed.matches.find(m => m.round === 7 && m.home === 'DMV'), seed.teams, seed.rounds);
  assert.equal(kickoffLabel(wed), 'Wed 11 Nov · 21:00');
  const sunRound = seed.rounds.map(r => ({ ...r, dateLabel: 'TBD' }));
  assert.equal(kickoffLabel(getKickoff(match, seed.teams, sunRound)), 'Mon · 21:00');
  assert.equal(getKickoff({ ...match, home: 'Nobody' }, seed.teams, seed.rounds), null);
});

test('Next up is the earliest match that has not started yet', () => {
  const round7 = seed.matches.filter(m => m.round === 7);
  const first = round7[0];
  const at = iso => pickNextUp(first, seed.matches, seed.teams, seed.rounds, new Date(iso));
  // Monday 9.11. 20:00 Belgrade: Ascalab (18h) already played, Fazi (21h) is next among the Monday slots.
  assert.equal(at('2026-11-09T19:00:00Z').home, 'Fazi');
  // Late Friday night: nothing is left upcoming, so it falls back to the default match of the round.
  const late = at('2026-11-13T23:00:00Z');
  assert.ok(round7.includes(late));
});
