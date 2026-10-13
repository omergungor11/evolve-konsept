#!/usr/bin/env python3
"""Mirror the reference site's public assets and recursively follow JS/CSS refs.

Run after mirror-pages.py to include all saved route documents. The local server
can serve /_next/image by looking up its decoded `url` in imageSources, or by
serving the original first-party image from public/<url>.
"""
import argparse
import concurrent.futures
import hashlib
import html
from html.parser import HTMLParser
import json
import mimetypes
from pathlib import Path
import re
import shutil
import subprocess
import time
from urllib.parse import parse_qs, unquote, urlencode, urljoin, urlsplit
from urllib.request import Request, urlopen

ORIGIN = "https://weevolveit.com"
ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public"
EXTENSIONS = re.compile(r"\.(?:js|css|woff2?|ttf|otf|png|jpe?g|webp|avif|gif|svg|ico|mp4|webm|mov|mp3|ogg|wav|pdf|txt|json|geojson|wasm)$", re.I)
ASSET_REF = re.compile(r'''(?<![\w./-])(?:https?://[\w./~%?&=:+!@-]+|(?:/_next/|/images/|/logos/|/brand/|/fonts/|/videos/|/media/|/assets/|/data/)[\w./~%?&=:+!@-]+|(?:static/(?:chunks|media)/)[\w./~%?&=:+!@-]+)''')
QUOTED_REF = re.compile(r'''["']((?:/|\./|\.\./|static/)[\w./~%?&=:+!@-]+\.(?:js|css|woff2?|png|jpe?g|webp|avif|svg|mp4|webm|json|geojson|wasm)(?:\?[\w./~%?&=:+!@-]*)?)["']''')
RSC_CHUNK = re.compile(r'''self\.__next_f\.push\(\[1,("(?:\\.|[^"\\])*")\]\)''')


class References(HTMLParser):
    def __init__(self):
        super().__init__()
        self.values = []

    def handle_starttag(self, tag, attrs):
        for key, value in attrs:
            if not value:
                continue
            if key in ("src", "href", "poster"):
                self.values.append(value)
            elif key in ("srcset", "imagesrcset"):
                self.values.extend(item.strip().split()[0] for item in value.split(",") if item.strip())


def references(text, is_html=False):
    original = text
    if is_html:
        # React streams can split URLs at arbitrary character boundaries. Join
        # those JSON string payloads before inspecting their asset references.
        chunks = RSC_CHUNK.findall(text)
        text = RSC_CHUNK.sub("", text) + "\n" + "".join(json.loads(chunk) for chunk in chunks)
    text = html.unescape(text).replace('\\"', '"').replace("\\/", "/").replace("\\u0026", "&")
    result = set(ASSET_REF.findall(text))
    result.update(QUOTED_REF.findall(text))
    result.update(re.findall(r'''url\(\s*["']?([^)'"\s]+)''', text))
    if is_html:
        parser = References()
        # Parse the untouched HTML: unescaping embedded RSC text before parsing
        # can make ordinary quoted prose look like synthetic HTML attributes.
        parser.feed(original)
        result.update(parser.values)
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--html", action="append", default=[])
    parser.add_argument("--workers", type=int, default=10)
    parser.add_argument("--max-assets", type=int, default=1500)
    args = parser.parse_args()
    PUBLIC.mkdir(exist_ok=True)
    manifest_path = PUBLIC / "asset-manifest.json"
    previous = json.loads(manifest_path.read_text()) if manifest_path.exists() else {}
    records = {item["path"]: item for item in previous.get("assets", []) if not item["path"].startswith("/local/")}
    image_sources = previous.get("imageSources", {})
    errors, seen, queue = {}, set(), {}

    def enqueue(raw, base=ORIGIN + "/"):
        raw = html.unescape(raw).strip().rstrip(",;)")
        if raw.startswith("static/"):
            raw = "/_next/" + raw
        if raw.startswith(("data:", "#", "mailto:", "tel:")) or any(token in raw for token in ("${", "googletagmanager", "google-analytics", "/_vercel/", "/_next-live/", "/local/")):
            return
        absolute = urljoin(base, raw)
        parts = urlsplit(absolute)
        if parts.hostname not in ("weevolveit.com", "www.weevolveit.com"):
            return
        if parts.path == "/_next/image":
            source = parse_qs(parts.query).get("url", [""])[0]
            if not source:
                return
            if source.startswith("/") or urlsplit(source).hostname in ("weevolveit.com", "www.weevolveit.com"):
                image_sources[source] = urlsplit(source).path
                enqueue(source)
                return
            # Fetch external avatars through the site's own first-party optimizer.
            path = "/_mirrored/images/" + hashlib.sha256(source.encode()).hexdigest()[:24] + ".webp"
            image_sources[source] = path
            absolute = ORIGIN + "/_next/image?" + urlencode({"url": source, "w": 96, "q": 75})
        else:
            path = unquote(parts.path)
            if not EXTENSIONS.search(path) or ".." in Path(path).parts:
                return
            absolute = ORIGIN + parts.path
        if path in seen:
            return
        seen.add(path)
        queue[path] = absolute

    def fetch(item):
        path, url = item
        target = PUBLIC / path.lstrip("/")
        if target.exists() and target.stat().st_size:
            data = target.read_bytes()
            return path, url, data, records.get(path, {}).get("contentType", mimetypes.guess_type(path)[0] or "application/octet-stream"), None
        for attempt in range(3):
            try:
                request = Request(url, headers={"User-Agent": "Mozilla/5.0", "Accept": "*/*"})
                with urlopen(request, timeout=12) as response:
                    data = response.read()
                    content_type = response.headers.get("Content-Type", "application/octet-stream").split(";")[0]
                if content_type == "text/html":
                    raise ValueError("Asset URL returned HTML")
                target.parent.mkdir(parents=True, exist_ok=True)
                target.write_bytes(data)
                return path, url, data, content_type, None
            except Exception as exc:
                error = str(exc)
                # curl's connection racing avoids intermittent IPv6 stalls on
                # some hosts; urllib remains the dependency-free first choice.
                if attempt == 0 and shutil.which("curl"):
                    result = subprocess.run(["curl", "--fail", "--silent", "--show-error", "--location", "--connect-timeout", "6", "--max-time", "20", url], capture_output=True)
                    if result.returncode == 0 and not result.stdout.lstrip().lower().startswith(b"<!doctype html"):
                        data = result.stdout
                        target.parent.mkdir(parents=True, exist_ok=True)
                        target.write_bytes(data)
                        content_type = mimetypes.guess_type(path)[0] or "application/octet-stream"
                        return path, url, data, content_type, None
                if attempt < 2:
                    time.sleep(0.3 * (attempt + 1))
        return path, url, None, None, error

    sources = [Path(p) for p in args.html] or [Path("/tmp/weevolveit-reference.html")]
    sources.extend(PUBLIC.rglob("*.html"))
    sources.extend((ROOT / "reference" / "pages").rglob("*.html"))
    for source in sources:
        if source.exists():
            for ref in references(source.read_text(), True):
                enqueue(ref)
    with concurrent.futures.ThreadPoolExecutor(max_workers=args.workers) as executor:
        while queue and len(records) < args.max_assets:
            batch, queue = queue, {}
            print(f"Processing {len(batch)} assets ({len(records)} already mirrored)", flush=True)
            for path, url, data, content_type, error in executor.map(fetch, batch.items()):
                if error:
                    errors[path] = {"url": url, "error": error}
                    continue
                records[path] = {"path": path, "source": url, "bytes": len(data), "contentType": content_type, "sha256": hashlib.sha256(data).hexdigest()}
                if path.endswith((".css", ".js")):
                    for ref in references(data.decode("utf-8", errors="replace")):
                        enqueue(ref, url)
    records = {path: item for path, item in records.items() if not path.startswith("/local/")}
    manifest = {"origin": ORIGIN, "assetCount": len(records), "totalBytes": sum(item["bytes"] for item in records.values()), "assets": sorted(records.values(), key=lambda item: item["path"]), "imageSources": dict(sorted(image_sources.items())), "errors": errors}
    manifest_path.write_text(json.dumps(manifest, indent=2) + "\n")
    print(json.dumps({key: manifest[key] for key in ("assetCount", "totalBytes", "errors")}, indent=2), flush=True)


if __name__ == "__main__":
    main()
