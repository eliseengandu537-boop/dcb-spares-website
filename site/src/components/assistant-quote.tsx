"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState, useSyncExternalStore, type FormEvent } from "react";
import { ArrowLeft, ArrowRight, Camera, Check, ChevronDown, Mail, MessageCircle, X } from "lucide-react";
import { emptyQuote, quoteEmailLink, quoteFields, quoteText, validateQuote, type QuoteDetails, type QuoteField } from "@/lib/quote";
import { salesContacts } from "@/lib/business";
import { whatsapp } from "@/lib/data";
import { photoTypes, prepareQuotePhoto } from "@/lib/quote-photo";
import { requestAssistant } from "@/lib/assistant-events";
import "./assistant-quote.css";

type Props = { onCancel: () => void; onBusy: (busy: boolean) => void };
const subscribeToHydration = () => () => {};
export function AssistantQuoteButton() {
  const ready = useSyncExternalStore(subscribeToHydration, () => true, () => false);
  return <button type="button" className="text-link" disabled={!ready} onClick={() => requestAssistant("quote")}>Get a quote with DCB Assist<ArrowRight size={15} /></button>;
}
export function AssistantQuote({ onCancel, onBusy }: Props) {
  const [step, setStep] = useState(0);
  const [details, setDetails] = useState<QuoteDetails>({ ...emptyQuote });
  const [errors, setErrors] = useState<Partial<Record<QuoteField, string>>>({});
  const [failure, setFailure] = useState("");
  const [sending, setSending] = useState(false);
  const [reference, setReference] = useState("");
  const [photo, setPhoto] = useState<{ file: File; url: string } | null>(null);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [photoError, setPhotoError] = useState("");
  const photoAttempt = useRef(0);
  const photoUrl = useRef("");
  const photoInput = useRef<HTMLInputElement>(null);
  const requestId = useRef("");
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { heading.current?.focus(); heading.current?.scrollIntoView({ block: "nearest" }); }, [step, reference]);
  useEffect(() => () => { photoAttempt.current++; if (photoUrl.current) URL.revokeObjectURL(photoUrl.current); }, []);

  function removePhoto() {
    photoAttempt.current++;
    if (photoUrl.current) URL.revokeObjectURL(photoUrl.current);
    photoUrl.current = "";
    if (photoInput.current) photoInput.current.value = "";
    setPhoto(null); setPhotoError(""); setPhotoBusy(false); setFailure("");
    onBusy(false); requestId.current = "";
  }
  async function choosePhoto(file?: File) {
    if (!file) return;
    removePhoto();
    const attempt = ++photoAttempt.current;
    setPhotoBusy(true); onBusy(true);
    try {
      const prepared = await prepareQuotePhoto(file);
      if (attempt !== photoAttempt.current) return;
      photoUrl.current = URL.createObjectURL(prepared);
      setPhoto({ file: prepared, url: photoUrl.current });
    } catch (error) {
      if (attempt === photoAttempt.current) setPhotoError(error instanceof Error ? error.message : "Please try another photo.");
    } finally {
      if (attempt === photoAttempt.current) { setPhotoBusy(false); onBusy(false); }
    }
  }

  function fieldInput(field: typeof quoteFields[number]) {
    const shared = { id: `quote-${field.key}`, name: field.key, placeholder: field.placeholder, value: details[field.key], required: !field.optional, minLength: field.optional ? undefined : 2, maxLength: field.max, "aria-invalid": !!errors[field.key], "aria-describedby": errors[field.key] ? `error-${field.key}` : undefined };
    return <div key={field.key} className="quote-field">
      <label className={field.key === "part" ? "sr-only" : undefined} htmlFor={shared.id}>{field.label}</label>
      {field.key === "part" ? <textarea {...shared} rows={3} onChange={event => update(field.key, event.target.value)} /> : <input {...shared} type={field.type || "text"} autoComplete={field.autoComplete || "off"} onChange={event => update(field.key, event.target.value)} />}
      {errors[field.key] && <small id={`error-${field.key}`} className="quote-field-error">{errors[field.key]}</small>}
    </div>;
  }

  function update(field: QuoteField, value: string) {
    setDetails(current => ({ ...current, [field]: value }));
    setErrors(current => ({ ...current, [field]: undefined }));
    setFailure("");
    requestId.current = "";
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending || photoBusy || (step === 0 && photoError)) return;
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
      const quote = { ...checked.data, requestId: requestId.current, website: new FormData(event.currentTarget).get("website") || "" };
      let body: FormData | string = JSON.stringify(quote);
      if (photo) {
        body = new FormData();
        body.append("quote", JSON.stringify(quote));
        body.append("photo", photo.file);
      }
      const result = await fetch("/api/quotes/", {
        method: "POST",
        headers: photo ? undefined : { "Content-Type": "application/json" },
        body,
        signal: AbortSignal.timeout(45000),
      });
      const response = await result.json();
      if (result.status === 202 && response.status === "submitted" && typeof response.reference === "string") {
        setReference(response.reference);
      } else {
        setFailure(typeof response.error === "string" ? response.error : "We couldn’t confirm submission. Please use WhatsApp or email below.");
        if (response.fields) { setErrors(response.fields); setStep(quoteFields.slice(3).some(field => response.fields[field.key]) ? 1 : 0); }
        if (response.photoError) { setPhotoError(response.photoError); setStep(0); }
      }
    } catch {
      setFailure("We couldn’t confirm submission. Your details are still here. Try again, or contact DCB using WhatsApp or email below.");
    } finally { setSending(false); onBusy(false); }
  }
  if (reference) return <section className="assistant-quote quote-confirmation" aria-label="Quote submitted">
    <span className="quote-success-icon"><Check size={24} /></span>
    <h3 ref={heading} tabIndex={-1}>Your quote request is submitted.</h3>
    <p>It has been accepted for sending to Hans, Shane, Gary and Sean. The DCB sales team will contact you using the details you provided.</p>
    {photo && <p>Your photo is attached to the quote email. To share it on WhatsApp too, add it to your WhatsApp message.</p>}
    <span className="quote-reference">REFERENCE · {reference}</span>
    <a className="button button-primary" href={whatsapp(quoteText(details, reference))} target="_blank" rel="noopener noreferrer"><MessageCircle size={16} />Continue on WhatsApp</a>
    <button className="text-link" onClick={onCancel}>Back to DCB Assist<ArrowRight size={14} /></button>
  </section>;

  return <section className="assistant-quote" aria-label="DCB Assist quote request">
    <div className="quote-progress" aria-label={`Step ${step + 1} of 3`}>
      {["Your request", "Your details", "Review"].map((label, index) => <span key={label} aria-current={step === index ? "step" : undefined} className={index <= step ? "is-active" : ""}><b>{index + 1}</b>{label}</span>)}
    </div>
    <h3 ref={heading} tabIndex={-1}>{["What do you need a quote for?", "How can our team reach you?", "Ready to send to DCB?"][step]}</h3>
    <p>{["Describe what you need. A quantity, part number or photo helps.", "Add your contact details and company or location.", "Check your details. Your request will go to all four sales contacts below."][step]}</p>
    <p className="privacy-notice">DCB uses your details and photo to respond to your quote. <Link href="/privacy-policy/" target="_blank" rel="noopener noreferrer" aria-label="Privacy policy (opens in a new tab)">Privacy policy</Link>.</p>
    <form onSubmit={submit} noValidate={step === 2}>
      {step === 0 ? <>
        {fieldInput(quoteFields[0])}
        <div className="quote-photo">
          <label htmlFor="quote-photo"><Camera size={17} />{photo ? "Change photo" : "Add a photo"} <span>(optional)</span></label>
          <input className="sr-only" ref={photoInput} id="quote-photo" type="file" accept={photoTypes.join(",")} onChange={event => void choosePhoto(event.target.files?.[0])} aria-describedby="quote-photo-help" />
          <small id="quote-photo-help">JPG, PNG or WebP · up to 10 MB. A clear photo helps us identify the item.</small>
          {photoBusy && <p role="status">Preparing your photo…</p>}
          {photo && <div className="quote-photo-preview"><Image src={photo.url} alt="Photo supplied with this quote" width={320} height={220} unoptimized /><button type="button" onClick={removePhoto}><X size={15} />Remove photo</button></div>}
          {photoError && <div className="quote-photo-error"><p role="alert">{photoError}</p><button type="button" className="text-link" onClick={removePhoto}>Continue without a photo</button></div>}
        </div>
        <details className="quote-vehicle-details" open={errors.make || errors.model ? true : undefined}>
          <summary>For a vehicle? Add details <span>(optional)</span><ChevronDown size={16} /></summary>
          <p>Leave these blank if they do not apply or you are unsure.</p>
          {quoteFields.slice(1, 3).map(fieldInput)}
        </details>
      </> : step === 1 ? quoteFields.slice(3).map(fieldInput) : <>
        <dl className="quote-review">{quoteFields.filter(field => !field.optional || details[field.key]).map(field => <div key={field.key}><dt>{field.label.replace("?", "")}</dt><dd>{details[field.key]}</dd></div>)}</dl>
        {photo && <figure className="quote-review-photo"><Image src={photo.url} alt="Photo supplied with this quote" width={320} height={220} unoptimized /><figcaption>Photo included with your quote</figcaption></figure>}
        <div className="quote-recipients"><span>DCB SALES TEAM</span>{salesContacts.map(contact => <a key={contact.email} href={`mailto:${contact.email}`}>{contact.email}</a>)}</div>
        <p className="quote-privacy">Submitting shares these details with DCB’s sales team so they can respond to this quote request.</p>
      </>}
      <label className="quote-honeypot" aria-hidden="true">Website<input name="website" autoComplete="off" tabIndex={-1} /></label>
      {failure && <div className="quote-error" role="alert"><p>{failure}</p><a href={whatsapp(quoteText(details))} target="_blank" rel="noopener noreferrer"><MessageCircle size={15} />Send on WhatsApp</a><a href={quoteEmailLink(details)}><Mail size={15} />Email the sales team</a><small>Email opens your mail app with the details filled in. Press Send there to email DCB.</small>{photo && <small>The photo is not included in these links. Attach it in WhatsApp or your email app before sending.</small>}</div>}
      <div className="quote-controls">
        <button type="button" className="text-link" disabled={sending || photoBusy} onClick={() => step ? setStep(step - 1) : onCancel()}><ArrowLeft size={14} />{step ? "Back" : "Back to chat"}</button>
        <button className="button button-primary" type="submit" disabled={sending || photoBusy}>{sending ? "Submitting…" : photoBusy ? "Preparing photo…" : step < 2 ? "Continue" : "Submit quote request"}<ArrowRight size={15} /></button>
      </div>
    </form>
  </section>;
}
