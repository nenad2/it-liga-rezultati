import test from 'node:test';
import assert from 'node:assert/strict';
import { getMatchdayFocus } from '../lib/matchday.mjs';

const scheduled = (round, id) => ({ id, round, status: 'scheduled', homeScore: null, awayScore: null });
const finished = (round, id) => ({ id, round, status: 'finished', homeScore: 0, awayScore: 0 });

test('starts at matchday 1 before any results, even with a partially entered score', () => {
  const matches = [scheduled(2, 'r2'), { ...scheduled(3, 'partial'), homeScore: 2 }, scheduled(1, 'r1')];
  const focus = getMatchdayFocus(matches);
  assert.equal(focus.currentRound, 1);
  assert.equal(focus.round, 1);
  assert.equal(focus.nextMatch.id, 'r1');
  assert.deepEqual(getMatchdayFocus([]), { currentRound: 1, round: 1, nextMatch: undefined });
});

test('fresh results advance all matchday views as soon as the first 0–0 is entered', () => {
  const snapshot = [finished(1, 'r1-result'), scheduled(1, 'postponed'), scheduled(2, 'r2-result'), scheduled(2, 'r2-upcoming'), scheduled(3, 'r3')];
  const initial = getMatchdayFocus(snapshot);
  assert.equal(initial.round, 1);

  // Model a workbook refresh after the page opened with the older snapshot.
  const refreshed = snapshot.map(match => match.id === 'r2-result' ? finished(2, match.id) : match);
  const focus = getMatchdayFocus(refreshed, { currentRound: initial.currentRound, round: 1 });
  assert.equal(focus.currentRound, 2);
  assert.equal(focus.round, 2);
  assert.deepEqual(refreshed.filter(match => match.round === focus.round).map(match => match.id), ['r2-result', 'r2-upcoming']);
  assert.deepEqual(refreshed.filter(match => match.round === focus.round && match.status === 'finished').map(match => match.id), ['r2-result']);
  assert.deepEqual(refreshed.filter(match => match.round === focus.round && match.status === 'scheduled').map(match => match.id), ['r2-upcoming']);
  assert.equal(focus.nextMatch.id, 'r2-upcoming');
});

test('manual browsing survives same-round updates and resets when a newer round starts', () => {
  const selection = { currentRound: 2, round: 1 };
  const matches = [finished(2, 'r2-result'), scheduled(2, 'r2-upcoming'), scheduled(3, 'r3')];
  assert.equal(getMatchdayFocus(matches, selection).round, 1);
  matches[1] = finished(2, 'r2-upcoming');
  assert.equal(getMatchdayFocus(matches, selection).round, 1);
  matches[2] = finished(3, 'r3');
  assert.equal(getMatchdayFocus(matches, selection).round, 3);
});

test('Next up prioritizes the current round, then the earliest later round regardless of source order', () => {
  const matches = [scheduled(4, 'r4'), scheduled(3, 'r3'), scheduled(1, 'postponed'), finished(2, 'r2-result'), scheduled(2, 'r2-upcoming')];
  assert.equal(getMatchdayFocus(matches).nextMatch.id, 'r2-upcoming');
  matches.pop();
  const focus = getMatchdayFocus(matches);
  assert.equal(focus.round, 2);
  assert.equal(focus.nextMatch.id, 'r3');
});

test('late results from older rounds keep focus on the latest round through the season end', () => {
  const matches = [finished(11, 'r11'), finished(1, 'late-result'), scheduled(2, 'postponed')];
  assert.deepEqual(getMatchdayFocus(matches), { currentRound: 11, round: 11, nextMatch: undefined });
});

const rounds = [
  { number: 5, dateLabel: '26.10.2020. - 1.11.2026.' },
  { number: 6, dateLabel: '2.11.2026. - 8.11.2026.' },
  { number: 7, dateLabel: '9.11.2026. - 15.11.2026.' },
  { number: 8, dateLabel: '16.11.2026. - 22.11.2026.' },
  { number: 10, dateLabel: 'TBD' },
];

test('the current matchday follows the dates when no results are in yet for the running round', () => {
  const matches = [finished(5, 'r5'), scheduled(6, 'r6'), scheduled(7, 'r7a'), scheduled(7, 'r7b')];
  const at = iso => ({ rounds, now: new Date(iso) });
  assert.equal(getMatchdayFocus(matches, null, at('2026-11-10T09:00:00Z')).currentRound, 7);
  assert.equal(getMatchdayFocus(matches, null, at('2026-11-09T00:30:00+01:00')).currentRound, 7);
  assert.equal(getMatchdayFocus(matches, null, at('2026-11-08T23:30:00Z')).currentRound, 7); // already Monday 9.11. in Belgrade
  assert.equal(getMatchdayFocus(matches, null, at('2026-11-08T12:00:00Z')).currentRound, 6);
  assert.equal(getMatchdayFocus(matches, null, at('2026-11-10T09:00:00Z')).nextMatch.id, 'r7a');
});

test('a later round with results wins over the date, and unreadable dates fall back to results', () => {
  const matches = [finished(5, 'r5'), finished(8, 'r8')];
  assert.equal(getMatchdayFocus(matches, null, { rounds, now: new Date('2026-11-10T09:00:00Z') }).currentRound, 8);
  assert.equal(getMatchdayFocus([finished(5, 'r5')], null, { rounds: [{ number: 6, dateLabel: 'TBD' }], now: new Date('2026-11-10T09:00:00Z') }).currentRound, 5);
});

test('between rounds the last started round stays current, and before the first round it is matchday 1', () => {
  assert.equal(getMatchdayFocus([], null, { rounds, now: new Date('2026-12-30T12:00:00Z') }).currentRound, 8);
  assert.equal(getMatchdayFocus([], null, { rounds, now: new Date('2026-10-01T12:00:00Z') }).currentRound, 1);
});
