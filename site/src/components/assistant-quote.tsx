"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowLeft, ArrowRight, Check, Mail, MessageCircle } from "lucide-react";
import { emptyQuote, quoteEmailLink, quoteFields, quoteText, validateQuote, type QuoteDetails, type QuoteField } from "@/lib/quote";
import { salesContacts } from "@/lib/business";
import { whatsapp } from "@/lib/data";
import "./assistant-quote.css";

type Props = { onCancel: () => void; onBusy: (busy: boolean) => void };
export function AssistantQuoteButton() {
  return <button type="button" className="text-link" onClick={() => window.dispatchEvent(new Event("dcb:quote"))}>Get a quote with DCB Assist<ArrowRight size={15} /></button>;
}
export function AssistantQuote({ onCancel, onBusy }: Props) {
  const [step, setStep] = useState(0);
  const [details, setDetails] = useState<QuoteDetails>({ ...emptyQuote });
  const [errors, setErrors] = useState<Partial<Record<QuoteField, string>>>({});
  const [failure, setFailure] = useState("");
  const [sending, setSending] = useState(false);
  const [reference, setReference] = useState("");
  const requestId = useRef("");
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { heading.current?.focus(); heading.current?.scrollIntoView({ block: "nearest" }); }, [step, reference]);

  function update(field: QuoteField, value: string) {
    setDetails(current => ({ ...current, [field]: value }));
    setErrors(current => ({ ...current, [field]: undefined }));
    setFailure("");
    requestId.current = "";
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending) return;
    const checked = validateQuote(details);
    const activeFields = quoteFields.slice(step === 0 ? 0 : 3, step === 0 ? 3 : undefined);
    const currentErrors = Object.fromEntries(Object.entries(checked.errors).filter(([key]) => step === 2 || activeFields.some(field => field.key === key)));
    if (Object.keys(currentErrors).length) { setErrors(currentErrors); return; }
    if (step < 2) { setStep(step + 1); return; }
    if (!checked.data) return;
    setSending(true);
    onBusy(true);
    setFailure("");
    requestId.current ||= crypto.randomUUID();
    try {
      const result = await fetch("/api/quotes/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...checked.data, requestId: requestId.current, website: new FormData(event.currentTarget).get("website") || "" }),
        signal: AbortSignal.timeout(45000),
      });
      const body = await result.json();
      if (result.status === 202 && body.status === "submitted" && typeof body.reference === "string") {
        setReference(body.reference);
      } else {
        setFailure(typeof body.error === "string" ? body.error : "We couldn’t confirm submission. Please use WhatsApp or email below.");
        if (body.fields) { setErrors(body.fields); setStep(0); }
      }
    } catch {
      setFailure("We couldn’t confirm submission. Your details are still here. Try again, or contact DCB using WhatsApp or email below.");
    } finally { setSending(false); onBusy(false); }
  }
  if (reference) return <section className="assistant-quote quote-confirmation" aria-label="Quote submitted">
    <span className="quote-success-icon"><Check size={24} /></span>
    <h3 ref={heading} tabIndex={-1}>Your quote request is submitted.</h3>
    <p>It has been accepted for sending to Hans, Shane, Gary and Sean. The DCB sales team will contact you using the details you provided.</p>
    <span className="quote-reference">REFERENCE · {reference}</span>
    <a className="button button-primary" href={whatsapp(quoteText(details, reference))} target="_blank" rel="noopener noreferrer"><MessageCircle size={16} />Continue on WhatsApp</a>
    <button className="text-link" onClick={onCancel}>Back to DCB Assist<ArrowRight size={14} /></button>
  </section>;

  return <section className="assistant-quote" aria-label="DCB Assist quote request">
    <div className="quote-progress" aria-label={`Step ${step + 1} of 3`}>
      {["Your part", "Your details", "Review"].map((label, index) => <span key={label} aria-current={step === index ? "step" : undefined} className={index <= step ? "is-active" : ""}><b>{index + 1}</b>{label}</span>)}
    </div>
    <h3 ref={heading} tabIndex={-1}>{["What do you need a quote for?", "How can our team reach you?", "Ready to send to DCB?"][step]}</h3>
    <p>{["Tell us the part you need and your vehicle’s make and model.", "Add your contact details and company or location.", "Check your details. Your request will go to all four sales contacts below."][step]}</p>
    <form onSubmit={submit} noValidate={step === 2}>
      {step < 2 ? quoteFields.slice(step === 0 ? 0 : 3, step === 0 ? 3 : undefined).map(field => <div key={field.key} className="quote-field">
        <label htmlFor={`quote-${field.key}`}>{field.label}</label><input id={`quote-${field.key}`} name={field.key} type={field.type || "text"} autoComplete={field.autoComplete || "off"} placeholder={field.placeholder} value={details[field.key]} onChange={event => update(field.key, event.target.value)} required minLength={field.key === "model" ? 1 : 2} maxLength={field.max} aria-invalid={!!errors[field.key]} aria-describedby={errors[field.key] ? `error-${field.key}` : undefined} />
        {errors[field.key] && <small id={`error-${field.key}`} className="quote-field-error">{errors[field.key]}</small>}
      </div>) : <>
        <dl className="quote-review">{quoteFields.map(field => <div key={field.key}><dt>{field.label.replace("?", "")}</dt><dd>{details[field.key]}</dd></div>)}</dl>
        <div className="quote-recipients"><span>DCB SALES TEAM</span>{salesContacts.map(contact => <a key={contact.email} href={`mailto:${contact.email}`}>{contact.email}</a>)}</div>
        <p className="quote-privacy">Submitting shares these details with DCB’s sales team so they can respond to this quote request.</p>
      </>}
      <label className="quote-honeypot" aria-hidden="true">Website<input name="website" autoComplete="off" tabIndex={-1} /></label>
      {failure && <div className="quote-error" role="alert"><p>{failure}</p><a href={whatsapp(quoteText(details))} target="_blank" rel="noopener noreferrer"><MessageCircle size={15} />Send on WhatsApp</a><a href={quoteEmailLink(details)}><Mail size={15} />Email the sales team</a><small>Email opens your mail app with the details filled in. Press Send there to email DCB.</small></div>}
      <div className="quote-controls">
        <button type="button" className="text-link" disabled={sending} onClick={() => step ? setStep(step - 1) : onCancel()}><ArrowLeft size={14} />{step ? "Back" : "Back to chat"}</button>
        <button className="button button-primary" type="submit" disabled={sending}>{sending ? "Submitting…" : step < 2 ? "Continue" : "Submit quote request"}<ArrowRight size={15} /></button>
      </div>
    </form>
  </section>;
}
