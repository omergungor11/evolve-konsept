"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import english from "./data/en-messages.json";
import spanish from "./data/es-messages.json";

const serviceGroups = [[], ["web-development", "nearshore-software-development", "custom-software-development", "mobile-app-development", "legacy-system-modernization"], ["cloud-migration", "data-analytics", "industrial-iot", "ai-agent-development", "ai-automation"], ["digital-transformation", "erp-implementation", "crm-implementation"], ["seo", "generative-engine-optimization", "paid-media"], ["ai-agent-development", "ai-automation", "generative-engine-optimization"]];

/** Progressive interactions for the preserved semantic navigation and service cards. */
export function SiteInteractions({ locale = "en" }: { locale?: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [languageOpen, setLanguageOpen] = useState(false);
  const [cookiesOpen, setCookiesOpen] = useState(false);
  const copy = (locale === "es" ? spanish : english).cookies;
  useEffect(() => {
    document.documentElement.lang = locale;
    setLanguageOpen(false);
    const controller = new AbortController();
    const options = { signal: controller.signal };
    const header = document.querySelector<HTMLElement>("[data-nav-root]");
    if (header) { header.style.opacity = "1"; header.style.pointerEvents = "auto"; header.style.visibility = "visible"; }
    const mobile = document.getElementById("mobile-nav-panel");
    const mobileButton = header?.querySelector<HTMLButtonElement>('[aria-controls="mobile-nav-panel"]');
    const megaPanels = Array.from(header?.querySelectorAll<HTMLElement>(':scope > div > div[aria-hidden]:not(#mobile-nav-panel)') ?? []);
    const desktopTriggers = Array.from(header?.querySelectorAll<HTMLElement>('nav ul > li [aria-haspopup="true"]') ?? []);
    const morePanel = header?.querySelector<HTMLElement>("[data-dd-panel]");
    let closeTimer: ReturnType<typeof setTimeout> | undefined;
    const setPanel = (panel: HTMLElement, open: boolean) => {
      panel.style.visibility = open ? "visible" : "hidden";
      panel.style.opacity = open ? "1" : "0";
      panel.style.pointerEvents = open ? "auto" : "none";
      panel.setAttribute("aria-hidden", String(!open));
      panel.inert = !open;
      panel.querySelectorAll<HTMLElement>("a,button").forEach(item => item.tabIndex = open ? 0 : -1);
    };
    const closeMenus = () => {
      megaPanels.forEach(panel => setPanel(panel, false));
      if (morePanel) setPanel(morePanel, false);
      desktopTriggers.forEach(trigger => trigger.setAttribute("aria-expanded", "false"));
    };
    const toggleMobile = (open: boolean) => {
      if (!mobile || !mobileButton) return;
      mobile.style.height = open ? "auto" : "0px";
      mobile.style.visibility = open ? "visible" : "hidden";
      mobile.style.opacity = open ? "1" : "0";
      mobile.style.pointerEvents = open ? "auto" : "none";
      mobile.querySelectorAll<HTMLElement>(":scope > ul, :scope > ul > li").forEach(item => {
        item.style.opacity = "1";
        item.style.visibility = "visible";
        item.style.transform = "none";
      });
      mobile.setAttribute("aria-hidden", String(!open));
      mobile.inert = !open;
      mobileButton.setAttribute("aria-expanded", String(open));
      mobileButton.setAttribute("aria-label", locale === "es" ? open ? "Cerrar menú" : "Abrir menú" : open ? "Close menu" : "Open menu");
      const bars = mobileButton.querySelectorAll<HTMLElement>("span");
      if (bars[0]) { bars[0].style.translate = "none"; bars[0].style.transform = open ? "rotate(45deg)" : "translateY(-6px)"; }
      if (bars[1]) bars[1].style.opacity = open ? "0" : "1";
      if (bars[2]) { bars[2].style.translate = "none"; bars[2].style.transform = open ? "rotate(-45deg)" : "translateY(6px)"; }
    };
    closeMenus();
    toggleMobile(false);
    desktopTriggers.forEach((trigger, index) => {
      const panel = index < 3 ? megaPanels[index] : morePanel;
      if (!panel) return;
      const open = () => { clearTimeout(closeTimer); closeMenus(); trigger.setAttribute("aria-expanded", "true"); setPanel(panel, true); };
      trigger.addEventListener("mouseenter", open, options);
      trigger.addEventListener("focus", () => { if (trigger.matches(":focus-visible")) open(); }, options);
      trigger.addEventListener("click", event => {
        if (trigger instanceof HTMLAnchorElement) return;
        event.preventDefault();
        const expanded = trigger.getAttribute("aria-expanded") === "true";
        closeMenus();
        if (!expanded) open();
      }, options);
    });
    header?.addEventListener("mouseenter", () => clearTimeout(closeTimer), options);
    header?.addEventListener("mouseleave", () => { closeTimer = setTimeout(closeMenus, 180); }, options);
    header?.addEventListener("focusout", event => { if (!header.contains(event.relatedTarget as Node | null)) closeMenus(); }, options);
    mobileButton?.addEventListener("click", () => toggleMobile(mobileButton.getAttribute("aria-expanded") !== "true"), options);
    mobile?.querySelectorAll<HTMLButtonElement>("button[aria-expanded]").forEach(button => {
      const panel = button.nextElementSibling as HTMLElement | null;
      if (panel) panel.inert = button.getAttribute("aria-expanded") !== "true";
      button.addEventListener("click", () => {
      const open = button.getAttribute("aria-expanded") !== "true";
      button.setAttribute("aria-expanded", String(open));
      const chevron = button.querySelector<HTMLElement>("span");
      if (chevron) chevron.style.transform = open ? "rotate(180deg)" : "";
      const panel = button.nextElementSibling as HTMLElement | null;
      if (panel) { panel.style.maxHeight = open ? `${panel.scrollHeight}px` : "0px"; panel.inert = !open; }
    }, options);
    });
    header?.querySelectorAll<HTMLFormElement>("form").forEach(form => {
      const input = form.querySelector<HTMLInputElement>('input[type="search"]');
      if (!input) return;
      form.addEventListener("submit", event => {
        event.preventDefault();
        if (!input.value.trim()) {
          const wrap = input.parentElement!;
          wrap.style.width = matchMedia("(max-width: 767px)").matches ? "140px" : "210px";
          wrap.style.visibility = "visible"; wrap.style.opacity = "1";
          input.style.width = "100%"; input.tabIndex = 0; input.focus();
          form.querySelector("button")?.setAttribute("aria-expanded", "true");
        } else router.push(`${locale === "es" ? "/es" : ""}/search?q=${encodeURIComponent(input.value.trim())}`);
      }, options);
    });
    const language = document.querySelector<HTMLElement>('[role="group"][aria-label="Language"], [role="group"][aria-label="Idioma"]');
    language?.querySelectorAll<HTMLElement>('[style*="opacity"]').forEach(element => { if (!element.hasAttribute("aria-hidden")) element.style.opacity = "1"; });
    language?.querySelector("button")?.addEventListener("click", () => setLanguageOpen(value => !value), options);
    document.addEventListener("keydown", event => { if (event.key === "Escape") { closeMenus(); toggleMobile(false); setLanguageOpen(false); setCookiesOpen(false); } }, options);
    document.addEventListener("click", event => {
      const target = event.target as Element;
      if (!header?.contains(target)) closeMenus();
      if (!language?.contains(target) && !target.closest('[role="menu"][aria-label="Language"]')) setLanguageOpen(false);
      if (target.closest("button")?.textContent?.trim() === "Cookies") setCookiesOpen(true);
      if (target.closest("a") && mobile?.contains(target)) toggleMobile(false);
    }, options);
    // Filters keep the original service cards, image/video assets, and order.
    const main = document.querySelector("main");
    if (/\/services\/?$/.test(pathname)) {
      const buttons = Array.from(main?.querySelectorAll<HTMLButtonElement>('button[aria-pressed]:not([aria-label])') ?? []);
      const grid = main?.querySelector<HTMLUListElement>("ul:has(> li.svc-card-in)");
      buttons.forEach((button, index) => button.addEventListener("click", () => {
        buttons.forEach(other => { const active = other === button; other.setAttribute("aria-pressed", String(active)); other.classList.toggle("bg-accent/10", active); other.classList.toggle("border-accent", active); other.classList.toggle("border-hairline", !active); other.classList.toggle("text-fg", active); other.classList.toggle("text-fg-secondary", !active); });
        grid?.querySelectorAll<HTMLElement>(":scope > li").forEach(card => {
          const slug = card.querySelector("a")?.getAttribute("href")?.split("/").pop() ?? "";
          card.style.display = index === 0 || serviceGroups[index]?.includes(slug) ? "" : "none";
        });
      }, options));
      const viewButtons = Array.from(main?.querySelectorAll<HTMLButtonElement>('button[aria-pressed][aria-label]') ?? []);
      viewButtons.forEach((button, index) => button.addEventListener("click", () => {
        if (!grid) return;
        viewButtons.forEach(other => { const active = other === button; other.setAttribute("aria-pressed", String(active)); other.classList.toggle("bg-accent/10", active); other.classList.toggle("border-accent", active); other.classList.toggle("border-hairline", !active); other.classList.toggle("text-fg", active); other.classList.toggle("text-fg-muted", !active); });
        grid.style.gridTemplateColumns = index === 1 ? "1fr" : "";
        grid.querySelectorAll<HTMLElement>(":scope > li > a").forEach(card => {
          card.style.flexDirection = index === 1 ? "row" : "";
          const cover = card.firstElementChild as HTMLElement;
          cover.style.width = index === 1 ? "min(30%, 220px)" : "";
          cover.style.flexShrink = index === 1 ? "0" : "";
        });
      }, options));
    }
    document.querySelectorAll<HTMLVideoElement>("video").forEach(video => {
      video.muted = true;
      const card = video.closest("a");
      card?.addEventListener("mouseenter", () => { void video.play().catch(() => {}); }, options);
      card?.addEventListener("mouseleave", () => video.pause(), options);
    });
    return () => { clearTimeout(closeTimer); controller.abort(); };
  }, [pathname, locale, router]);
  useEffect(() => {
    document.querySelector('[role="group"][aria-label="Language"] button, [role="group"][aria-label="Idioma"] button')?.setAttribute("aria-expanded", String(languageOpen));
  }, [languageOpen]);
  const alternatePath = locale === "es" ? pathname.replace(/^\/es(?=\/|$)/, "") || "/" : `/es${pathname === "/" ? "" : pathname}`;
  return <>{languageOpen && <div role="menu" aria-label="Language" className="fixed left-16 top-1/2 z-50 rounded-xl border-hairline bg-bg p-3 shadow-xl"><Link role="menuitem" className="block px-3 py-2 font-mono text-body-sm" href={alternatePath}>{locale === "es" ? "🇺🇸 English (US)" : "🇲🇽 Español (MX)"}</Link></div>}{cookiesOpen && <div role="dialog" aria-modal="true" aria-label={copy.aria} className="fixed bottom-5 left-5 right-5 z-50 mx-auto max-w-[640px] rounded-xl border-hairline bg-bg p-6 shadow-xl"><p className="font-mono text-body-sm text-fg-secondary">{copy.body}</p><div className="mt-5 flex items-center gap-4">{[copy.accept, copy.reject].map(label => <button key={label} className="rounded-full border-hairline px-4 py-2 font-mono text-label" onClick={() => { localStorage.setItem("we-cookie-consent", label === copy.accept ? "accepted" : "rejected"); setCookiesOpen(false); }}>{label}</button>)}<a className="text-label underline" href={`${locale === "es" ? "/es" : ""}/privacy`}>{copy.privacyLink}</a></div></div>}</>;
}
