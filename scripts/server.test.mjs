import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from '../server.mjs';
import {readFile} from 'node:fs/promises';
const routes = JSON.parse(await readFile(new URL('../reference/routes.json',import.meta.url),'utf8'));
const assets = JSON.parse(await readFile(new URL('../public/asset-manifest.json',import.meta.url),'utf8'));
let server;
let origin;
test.before(async () => {
  server = createServer();
  await new Promise(resolve => server.listen(0,'127.0.0.1',resolve));
  origin = `http://127.0.0.1:${server.address().port}`;
});
test.after(() => new Promise(resolve => server.close(resolve)));
test('homepage preserves hydration and loads the local integration before application bundles', async () => {
  const response = await fetch(origin);
  const html = await response.text();
  assert.equal(response.status,200);
  assert.ok(html.includes('self.__next_f'));
  assert.ok(html.indexOf('/local/runtime.js') < html.indexOf('/_next/static/chunks/'));
  assert.match(response.headers.get('content-security-policy'), /connect-src 'self'/);
  assert.doesNotMatch(html, /<link\b[^>]*https:\/\/ipapi\.co/);
});
test('backend actions are explicitly local and never forwarded', async () => {
  const response = await fetch(`${origin}/api/contact`, {method:'POST',headers:{'Content-Type':'application/json'},body:'{"name":"Test"}'});
  assert.equal(response.status,503);
  const json = await response.json();
  assert.equal(json.local,true);
  assert.equal(json.success,false);
});
test('unknown routes produce an honest local 404', async () => {
  const response = await fetch(`${origin}/route-that-is-not-saved`);
  assert.equal(response.status,404);
  assert.match(await response.text(),/local replica/);
});
test('local health endpoint reports mirrored routes', async () => {
  const data = await (await fetch(`${origin}/local/health`)).json();
  assert.equal(data.mode,'offline');
  assert.ok(data.routes > 0);
});
test('globe country data is served locally as usable GeoJSON', async () => {
  const response = await fetch(`${origin}/data/ne_110m_admin_0_countries.geojson`);
  assert.equal(response.status,200);
  const data = await response.json();
  assert.equal(data.type,'FeatureCollection');
  assert.ok(data.features.length > 100);
  assert.ok(data.features.every(feature => feature.geometry?.coordinates));
});
test('search routes preserve the full local index and initialize URL queries after hydration', async () => {
  for (const route of ['/search?q=automation','/es/search?q=automatizacion']) {
    const response = await fetch(origin + route);
    assert.equal(response.status,200);
    assert.match(await response.text(), /initialQuery/);
  }
  const response = await fetch(`${origin}/_next/static/chunks/17bn428razyke.js`);
  assert.equal(response.status,200);
  assert.match(await response.text(), /URLSearchParams\(window\.location\.search\)/);
});

test('every saved route serves its document with local hydration integration', async () => {
  for (const route of routes) {
    const response = await fetch(origin + route.route);
    assert.equal(response.status,200,route.route);
    const body = await response.text();
    assert.ok(body.length > 0,route.route);
    if (route.contentType.startsWith('text/html')) {
      assert.match(response.headers.get('content-type'),/^text\/html/,route.route);
      assert.ok(body.includes('/local/runtime.js'),route.route);
    }
  }
});
test('every mirrored asset is served without an HTML fallback', async () => {
  for (const asset of assets.assets) {
    const response = await fetch(origin + asset.path,{method:'HEAD'});
    assert.equal(response.status,200,asset.path);
    assert.ok(Number(response.headers.get('content-length')) > 0,asset.path);
    assert.doesNotMatch(response.headers.get('content-type'),/^text\/html/,asset.path);
  }
});
test('every optimizer image source resolves to a local image', async () => {
  for (const source of Object.keys(assets.imageSources)) {
    const response = await fetch(origin + '/_next/image?' + new URLSearchParams({url:source,w:'640',q:'75'}),{method:'HEAD'});
    assert.equal(response.status,200,source);
    assert.match(response.headers.get('content-type'),/^image\//,source);
  }
});
