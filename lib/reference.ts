import "server-only";
import { cache } from "react";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { htmlToDOM, Element, type DOMNode } from "html-react-parser";
import routeData from "@/reference/routes.json";
import assetData from "@/public/asset-manifest.json";

export type Locale = "en" | "es";
export const routes = routeData;
export const routeByPath = new Map(routes.map(route => [route.route, route]));
export const localeForPath = (pathname: string): Locale => pathname === "/es" || pathname.startsWith("/es/") ? "es" : "en";

export function findElement(nodes: DOMNode[], predicate: (element: Element) => boolean): Element | undefined {
  for (const node of nodes) {
    if (!("attribs" in node)) continue;
    if (predicate(node)) return node;
    const found = findElement(node.children as DOMNode[], predicate);
    if (found) return found;
  }
}

/** Read content as server data. Original scripts and Flight payloads never render. */
export const readReference = cache(async (pathname: string) => {
  const route = routeByPath.get(pathname);
  if (!route) return null;
  const html = await readFile(path.join(process.cwd(), "reference/pages", route.document.replace(/^reference\/pages\//, "")), "utf8");
  const dom = htmlToDOM(html);
  const body = findElement(dom, element => element.name === "body");
  return { route, body: body?.children as DOMNode[] ?? [], locale: localeForPath(pathname) };
});

export function localAsset(value: string) {
  if (value.startsWith("/_next/image?")) {
    const source = new URL(value, "https://local.invalid").searchParams.get("url") ?? "";
    const mappings = assetData.imageSources as Record<string, string | { path?: string; localPath?: string }>;
    const mapped = mappings[source];
    const target = typeof mapped === "string" ? mapped : mapped?.path ?? mapped?.localPath;
    return target ? "/" + target.replace(/^public\//, "").replace(/^\//, "") : source;
  }
  if (value.startsWith("/_next/static/")) return value.replace("/_next/static/", "/reference-assets/static/").split("?")[0];
  if (/^https?:\/\/(www\.)?weevolveit\.com\//.test(value)) return value.replace(/^https?:\/\/(www\.)?weevolveit\.com/, "");
  return value;
}
