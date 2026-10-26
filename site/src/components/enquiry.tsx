"use client";

import Link from "next/link";
import { createContext, useContext, useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from "react";
import { ArrowRight, Check, MessageCircle, X } from "lucide-react";
import { categories, whatsapp } from "@/lib/data";

const EnquiryContext = createContext<(part?: string) => void>(() => {});

export function EnquiryButton({ children = "Find my part", part = "", className = "button button-primary" }: { children?: ReactNode; part?: string; className?: string }) {
  const open = useContext(EnquiryContext);
  return <button className={className} onClick={() => open(part)}>{children}<ArrowRight size={17} /></button>;
}

export function EnquiryForm({ initialPart = "", compact = false }: { initialPart?: string; compact?: boolean }) {
  const [message, setMessage] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  const optionsId = useId();
  function prepare(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const line = (key: string) => String(data.get(key) || "").trim();
    setMessage(`Hi DCB Spares, I would like a parts quote.\n\nName: ${line("name")}\nPart / category: ${line("part")}\nVehicle / equipment: ${line("vehicle") || "Not provided"}\nPart number: ${line("number") || "Not available"}\nEmail: ${line("email") || "Not provided"}\nPhone: ${line("phone") || "Not provided"}\nYear: ${line("year") || "Not provided"}\nVoltage: ${line("voltage") || "Not provided"}\nFuel: ${line("fuel") || "Not provided"}\nPins / teeth: ${line("pins") || "Not provided"} / ${line("teeth") || "Not provided"}\nPreferred branch: ${line("branch")}\nDetails: ${line("details") || "Please help me find the correct part."}`);
  }
  return <>{message && <div className="enquiry-ready" role="status"><span className="success-icon"><Check size={24} /></span><h3>Your enquiry is ready.</h3><p>Continue to WhatsApp to review and send your message to DCB Spares.</p><pre>{message}</pre><a href={whatsapp(message)} target="_blank" rel="noopener noreferrer" className="button button-primary"><MessageCircle size={18} />Continue to WhatsApp<ArrowRight size={16} /></a><button className="text-link" onClick={() => setMessage("")}>Edit enquiry</button><small>Nothing is sent until you press send in WhatsApp.</small></div>}<form hidden={!!message} ref={formRef} onSubmit={prepare} className={`enquiry-form${compact ? " compact" : ""}`}>
    <div className="form-row"><label>Your name <span>*</span><input name="name" autoComplete="name" placeholder="Full name" required maxLength={100} /></label><label>Preferred branch<select name="branch" defaultValue="Alrode, Gauteng"><option>Alrode, Gauteng</option><option>Cape Town, Western Cape</option><option>Either branch</option></select></label></div>
    <label>What part do you need? <span>*</span><input name="part" list={optionsId} defaultValue={initialPart} placeholder="e.g. Alternator, starter motor, LED light" required maxLength={400} /><datalist id={optionsId}>{categories.map(category => <option key={category.slug} value={category.name} />)}</datalist></label>
    <div className="form-row"><label>Vehicle or equipment <small>(if relevant)</small><input name="vehicle" placeholder="e.g. Toyota Hilux 3.0 D-4D, 2014" maxLength={160} /></label><label>Part number <small>(if known)</small><input name="number" placeholder="OE / existing part number" maxLength={100} /></label></div>
    <details className="extra-vehicle-details"><summary>Contact & technical details <span>(optional)</span></summary><div className="extra-details-fields"><div className="form-row"><label>Email address<input type="email" name="email" autoComplete="email" maxLength={160} /></label><label>Phone number<input type="tel" name="phone" autoComplete="tel" maxLength={40} /></label></div><div className="form-row"><label>Vehicle year<input name="year" inputMode="numeric" maxLength={4} placeholder="e.g. 2014" /></label><label>Voltage<select name="voltage" defaultValue=""><option value="">Not sure</option><option>12V</option><option>24V</option><option>Other</option></select></label><label>Fuel<select name="fuel" defaultValue=""><option value="">Not sure</option><option>Petrol</option><option>Diesel</option><option>Electric / hybrid</option></select></label></div><div className="form-row"><label>Number of pins<input name="pins" inputMode="numeric" maxLength={3} /></label><label>Number of teeth<input name="teeth" inputMode="numeric" maxLength={3} /></label></div></div></details>
    <label>Anything else?<textarea name="details" placeholder="Quantity, engine details, or what you need help with…" rows={3} maxLength={1200} /></label>
    <button className="button button-primary" type="submit">Prepare WhatsApp enquiry<ArrowRight size={17} /></button>
    <p className="form-note privacy-notice">Your details stay in this page until you choose to open WhatsApp. You can add a photo of your part there. <Link href="/privacy-policy/" target="_blank" rel="noopener noreferrer" aria-label="Privacy policy (opens in a new tab)">Privacy policy</Link>.</p>
  </form></>;
}

export function EnquiryProvider({ children }: { children: ReactNode }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [part, setPart] = useState("");
  const [formKey, setFormKey] = useState(0);
  function open(value = "") { setPart(value); setFormKey(k => k + 1); dialog.current?.showModal(); }
  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    const observer = new MutationObserver(() => { document.body.style.overflow = element.open ? "hidden" : ""; });
    observer.observe(element, { attributes: true, attributeFilter: ["open"] });
    return () => { observer.disconnect(); document.body.style.overflow = ""; };
  }, []);
  return <EnquiryContext.Provider value={open}>{children}<dialog ref={dialog} className="enquiry-dialog" aria-labelledby="enquiry-title" onClick={event => { if (event.target === event.currentTarget) dialog.current?.close(); }}><div className="dialog-inner"><button className="icon-button dialog-close" aria-label="Close enquiry" onClick={() => dialog.current?.close()}><X size={22} /></button><p className="eyebrow"><span />LET’S FIND YOUR PART</p><h2 id="enquiry-title">Back on the road.<br /><span>Starts right here.</span></h2><p className="dialog-description">A few details help our team find the right fit.</p><EnquiryForm key={formKey} initialPart={part} compact /></div></dialog></EnquiryContext.Provider>;
}
