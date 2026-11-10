import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { renderToStaticMarkup, renderToPipeableStream } from 'react-dom/server';
import { createElement, Suspense, use } from 'react';
import { PassThrough } from 'node:stream';
import { runnerImport } from 'vite';
import seed from '../data/league.json' with { type: 'json' };
import { getMatchdayFocus } from '../lib/matchday.mjs';

test('streams a loading shell while waiting, then renders current data without the old matchday', async t => {
  const key = Symbol.for('it-liga.workbook-sync');
  const previous = globalThis[key];
  t.after(() => {
    if (previous === undefined) delete globalThis[key];
    else globalThis[key] = previous;
  });

  const currentRound = getMatchdayFocus(seed.matches).currentRound + 1;
  const refreshed = structuredClone(seed);
  // Dates would make the focus depend on today's date; this test is about results moving the focus.
  refreshed.rounds = refreshed.rounds.map(round => ({ ...round, dateLabel: 'TBD' }));
  refreshed.matches.push(
    { ...seed.matches[0], id: 'new-result', round: currentRound, status: 'finished', homeScore: 0, awayScore: 0 },
    { ...seed.matches[1], id: 'new-fixture', round: currentRound, status: 'scheduled', homeScore: null, awayScore: null },
  );
  if (!refreshed.rounds.some(round => round.number === currentRound)) {
    refreshed.rounds.push({ ...seed.rounds[0], number: currentRound });
  }
  const now = new Date().toISOString();
  const initialData = { ...refreshed, sync: { checkedAt: now, lastSuccessfulAt: now, nextCheckAt: new Date(Date.now() + 600_000).toISOString(), intervalMs: 600_000, status: 'connected', message: null } };
  let completeRefresh;
  globalThis[key] = { cached: seed, inFlight: new Promise(resolve => { completeRefresh = resolve; }) };

  // Load the real server page and client component without starting an HTTP server.
  const { module: { default: Page, dynamic } } = await runnerImport('./app/page.tsx', {
    root: fileURLToPath(new URL('..', import.meta.url)), configFile: false, logLevel: 'silent',
  });
  assert.equal(dynamic, 'force-dynamic');
  let rendered = false;
  const pending = Page().then(page => { rendered = true; return page; });
  const { module: { default: Loading } } = await runnerImport('./app/loading.tsx', {
    root: fileURLToPath(new URL('..', import.meta.url)), configFile: false, logLevel: 'silent',
  });
  const output = new PassThrough();
  let streamed = '';
  output.on('data', chunk => { streamed += chunk.toString(); });
  const ended = new Promise((resolve, reject) => { output.on('end', resolve); output.on('error', reject); });
  function PendingPage() { return use(pending); }
  let stream;
  await new Promise((resolve, reject) => {
    stream = renderToPipeableStream(createElement('div', null, createElement(Suspense, { fallback: createElement(Loading) }, createElement(PendingPage))), {
      onShellReady() { stream.pipe(output); resolve(); },
      onError: reject,
    });
  });
  t.after(() => stream.abort());
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(rendered, false, 'must not render the old snapshot during an in-flight refresh');
  assert.ok(streamed.includes('hero-image'), 'the hero must be present before data is ready');
  assert.ok(streamed.includes('skeleton'), 'show placeholders while the page is suspended');
  assert.ok(streamed.includes('Loading current league data'));
  assert.ok(!streamed.includes('MATCHDAY'), 'loading must not show stale matchday data');

  completeRefresh(initialData);
  const page = await pending;
  assert.equal(page.props.initialData, initialData);
  const html = renderToStaticMarkup(page);
  assert.match(html, new RegExp(`<option(?=[^>]*value="${currentRound}")(?=[^>]*selected="")[^>]*>`));
  assert.ok(html.includes(`MATCHDAY ${currentRound}`));
  assert.ok(!html.includes(`MATCHDAY ${currentRound - 1}`));
  assert.ok(html.includes('Connected to league workbook'));
  await ended;
  assert.ok(streamed.replace(/<!--[\s\S]*?-->/g, '').includes(`MATCHDAY ${currentRound}`), 'the resolved page must replace the loading shell');
});
