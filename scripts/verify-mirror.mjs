import {readFile, readdir, stat} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const entries = JSON.parse(await readFile(path.join(root,'reference/routes.json'),'utf8'));
const routes = Array.isArray(entries) ? entries : entries.routes;
const manifest = JSON.parse(await readFile(path.join(root,'public/asset-manifest.json'),'utf8'));
const missing = new Set();
const checked = new Set();
let references = 0;
const routePaths = new Set(routes.map(entry => entry.route));
const assetExtension = /\.(?:js|css|woff2?|ttf|otf|png|jpe?g|webp|avif|gif|svg|ico|mp4|webm|mov|mp3|ogg|wav|pdf|txt|json|geojson|wasm)$/i;
const unescape = value => value.replaceAll('&amp;', '&').replaceAll('&#x26;', '&').replaceAll('&#38;', '&');
for (const entry of routes) {
  for (const link of entry.internalLinks || []) {
    if (!routePaths.has(link)) missing.add(`route: ${link} (linked from ${entry.route})`);
  }
}
async function check(asset) {
  references++;
  if (checked.has(asset)) return;
  checked.add(asset);
  try {if (!(await stat(path.join(root,'public',asset.replace(/^\/?_next\//, 'reference-assets/')))).isFile()) missing.add(asset);} catch {missing.add(asset);}
}
async function checkUrl(value, base='https://weevolveit.com/') {
  if (value.startsWith('static/')) value = '/_next/' + value;
  let url;
  try {url = new URL(unescape(value), base);} catch {return;}
  if (!['weevolveit.com','www.weevolveit.com'].includes(url.hostname)) return;
  if (url.pathname === '/_next/image') {
    const source = url.searchParams.get('url');
    const mapped = manifest.imageSources[source];
    const target = typeof mapped === 'string' ? mapped : mapped?.path || mapped?.localPath;
    if (target) return check(target);
    if (source?.startsWith('/')) return check(decodeURIComponent(new URL(source, base).pathname));
    missing.add(`unmapped image: ${source}`);
  } else if (assetExtension.test(url.pathname) && !routePaths.has(url.pathname)) {
    await check(decodeURIComponent(url.pathname));
  }
}
for (const entry of routes) {
  if (entry.status !== 200) {missing.add(`page: ${entry.route} (status ${entry.status})`); continue;}
  let document;
  try {document = await readFile(path.join(root,entry.document));} catch {missing.add(`document: ${entry.document}`); continue;}
  if (document.length !== entry.bytes) missing.add(`document size: ${entry.document}`);
  const html = document.toString();
  // Inspect every resource attribute, including optimizer URLs and responsive images.
  for (const match of html.matchAll(/\b(src|href|poster|srcset|imagesrcset)=["']([^"']+)["']/gi)) {
    const values = match[1].toLowerCase().endsWith('srcset') ? match[2].split(',').map(item => item.trim().split(/\s+/)[0]) : [match[2]];
    for (const value of values) await checkUrl(value, entry.url);
  }
  // Streamed React payloads may divide an image URL between successive chunks.
  const payloads = [...html.matchAll(/self\.__next_f\.push\(\[1,("(?:\\.|[^"\\])*")\]\)/g)].map(match => JSON.parse(match[1])).join('');
  for (const match of payloads.matchAll(/["']((?:\/|static\/)[^"'\s\\]+\.(?:js|css|woff2?|ttf|otf|png|jpe?g|webp|avif|gif|svg|ico|mp4|webm|json|geojson|wasm)(?:\?[^"'\s\\]*)?)["']/g)) await checkUrl(match[1],entry.url);
}
const chunks = path.join(root,'public/reference-assets/static/chunks');
for (const file of await readdir(chunks)) {
  const source = await readFile(path.join(chunks,file),'utf8');
  if (file.endsWith('.js')) {
    for (const match of source.matchAll(/fetch\(["'](\/data\/[^"']+)["']/g)) await checkUrl(match[1]);
    for (const match of source.matchAll(/["']((?:\/_next\/)?static\/(?:chunks|media)\/[a-zA-Z0-9_.~/-]+)["']/g)) await checkUrl(match[1]);
    for (const match of source.matchAll(/["']((?:\/|\.\/|\.\.\/)[^"'\s\\]+\.(?:png|jpe?g|webp|avif|gif|svg|ico|mp4|webm|json|geojson|wasm))["']/g)) await checkUrl(match[1],`https://weevolveit.com/_next/static/chunks/${file}`);
  }
  if (file.endsWith('.css')) {
    for (const match of source.matchAll(/url\(\s*["']?([^\s"'()]+)["']?\s*\)/g)) await checkUrl(match[1],`https://weevolveit.com/_next/static/chunks/${file}`);
  }
}
for (const target of Object.values(manifest.imageSources)) await check(typeof target === 'string' ? target : target.path || target.localPath);
for (const asset of manifest.assets) {
  await check(asset.path);
  if (missing.has(asset.path)) continue;
  const bytes = await readFile(path.join(root,'public',asset.path.replace(/^\/?_next\//, 'reference-assets/')));
  if (bytes.length !== asset.bytes || createHash('sha256').update(bytes).digest('hex') !== asset.sha256) missing.add(`asset integrity: ${asset.path}`);
}
if (manifest.assetCount !== manifest.assets.length || manifest.totalBytes !== manifest.assets.reduce((total,asset) => total + asset.bytes,0)) missing.add('asset manifest totals');
if (Object.keys(manifest.errors || {}).length) missing.add(`asset download errors: ${JSON.stringify(manifest.errors)}`);
if (missing.size) {
  console.error(`${missing.size} missing or invalid dependencies:\n${[...missing].join('\n')}`);
  process.exitCode = 1;
} else {
  console.log(`Verified ${routes.length} saved pages, ${manifest.assets.length} asset hashes, and ${references} resource references (${checked.size} unique files).`);
}
