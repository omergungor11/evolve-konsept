"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { gsap } from "gsap";
import { SplitText } from "gsap/SplitText";
import english from "../site/data/en-messages.json";
import spanish from "../site/data/es-messages.json";
import data from "./data.json";
import { PainStage } from "./PainStage";
import { DiagnosisPreview } from "./DiagnosisPreview";

const Aurora = dynamic(() => import("./aurora"), { ssr: false });
const ParticleSweep = dynamic(() => import("./particle-sweep").then(module => module.ParticleSweep), { ssr: false });
const auroraColors = ["#7A0046", "#4EFFEF", "#7A0046"];

type Step = "pain" | "name" | "company" | "preview" | "contact" | "complete";
type Category = keyof typeof data.categories;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const serviceRoutes: Record<string, string> = { "process-redesign":"digital-transformation", "pipeline-analytics":"crm-implementation", "team-enablement":"digital-transformation", "positioning-audit":"seo", "campaign-rebuild":"paid-media", "messaging-clarity":"web-development", "automation-suite":"ai-automation", "analytics-rebuild":"data-analytics", "dashboard-design":"data-analytics", "measurement-framework":"data-analytics", "workflow-automation":"ai-automation", "knowledge-base":"ai-agent-development", "infrastructure-audit":"cloud-migration", "architecture-review":"custom-software-development", "performance-ops":"web-development" };
const inputClass = "flex-1 min-w-0 bg-transparent font-mono text-[14px] text-fg placeholder:text-fg-muted outline-none disabled:opacity-60";
const promptClass = "group flex w-full items-center gap-3 rounded-[10px] px-5 py-4 border-hairline bg-white/[0.02] backdrop-blur-md transition-colors duration-200 ease-out focus-within:border-hairline-strong focus-within:bg-white/[0.035]";

function Prompt({ value, onChange, onSubmit, placeholder, label, type = "text", disabled = false, valid = true }: { value: string; onChange: (value: string) => void; onSubmit: () => void; placeholder: string; label?: string; type?: string; disabled?: boolean; valid?: boolean }) {
  return <form className={promptClass} onSubmit={event => { event.preventDefault(); if (value.trim() && valid && !disabled) onSubmit(); }}>
    <input type={type} value={value} onChange={event => onChange(event.target.value)} placeholder={placeholder} aria-label={label ?? placeholder} disabled={disabled} className={inputClass} autoComplete={type === "email" ? "email" : type === "tel" ? "tel" : "off"} />
    <button type="submit" aria-label="Submit" disabled={!value.trim() || !valid || disabled} className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-mono text-[14px] text-accent transition-colors hover:bg-accent/10 disabled:opacity-40">→</button>
  </form>;
}

/** The site's six-stage diagnosis, implemented as a local React state machine. */
export function DiagnosisJourney({ locale = "en" }: { locale?: string }) {
  const es = locale === "es";
  const copy: Record<string, string> = (es ? spanish : english).diagnosis;
  const t = (key: string, values: Record<string, string | number> = {}) => Object.entries(values).reduce((text, [name, value]) => text.replaceAll(`{${name}}`, String(value)), copy[key] ?? key);
  const [step, setStep] = useState<Step>("pain");
  const [pain, setPain] = useState("");
  const [category, setCategory] = useState<Category>("general");
  const [count, setCount] = useState(0);
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [website, setWebsite] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState(true);
  const [status, setStatus] = useState<"idle" | "sending" | "error">("idle");
  const section = useRef<HTMLElement>(null);
  const submission = useRef(0);
  const outgoing = useRef<gsap.core.Tween | null>(null);
  const advancing = useRef(false);
  const previousStep = useRef<Step>(step);
  useEffect(() => {
    if (previousStep.current === step) return;
    previousStep.current = step;
    if (step === "name") section.current?.scrollIntoView({ block: "start", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
    section.current?.querySelector<HTMLInputElement>("input")?.focus({ preventScroll: true });
  }, [step]);
  useEffect(() => {
    advancing.current = false;
    const content = section.current?.querySelector<HTMLElement>("[data-journey-content]");
    if (!content || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.registerPlugin(SplitText);
    const splits: SplitText[] = [];
    const context = gsap.context(() => {
      const children = Array.from(content.children);
      const timeline = gsap.timeline();
      const reveal = (element: Element | undefined, at: number) => {
        if (!element) return;
        const split = SplitText.create(element as HTMLElement, { type: "words", wordsClass: "inline-block" });
        splits.push(split);
        timeline.fromTo(split.words, { opacity: 0, filter: "blur(10px)" }, { opacity: 1, filter: "blur(0px)", duration: 1.2, ease: "expo.out", stagger: { amount: 1.2 } }, at);
      };
      if (step === "name") {
        timeline.fromTo(content, { x: innerWidth, autoAlpha: 0 }, { x: 0, autoAlpha: 1, duration: 1, ease: "expo.out" }, .05);
        const hasAcknowledgement = children.length === 3;
        if (hasAcknowledgement) children[0]?.querySelectorAll("p").forEach(element => reveal(element, .35));
        reveal(children[hasAcknowledgement ? 1 : 0], hasAcknowledgement ? 4.75 : .35);
        timeline.fromTo(children[hasAcknowledgement ? 2 : 1], { opacity: 0, y: 16, filter: "blur(8px)" }, { opacity: 1, y: 0, filter: "blur(0px)", duration: .6, ease: "expo.out" }, hasAcknowledgement ? 7.55 : 3.15);
      } else if (step === "company" || step === "contact") {
        reveal(children[0], .1);
        timeline.fromTo(children[1], { opacity: 0, y: 16, filter: "blur(6px)" }, { opacity: 1, y: 0, filter: "blur(0px)", duration: .6, ease: "expo.out" }, step === "company" ? 2.65 : 2.8);
      } else if (step === "complete") {
        reveal(children[0], .15); reveal(children[1], .8); reveal(children[2], 1.5);
        timeline.fromTo(children[0], { scale: .96 }, { scale: 1, duration: 1.4, ease: "expo.out" }, .15);
        timeline.fromTo(children[3]?.children ?? [], { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: .7, ease: "expo.out", stagger: .12 }, 1.9);
        timeline.fromTo(children[4], { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: .7, ease: "expo.out" }, 3.9);
      }
    }, content);
    return () => { outgoing.current?.kill(); context.revert(); splits.forEach(split => split.revert()); };
  }, [step]);
  const advance = (next: Step) => {
    if (advancing.current) return;
    advancing.current = true;
    const content = section.current?.querySelector("[data-journey-content]");
    if (!content || matchMedia("(prefers-reduced-motion: reduce)").matches) { setStep(next); return; }
    outgoing.current = gsap.to(content, { opacity: 0, y: -20, duration: step === "name" ? .7 : .9, ease: "power3.in", onComplete: () => setStep(next) });
  };
  const selectPain = (text: string, selectedCategory: Category = "general", selectedCount = 0) => { setPain(text); setCategory(selectedCategory); setCount(selectedCount); setStep("name"); };
  const response = data.categories[category];
  const prefix = es ? "/es" : "";
  async function submitContact() {
    if (!emailPattern.test(email.trim()) || !phone.trim() || status === "sending") return;
    const attempt = ++submission.current;
    setStatus("sending");
    try {
      const result = await fetch("/api/lead", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ source: "home-diagnosis", locale, name: name.trim(), company: company.trim(), url: website.trim(), email: email.trim(), phone: phone.trim(), whatsapp, message: `Pain: "${pain}" (${category})` }) });
      if (!result.ok) throw new Error("Submission failed");
      if (attempt !== submission.current) return;
      setStatus("idle"); advance("complete");
    } catch { if (attempt === submission.current) setStatus("error"); }
  }
  return <section ref={section} data-section="2" data-diagnosis-step={step} className="relative isolate z-10 overflow-x-clip scroll-mt-24" style={{clipPath:"inset(-100vh 0 0 0)"}}>
    <div className="pointer-events-none absolute inset-0 z-0"><Aurora colorStops={auroraColors} className="" amplitude={.9} blend={.55} speed={1.68} opacity={step === "pain" ? 0 : 1} frequency={step === "preview" || step === "complete" ? 2.4 : 2} verticalScale={2} verticalOffset={0} originY={.5} bandHalfWidth={step === "preview" || step === "complete" ? .42 : .2}/></div>
    {step === "name" && <ParticleSweep flavor="swarm" color="#F0F0F8"/>}
    {step === "complete" && <div className="pointer-events-none fixed inset-0 z-0"><ParticleSweep flavor="diagonalWaves" color="#F0F0F8"/></div>}
    {step !== "pain" && <><div className="absolute right-6 top-[80px] z-40"><button type="button" aria-label={t("cancelAria")} className="rounded-full border-hairline px-3 py-1.5 font-mono text-[10px] uppercase text-fg-secondary hover:text-fg" onClick={() => { submission.current++; setStep("pain"); setPain(""); setStatus("idle"); }}>{t("cancelLabel")} ×</button></div></>}
    {pain && ["name", "company", "complete"].includes(step) && <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-[72px] z-30 flex justify-center px-4 sm:top-[80px] sm:px-0"><p className="relative max-w-full truncate font-mono text-[16px] leading-none tracking-[-0.01em] text-fg/90 sm:whitespace-nowrap sm:text-[20px]">{pain}<span className="ml-3 text-fg-muted sm:absolute sm:left-full sm:top-0">{count} ↗</span></p></div>}
    {step === "pain" ? <PainStage copy={copy} onSelect={selectPain}/> : step === "preview" ? <DiagnosisPreview name={name} pain={pain} line={es ? response.lineEs : response.line} matched={response.matched.map(service => ({ ...service, name: es ? service.nameEs : service.name }))} copy={copy} locale={locale} onContinue={() => setStep("contact")}/> : <div key={step} data-journey-content className="relative z-10 mx-auto flex w-full max-w-[1080px] flex-col items-center gap-7 px-6 pb-24 pt-32" style={{minHeight:"100vh"}}>
      {step === "name" && <>{count > 0 && <div className="text-center font-mono text-body text-fg"><p>{t("s2a1AckLine1")}</p><p className="mt-3">{t("s2a1AckLine2", {count})}</p></div>}<p className="max-w-[520px] text-center font-mono text-body text-fg">{t("s2a1NamePrompt")}</p><div className="w-full max-w-[420px]"><Prompt value={name} onChange={setName} onSubmit={() => advance("company")} placeholder={t("s2a1NamePlaceholder")}/></div></>}
      {step === "company" && <><p className="max-w-[520px] text-center font-mono text-body text-fg">{t("s2a2CompanyPrompt", {name})}</p><div className="flex w-full max-w-[420px] flex-col gap-3"><Prompt value={company} onChange={setCompany} onSubmit={() => advance("preview")} placeholder={t("s2a2CompanyPlaceholder")}/><form className={promptClass} onSubmit={event => { event.preventDefault(); if (company.trim()) advance("preview"); }}><input type="text" inputMode="url" value={website} onChange={event => setWebsite(event.target.value)} placeholder={t("s2a2WebsitePlaceholder")} aria-label={t("s2a2WebsiteAria")} className={inputClass}/><button disabled={!company.trim()} aria-label={t("promptBoxSubmitAria")} className="text-accent disabled:opacity-40">→</button></form><p className="mt-2 text-center font-mono text-body-sm text-fg-secondary">{t("s2a2Reassurance")}</p></div></>}
      {step === "contact" && <><h2 className="max-w-[640px] text-center font-display text-display-m font-extrabold text-fg">{t("s2cPrompt",{name})}</h2><div className="flex w-full max-w-[420px] flex-col gap-3"><Prompt value={email} onChange={setEmail} onSubmit={submitContact} placeholder={t("s2cEmailPlaceholder")} label={t("s2cEmailAria")} type="email" disabled={status === "sending"} valid={emailPattern.test(email.trim()) && !!phone.trim()}/><Prompt value={phone} onChange={setPhone} onSubmit={submitContact} placeholder={t("s2cPhonePlaceholder")} label={t("s2cPhoneAria")} type="tel" disabled={status === "sending"} valid={emailPattern.test(email.trim())}/><label className="mt-2 flex items-center gap-3 font-mono text-body-sm text-fg-secondary"><input type="checkbox" checked={whatsapp} onChange={event => setWhatsapp(event.target.checked)} className="accent-accent"/>{t("s2cWhatsappOptIn")}</label><p className="text-center font-mono text-body-sm text-fg-muted">{t("s2cNoSpam")}</p>{status === "error" && <p role="alert" className="text-accent">{t("s2cError")}</p>}{status === "sending" && <p role="status">{es ? "Enviando…" : "Sending…"}</p>}</div></>}
      {step === "complete" && <><h2 className="max-w-[800px] text-center font-display text-display-m font-extrabold text-fg">{t("s2dHeadline",{name})}</h2><p role="status" className="text-center font-mono text-body text-fg-secondary">{es ? "Demostración local: el formulario fue validado. No se enviaron datos ni mensajes." : "Local demo: your form was validated. No data or messages were sent."}</p><p className="mt-10 font-mono text-body text-fg">{t("s2dServicesLabel")}</p><div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">{response.matched.map(service => <Link key={service.slug} href={`${prefix}/services/${serviceRoutes[service.slug] ?? "digital-transformation"}`} className="group flex h-full flex-col gap-4 rounded-xl border-hairline bg-white/[0.02] p-6 transition-colors hover:bg-white/[0.04]"><h3 className="font-mono text-[16px] font-medium text-fg">{es ? service.nameEs : service.name}</h3><p className="font-mono text-[13px] leading-relaxed text-fg-secondary">{(data.descriptions[es ? "es" : "en"] as Record<string,string>)[service.slug]}</p><span className="mt-auto font-mono text-[12px] uppercase text-fg-muted">{t("learnMore")} →</span></Link>)}</div><Link href={`${prefix}/contact`} className="mt-8 rounded-full bg-accent px-6 py-3 font-mono text-body-sm">{t("bookCallButton")} →</Link></>}
    </div>}
  </section>;
}
