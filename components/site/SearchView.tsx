"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import englishItems from "./data/en-items.json";
import spanishItems from "./data/es-items.json";
import english from "./data/en-messages.json";
import spanish from "./data/es-messages.json";

type ResultType = "service" | "industry" | "case" | "blog" | "page";
const types: ResultType[] = ["service", "industry", "case", "blog", "page"];
const typeLabels = { service: "typeService", industry: "typeIndustry", case: "typeCase", blog: "typeBlog", page: "typePage" } as const;

/** Search's content index is ordinary local data; no production scripts are loaded. */
export function SearchView({ locale = "en", initialQuery = "" }: { locale?: string; initialQuery?: string }) {
  const copy = (locale === "es" ? spanish : english).search;
  const items = locale === "es" ? spanishItems : englishItems;
  const searchParams = useSearchParams();
  const currentQuery = searchParams.get("q") ?? initialQuery;
  const [query, setQuery] = useState(initialQuery);
  const [type, setType] = useState("all");
  useEffect(() => { setQuery(currentQuery); setType("all"); }, [currentQuery]);
  const matching = useMemo(() => {
    const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    return items.filter(item => words.every(word => `${item.title} ${item.description}`.toLowerCase().includes(word)));
  }, [items, query]);
  const available = types.filter(value => matching.some(item => item.type === value));
  const results = matching.filter(item => type === "all" || item.type === type);
  const changeQuery = (value: string) => {
    setQuery(value);
    setType("all");
    const url = new URL(window.location.href);
    if (value) url.searchParams.set("q", value); else url.searchParams.delete("q");
    window.history.replaceState(null, "", url.pathname + url.search);
  };
  return <main id="main-content" className="mx-auto max-w-[1400px] px-6 pb-24 pt-32">
    <div className="text-center"><p className="font-mono text-label uppercase text-fg-muted [letter-spacing:var(--tracking-label)]">{copy.eyebrow}</p><h1 className="mx-auto mt-6 max-w-[22ch] font-display text-display-l font-extrabold text-fg">{copy.h1}</h1></div>
    <div className="relative mx-auto mt-10 max-w-[680px]">
      <span aria-hidden="true" className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-fg-muted"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg></span>
      <input autoFocus type="search" aria-label={copy.eyebrow} value={query} onChange={event => changeQuery(event.target.value)} placeholder={copy.placeholder} className="w-full rounded-full border-hairline bg-white/[0.03] py-4 pl-14 pr-5 font-mono text-body text-fg outline-none transition-colors placeholder:text-fg-muted focus:border-hairline-strong focus:bg-white/[0.05]" />
    </div>
    {available.length > 0 && <div className="mt-7 flex flex-wrap items-center justify-center gap-2">{["all", ...available].map(value => <button key={value} type="button" aria-pressed={type === value} onClick={() => setType(value)} className={`rounded-full border px-4 py-2 font-mono text-label-s uppercase transition-colors duration-200 [letter-spacing:var(--tracking-label-tight)] ${type === value ? "border-transparent bg-fg text-bg" : "border-[color:var(--color-border)] text-fg/60 hover:text-fg"}`}>{value === "all" ? copy.all : copy[typeLabels[value as ResultType]]}</button>)}</div>}
    <p aria-live="polite" className="mt-8 text-center font-mono text-label-s uppercase text-fg-muted [letter-spacing:var(--tracking-label-tight)]">{copy.resultsCount.replace("{count}", String(results.length))}</p>
    {results.length === 0 ? <div className="mt-12 text-center"><p className="font-mono text-body text-fg">{copy.noResults.replace("{query}", query.trim())}</p><p className="mt-2 font-mono text-body-sm text-fg-secondary">{copy.noResultsHint}</p></div> : <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{results.map(item => <li key={`${item.type}-${item.href}`}><Link href={locale === "es" && !item.href.startsWith("/es") ? `/es${item.href === "/" ? "" : item.href}` : item.href} className="group flex h-full flex-col overflow-hidden rounded-xl border-hairline bg-white/[0.015] transition-colors duration-300 hover:border-hairline-strong hover:bg-white/[0.04]">
      <div className="relative aspect-[16/10] overflow-hidden">{item.image ? <img src={item.image} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.05]"/> : <div aria-hidden="true" className="absolute inset-0 grid place-items-center bg-bg font-display text-display-s font-bold text-fg/40" style={{backgroundImage:"radial-gradient(rgba(240,240,248,.1) 1px, transparent 1px)",backgroundSize:"16px 16px"}}><span>WeEvolve<span className="text-accent/70">IT</span></span></div>}<span className="absolute left-3 top-3 rounded-full border-hairline bg-bg/70 px-2.5 py-1 font-mono text-label-s uppercase text-fg/80 backdrop-blur-sm [letter-spacing:var(--tracking-label-tight)]">{copy[typeLabels[item.type as ResultType]]}</span></div>
      <div className="flex flex-1 flex-col p-5"><h3 className="font-display text-display-s font-bold text-fg transition-colors group-hover:text-accent [text-wrap:balance]">{item.title}</h3>{item.description && <p className="mt-2 line-clamp-2 font-mono text-body-sm text-fg-secondary">{item.description}</p>}</div>
    </Link></li>)}</ul>}
  </main>;
}
