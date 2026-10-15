import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { readFile } from 'node:fs/promises';
import { createServer } from 'node:net';
import { after, before, test } from 'node:test';

let server;
let base;
let output = '';
const routes = JSON.parse(await readFile(new URL('../reference/routes.json', import.meta.url), 'utf8'));

before(async () => {
  const probe = createServer();
  probe.listen(0, '127.0.0.1');
  await once(probe, 'listening');
  const port = probe.address().port;
  await new Promise(resolve => probe.close(resolve));
  base = `http://127.0.0.1:${port}`;
  server = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '--hostname', '127.0.0.1', '--port', String(port)], { cwd: process.cwd(), stdio: ['ignore', 'pipe', 'pipe'] });
  server.stdout.on('data', chunk => { output += chunk; });
  server.stderr.on('data', chunk => { output += chunk; });
  for (let attempt = 0; attempt < 100; attempt++) {
    if (server.exitCode !== null) throw new Error(`Next exited: ${output}`);
    try { if ((await fetch(`${base}/local/health`)).ok) return; } catch {}
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw new Error(`Next did not start: ${output}`);
});
after(() => { server?.kill('SIGTERM'); });

test('the production server is the Next application with the complete route inventory', async () => {
  const health = await (await fetch(`${base}/local/health`)).json();
  assert.deepEqual(health, { ok: true, mode: 'offline', framework: 'next', routes: 307 });
});

test('all archived content routes are real prerendered Next pages', async () => {
  const pending = [...routes];
  await Promise.all(Array.from({ length: 8 }, async () => {
    while (pending.length) {
      const entry = pending.shift();
      const response = await fetch(base + entry.route);
      assert.equal(response.status, 200, entry.route);
      const body = await response.text();
      if (entry.route === '/llms.txt') {
        assert.match(response.headers.get('content-type'), /text\/plain/);
        assert.match(body, /WeEvolveIT/);
        continue;
      }
      assert.match(body, /<html\b/, entry.route);
      assert.match(body, /<main\b/, entry.route);
      assert.doesNotMatch(body, /<script[^>]+src="\/reference-assets\//, entry.route);
      assert.doesNotMatch(body, /<script[^>]+src="\/local\/runtime\.js/, entry.route);
    }
  }));
});

test('home renders owned React content and separates design assets from Next runtime', async () => {
  const response = await fetch(base);
  const body = await response.text();
  assert.match(body, /Your tech partner\. Evolved\./);
  assert.match(body, /data-hero-title/);
  assert.match(body, /data-diagnosis-step="pain"/);
  assert.match(body, /\/reference-assets\/static\/chunks\/0n2~1o2-mvux1.css/);
  assert.match(body, /<script[^>]+src="\/_next\/static\//);
  const stylesheet = await fetch(`${base}/reference-assets/static/chunks/0n2~1o2-mvux1.css`);
  assert.match(stylesheet.headers.get('content-type'), /text\/css/);
  assert.equal((await fetch(`${base}/route-that-does-not-exist`)).status, 404);
});

test('lead forms validate locally without delivering or persisting messages', async () => {
  const send = body => fetch(`${base}/api/lead`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  assert.equal((await send({ email: 'invalid' })).status, 400);
  const accepted = await (await send({ email: 'example@example.com' })).json();
  assert.equal(accepted.local, true);
  assert.equal(accepted.delivered, false);
  assert.equal((await fetch(`${base}/api/unknown`, { method: 'POST' })).status, 503);
});
