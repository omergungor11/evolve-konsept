"use client";

import { useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import english from "../site/data/en-messages.json";
import spanish from "../site/data/es-messages.json";

const fieldClass = "w-full rounded-lg border-hairline bg-white/[0.02] px-4 py-3 font-mono text-body text-fg outline-none transition-colors placeholder:text-fg-muted focus:border-hairline-strong focus-visible:ring-2 focus-visible:ring-fg/30";
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const disposableDomains = new Set(["10minutemail.com", "guerrillamail.com", "mailinator.com", "yopmail.com", "tempmail.com", "temp-mail.org", "maildrop.cc"]);

/** Four questions with preserved answers, validation, and a demo-only submission. */
export function ContactJourney({ locale = "en" }: { locale?: string }) {
  const messages = locale === "es" ? spanish : english;
  const copy = messages.contact;
  const [step, setStep] = useState(0);
  const [values, setValues] = useState({name:"", company:"", pain:"", email:"", phone:""});
  const [dial, setDial] = useState("+52");
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const input = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);
  const firstName = values.name.trim().split(/\s+/)[0];
  const update = (key: keyof typeof values, value: string) => setValues(previous => ({...previous, [key]: value}));
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "sending") return;
    let issue = "";
    if (step === 0 && !values.name.trim()) issue = copy.errName;
    if (step === 2 && !values.pain.trim()) issue = copy.errPain;
    if (step === 3) {
      const domain = values.email.trim().split("@")[1]?.toLowerCase();
      if (!emailPattern.test(values.email.trim())) issue = copy.errEmail;
      else if (/^(example\.(com|org|net)|localhost)$/.test(domain) || /^(test|testing|fake|dummy)@/i.test(values.email)) issue = copy.errEmailReal;
      else if (disposableDomains.has(domain)) issue = copy.errEmailTemp;
      else if (!consent) issue = copy.errConsent;
    }
    setError(issue);
    if (issue) { input.current?.focus(); return; }
    if (step < 3) { setStep(step + 1); return; }
    setStatus("sending");
    try {
      const response = await fetch("/api/lead", {method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({source:"contact", locale, name:values.name.trim(), company:values.company.trim(), message:values.pain.trim(), email:values.email.trim(), phone:values.phone.trim() ? `${dial} ${values.phone.trim()}` : undefined, consent})});
      if (!response.ok) throw new Error("Submission failed");
      setStatus("sent");
    } catch { setStatus("idle"); setError(copy.errNetwork); }
  }
  const summary = [step > 0 && {label:copy.labelName,value:values.name},step > 1 && values.company && {label:copy.labelCompany,value:values.company},step > 2 && {label:copy.labelPain,value:values.pain}].filter(Boolean) as {label:string;value:string}[];
  return <div className="relative isolate" data-contact-journey="true">
    <div aria-hidden="true" className="pointer-events-none absolute -inset-x-8 -inset-y-10 -z-10 blur-2xl" style={{background:"radial-gradient(60% 50% at 50% 30%,rgba(228,0,124,.1),transparent 70%)"}}/>
    {status === "sent" ? <div className="gate-enter rounded-2xl border-hairline-strong bg-bg/85 p-8 backdrop-blur-xl sm:p-10"><p className="font-mono text-label uppercase text-accent">{copy.received}</p><h2 className="mt-5 font-display text-display-s font-bold text-fg">{copy.thanks.replace("{name}",firstName || copy.thanksFallback)}</h2><p role="status" className="mt-4 max-w-[48ch] font-mono text-body-sm text-fg-secondary">{locale === "es" ? "Demostración local: el formulario fue validado. No se enviaron datos ni mensajes." : "Local demo: your form was validated. No data or messages were sent."}</p></div> : <div className="rounded-2xl border-hairline-strong bg-bg/85 p-6 backdrop-blur-xl sm:p-8">
      <div className="mb-8 flex items-center gap-2" aria-label={`${step + 1} / 4`}>{[0,1,2,3].map(index => <span key={index} className={`h-1 flex-1 rounded-full transition-colors duration-500 ${index <= step ? "bg-accent" : "bg-white/10"}`}/>)}</div>
      {summary.length > 0 && <ul className="mb-8 flex flex-wrap items-center gap-x-5 gap-y-2 border-b-hairline-soft pb-6">{summary.map(item => <li key={item.label} className="flex items-center gap-2"><span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent"/><span className="font-mono text-label-s uppercase text-fg-muted">{item.label}</span><span className="font-mono text-body-sm text-fg">{item.value}</span></li>)}</ul>}
      <form noValidate onSubmit={submit} className="flex flex-col gap-5">
        <div key={step} className="flex flex-col gap-5 step-enter">
          {step === 0 && <><p className="font-display text-display-s font-bold text-fg">{copy.promptName}</p><input ref={element => {input.current = element;}} name="name" autoComplete="name" value={values.name} onChange={event => update("name",event.target.value)} placeholder={copy.phName} aria-label={copy.ariaName} className={fieldClass}/></>}
          {step === 1 && <><p className="font-display text-display-s font-bold text-fg">{copy.promptOrg.replace("{name}",firstName)} <span className="ml-2 align-middle font-mono text-label-s uppercase text-fg-muted">{copy.optional}</span></p><input autoFocus name="organization" autoComplete="organization" value={values.company} onChange={event => update("company",event.target.value)} placeholder={copy.phCompany} aria-label={copy.ariaCompany} className={fieldClass}/></>}
          {step === 2 && <><p className="font-display text-display-s font-bold text-fg">{copy.promptPain}</p><textarea ref={element => {input.current = element;}} autoFocus rows={4} value={values.pain} onChange={event => update("pain",event.target.value)} placeholder={copy.phPain} aria-label={copy.ariaPain} className={`${fieldClass} resize-none`}/></>}
          {step === 3 && <><p className="font-display text-display-s font-bold text-fg">{copy.promptContact}</p><input ref={element => {input.current = element;}} autoFocus type="email" name="email" autoComplete="email" value={values.email} onChange={event => update("email",event.target.value)} placeholder={copy.phEmail} aria-label={copy.ariaEmail} className={fieldClass}/><div className="flex items-stretch gap-2"><select aria-label={locale === "es" ? "Código de país" : "Country code"} className="rounded-lg border-hairline bg-bg px-2 font-mono text-body" value={dial} onChange={event => setDial(event.target.value)}>{[["+52","🇲🇽 +52"],["+1","🇺🇸 +1"],["+34","🇪🇸 +34"],["+44","🇬🇧 +44"],["+90","🇹🇷 +90"],["+971","🇦🇪 +971"],["+57","🇨🇴 +57"],["+54","🇦🇷 +54"]].map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select><input type="tel" name="tel" autoComplete="tel-national" value={values.phone} onChange={event => update("phone",event.target.value)} placeholder={copy.phPhone} aria-label={copy.ariaPhone} className={fieldClass}/></div><label className="flex cursor-pointer items-start gap-3"><input type="checkbox" checked={consent} onChange={event => setConsent(event.target.checked)} aria-label={messages.consent.aria} className="mt-0.5 h-4 w-4 shrink-0 accent-accent"/><span className="font-mono text-label-s leading-relaxed text-fg-muted">{messages.consent.pre}<Link href={`${locale === "es" ? "/es" : ""}/privacy`} className="text-fg-secondary underline underline-offset-2">{messages.consent.privacyLink}</Link>{messages.consent.post}</span></label></>}
        </div>
        {error && <p role="alert" className="font-mono text-body-sm text-accent">{error}</p>}
        <div className="mt-2 flex items-center justify-between gap-4">{step > 0 ? <button type="button" disabled={status === "sending"} onClick={() => {setStep(step - 1);setError("");}} className="font-mono text-label-s uppercase text-fg-muted hover:text-fg">← {copy.back}</button> : <span/>}<button type="submit" disabled={status === "sending"} className="inline-flex items-center gap-2 rounded-lg bg-accent px-6 py-3 font-mono text-label uppercase text-white transition-transform hover:scale-[1.02] disabled:opacity-40">{step < 3 ? copy.continue : status === "sending" ? copy.sending : copy.send} <span aria-hidden="true">→</span></button></div>
      </form>
    </div>}
  </div>;
}
