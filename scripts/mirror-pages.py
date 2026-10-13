#!/usr/bin/env python3
"""Save public WeEvolveIT documents unchanged for the local reference server.

Only GET requests are issued. Follow internal page links to closure, with a
configurable page cap. API routes and static assets are excluded.
"""
import argparse
import concurrent.futures
import json
import urllib.error
import urllib.parse
import urllib.request
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ORIGIN = "https://weevolveit.com"


class Document(HTMLParser):
    def __init__(self, data):
        super().__init__()
        self.links, self.forms, self.fields = [], [], []
        self.title, self.in_title = "", False
        self.feed(data.decode("utf-8", errors="replace"))

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == "a" and attrs.get("href"):
            self.links.append(attrs["href"])
        elif tag == "form":
            self.forms.append(attrs)
        elif tag in ("input", "textarea", "select"):
            self.fields.append({k: v for k, v in attrs.items()
                                if k in ("name", "type", "placeholder", "required", "id")})
        elif tag == "title":
            self.in_title = True

    def handle_endtag(self, tag):
        if tag == "title":
            self.in_title = False

    def handle_data(self, data):
        if self.in_title:
            self.title += data


def local_route(link, base="/"):
    url = urllib.parse.urlsplit(urllib.parse.urljoin(ORIGIN + base, link))
    if url.scheme not in ("http", "https") or url.hostname not in ("weevolveit.com", "www.weevolveit.com"):
        return None
    route = url.path.rstrip("/") or "/"
    if route.startswith(("/api/", "/_next/")):
        return None
    if Path(route).suffix and route != "/llms.txt":
        return None
    return route


def fetch(route):
    req = urllib.request.Request(ORIGIN + route, headers={"User-Agent": "Mozilla/5.0", "Accept": "text/html"})
    try:
        with urllib.request.urlopen(req, timeout=40) as response:
            return response.status, response.read(), response.geturl(), response.headers.get("Content-Type", "")
    except urllib.error.HTTPError as error:
        return error.code, error.read(), error.geturl(), error.headers.get("Content-Type", "")
    except Exception as error:
        return 0, str(error).encode(), ORIGIN + route, "text/plain"


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--homepage", type=Path, default=Path("/tmp/weevolveit-reference.html"))
    parser.add_argument("--max-pages", type=int, default=600)
    parser.add_argument("--workers", type=int, default=6)
    args = parser.parse_args()
    entries, seen, external, omitted = [], set(), set(), set()
    old_manifest = ROOT / "reference/routes.json"
    cached = {e["route"]: e for e in json.loads(old_manifest.read_text())} if old_manifest.exists() else {}
    # Preserve all previously captured pages while expanding their link graph.
    pending = set(cached) | {"/", "/es", "/search", "/es/search"}

    def get_document(route):
        entry = cached.get(route)
        if entry and entry["status"] == 200 and (ROOT / entry["document"]).exists():
            return entry["status"], (ROOT / entry["document"]).read_bytes(), entry["url"], entry["contentType"]
        result = fetch(route)
        return fetch(route) if result[0] == 0 or result[0] >= 500 else result
    depth = 0
    while pending - seen:
        remaining = max(0, args.max_pages - len(seen))
        batch = sorted(pending - seen)
        omitted.update(batch[remaining:])
        batch = batch[:remaining]
        if not batch:
            break
        pending = set()
        with concurrent.futures.ThreadPoolExecutor(max_workers=args.workers) as pool:
            jobs = {route: pool.submit(get_document, route) for route in batch if route != "/" or not args.homepage.exists()}
            for route in batch:
                seen.add(route)
                if route == "/" and args.homepage.exists():
                    status, data, final_url, content_type = 200, args.homepage.read_bytes(), ORIGIN + "/", "text/html; charset=utf-8"
                else:
                    status, data, final_url, content_type = jobs[route].result()
                document = Document(data) if "html" in content_type else None
                relative = Path("reference/pages") / (route.strip("/") or "index")
                if route != "/llms.txt":
                    relative = Path(str(relative) + ".html")
                destination = ROOT / relative
                destination.parent.mkdir(parents=True, exist_ok=True)
                destination.write_bytes(data)
                links = sorted(set(document.links)) if document else []
                internals = sorted({r for link in links if (r := local_route(link, route))})
                for link in links:
                    if local_route(link, route) is None and not link.startswith("#"):
                        external.add(link)
                pending.update(internals)
                entries.append({"route": route, "document": str(relative), "status": status,
                                "title": document.title if document else "", "url": final_url,
                                "contentType": content_type, "bytes": len(data), "depth": depth,
                                "internalLinks": internals,
                                "forms": document.forms if document else [],
                                "fields": document.fields if document else []})
                print(f"{status} {route} ({len(data)} bytes)", flush=True)
        # Write each batch so the asset worker can begin before the crawl ends.
        (ROOT / "reference/routes.json").write_text(json.dumps(sorted(entries, key=lambda e: e["route"]), indent=2) + "\n")
        depth += 1
    all_links = {link for entry in entries for link in entry["internalLinks"]}
    report = {"origin": ORIGIN, "pageCount": len(entries), "externalDestinations": sorted(external),
              "unmirroredRoutes": sorted((all_links | omitted) - seen), "maxPages": args.max_pages,
              "notes": ["HTML bytes and Next hydration payloads are preserved unchanged.",
                        "Serve local HTML for document requests; Next RSC navigation needs separate handling.",
                        "No forms were submitted and no API mutation requests were made."]}
    (ROOT / "reference/route-analysis.json").write_text(json.dumps(report, indent=2) + "\n")


if __name__ == "__main__":
    main()
