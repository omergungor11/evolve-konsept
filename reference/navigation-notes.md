# Mirrored document behavior

`routes.json` is an array of document records. `route` is the request pathname;
`document` is relative to the repository root. Each record retains the HTTP
status, final source URL, content type, title, size, linked local routes, and
server-rendered form/field metadata. `route-analysis.json` records external
destinations and routes beyond the bounded crawl.

The capture follows all discovered internal page links in both English and
Spanish, including navigation, services, legal pages, search, articles,
categories, and case studies. `pageCount` and `unmirroredRoutes` in the route
analysis report record the final coverage.

The HTML files are the original response bytes, including Next.js hydration
payloads. The homepage is copied directly from `/tmp/weevolveit-reference.html`.
The crawler only issues GET requests and reuses successful cached documents.
It starts with the existing captures plus the English/Spanish homepage and
search routes, and follows page links until none remain, with a default cap of
600 documents. API and static asset URLs are excluded. Re-run
`python3 scripts/mirror-pages.py` to fetch missing or failed documents while
retaining successful captures.

## Local navigation

Preserve scripts, styles, images, and embedded Next payloads. Capture same-origin
page-link clicks before Next's client router and perform a full document load.
Keep same-page anchors, modified clicks, downloads, and external destinations
working normally. Returning HTML to a Next RSC request is insufficient because
the router expects the RSC wire format; full document navigation avoids that
protocol mismatch while allowing each saved page to hydrate normally. Language
switches may be client-side router operations rather than anchors and require
the same document-navigation treatment.

## Interactive dependencies

- Header search is a hydrated form without a native HTML action. `/search` and
  `/es/search` include the full search index in their hydration data. Chunk
  `17bn428razyke.js` filters titles/descriptions and type tabs locally without an
  API. Saved pages contain an empty `initialQuery` prop; a local compatibility
  layer must read `?q=` into the hydrated search input or patch that prop safely.
- Homepage and `/ai-business-check` run a multi-step browser interaction. The
  final lead request posts to `/api/lead` with `source: "home-diagnosis"`, email,
  phone, optional name/company/URL, and the selected pain/WhatsApp opt-in message.
- `/contact` initially renders the name step of a multi-step form. Other fields
  appear after hydration and progression.
- `/ai-check` initially exposes a website URL input. `/seo-check` is also an
  interactive audit tool; original backend behavior needs an explicit local
  implementation to produce results.
- Mirrored audit chunks request `GET /api/pagespeed?url=...&strategy=...` and
  `GET /api/ai-visibility?url=...`; the audit and contact flows also use
  `POST /api/lead`.
- A shared client chunk fetches `https://ipapi.co/json/` for city/region metadata.
- Additional page-specific API dependencies can be read from mirrored chunks;
  no form submissions or API mutations were made during document collection.

## External destinations

Homepage links lead to WhatsApp (`wa.me/19562721609`), `hello@weevolveit.com`,
WeEvolveIT's LinkedIn, Instagram, Facebook and TikTok profiles, and its Awwwards
listing. Some pages additionally link `sales@weevolveit.com` and external article
sources. Exact destinations are retained in `route-analysis.json`.
