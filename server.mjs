import http from 'node:http';
import {readFile, stat} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(root, 'public');
const mime = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.geojson':'application/geo+json; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.avif':'image/avif','.gif':'image/gif','.ico':'image/x-icon','.woff':'font/woff','.woff2':'font/woff2','.ttf':'font/ttf','.mp4':'video/mp4','.webm':'video/webm','.txt':'text/plain; charset=utf-8','.xml':'application/xml'};
const csp = "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' 'wasm-unsafe-eval' blob:; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self'; media-src 'self' blob:; worker-src 'self' blob:; frame-src 'self'; object-src 'none'; form-action 'self'; base-uri 'self'";
let assetCache;
async function readJson(file, fallback) { try {return JSON.parse(await readFile(file,'utf8'));} catch {return fallback;} }
async function routes() {
  // Reload during download/development so newly mirrored pages become available.
  const manifest = await readJson(path.join(root,'reference/routes.json'), {});
  const entries = Array.isArray(manifest) ? manifest : manifest.routes || [];
  return entries;
}
function safePublicPath(urlPath) {
  const file = path.resolve(publicDir, '.' + urlPath.replace(/^\/_next\/static\//, '/reference-assets/static/'));
  return file.startsWith(publicDir + path.sep) ? file : null;
}
function sanitizeHtml(html) {
  return html
    .replace(/<link\b[^>]*(?:https:\/\/www\.googletagmanager\.com|https:\/\/ipapi\.co)[^>]*>/gi, '')
    .replace(/<script\b[^>]*src=["'][^"']*(?:googletagmanager|google-analytics)[^"']*["'][^>]*>[\s\S]*?<\/script>/gi, '')
    .replace('<head>', '<head><script src="/local/runtime.js"></script>');
}
async function sendFile(req, res, file, options={}) {
  const info = await stat(file);
  if (!info.isFile()) throw new Error('Not a file');
  let data = await readFile(file);
  const type = options.type || mime[path.extname(file).toLowerCase()] || 'application/octet-stream';
  if (type.startsWith('text/html')) data = Buffer.from(sanitizeHtml(data.toString()));
  // Search's server-provided initialQuery is empty in the saved HTML. Initialize
  // from the actual local URL after hydration so React's first render still agrees.
  if (path.basename(file) === '17bn428razyke.js') {
    data = Buffer.from(data.toString().replace(
      'w=e=>h(c[e]);return(0,t.jsxs)(t.Fragment',
      'w=e=>h(c[e]);(0,r.useEffect)(()=>{const q=new URLSearchParams(window.location.search).get("q");if(q!==null)m(q)},[]);return(0,t.jsxs)(t.Fragment'
    ));
  }
  // Observe the stationary testimonial viewport. Observing its translated track
  // stops the ticker after one viewport width, even while cards remain visible.
  if (path.basename(file) === '0mc1t21lq~25w.js') {
    data = Buffer.from(data.toString().replace(
      'f.observe(t);let v=()=>{c=!0}',
      'f.observe(t.parentElement);let v=()=>{c=!0}'
    ));
  }
  res.writeHead(options.status || 200, {'Content-Type':type,'Content-Length':data.length,'Cache-Control':'no-cache','X-Content-Type-Options':'nosniff','Content-Security-Policy':csp});
  res.end(req.method === 'HEAD' ? undefined : data);
}
export function createServer() {
  return http.createServer(async (req,res) => {
    try {
      const url = new URL(req.url, 'http://localhost');
      const pathname = decodeURIComponent(url.pathname);
      if (pathname === '/local/health') {
        res.writeHead(200, {'Content-Type':'application/json'});
        return res.end(JSON.stringify({ok:true, mode:'offline', routes:(await routes()).length}));
      }
      if (pathname.startsWith('/api/') || pathname === '/local/blocked') {
        // Deliberately never forward a request or user data to the live service.
        res.writeHead(503, {'Content-Type':'application/json'});
        return res.end(JSON.stringify({success:false,local:true,error:'This feature uses a live service. The local replica does not send data externally.'}));
      }
      if (!['GET','HEAD'].includes(req.method)) {
        res.writeHead(405, {'Allow':'GET, HEAD','Content-Type':'text/plain'});
        return res.end('Local replica: submissions are disabled.');
      }
      if (pathname === '/_next/image') {
        const source = url.searchParams.get('url') || '';
        assetCache = await readJson(path.join(publicDir,'asset-manifest.json'), {});
        const mapped = assetCache.imageSources?.[source];
        const mappedPath = typeof mapped === 'string' ? mapped : mapped?.path || mapped?.localPath;
        const imageFile = mappedPath ? safePublicPath('/' + mappedPath.replace(/^public\//,'').replace(/^\//,'')) : source.startsWith('/') ? safePublicPath(new URL(source, 'http://localhost').pathname) : null;
        if (imageFile) return await sendFile(req,res,imageFile);
        res.writeHead(404); return res.end('Image was not mirrored.');
      }
      const staticFile = safePublicPath(pathname);
      if (staticFile && existsSync(staticFile) && (await stat(staticFile)).isFile()) return await sendFile(req,res,staticFile);
      const normalized = pathname.replace(/\/$/,'') || '/';
      const route = (await routes()).find(entry => (entry.route || entry.path) === normalized);
      if (route) {
        const document = route.document || route.file || route.localPath;
        if (document) return await sendFile(req,res,path.resolve(root,document));
      }
      console.warn(`Unmirrored request: ${req.method} ${url.pathname}`);
      res.writeHead(404, {'Content-Type':'text/html; charset=utf-8'});
      res.end('<!doctype html><html lang="en"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Page unavailable</title><body style="margin:0;background:#111513;color:#f7f7f1;font:18px system-ui;padding:10vw"><h1>Page unavailable in the local replica</h1><p>This address is not part of the saved website.</p><a style="color:#e0fd60" href="/">Back to home</a></body></html>');
    } catch (error) {
      console.warn(`Request failed: ${req.url}: ${error.message}`);
      if (!res.headersSent) res.writeHead(404, {'Content-Type':'text/plain'});
      res.end('Local asset unavailable.');
    }
  });
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const portArg = process.argv.indexOf('--port');
  const port = Number(portArg >= 0 ? process.argv[portArg+1] : process.env.PORT || 3000);
  createServer().listen(port,'0.0.0.0',() => console.log(`WeEvolveIT local replica → http://localhost:${port}`));
}
