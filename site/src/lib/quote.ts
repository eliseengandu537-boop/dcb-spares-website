import { salesContacts } from "./business";

export type QuoteDetails = {
  part: string;
  make: string;
  model: string;
  name: string;
  email: string;
  phone: string;
  companyOrLocation: string;
};
export type QuoteField = keyof QuoteDetails;
export const emptyQuote: QuoteDetails = { part: "", make: "", model: "", name: "", email: "", phone: "", companyOrLocation: "" };
export const quoteFields: { key: QuoteField; label: string; max: number; type?: string; autoComplete?: string; placeholder: string }[] = [
  { key: "part", label: "What do you need a quote for?", max: 500, placeholder: "Part, quantity and part number, if known" },
  { key: "make", label: "Vehicle make", max: 100, placeholder: "e.g. Toyota" },
  { key: "model", label: "Vehicle model", max: 160, placeholder: "e.g. Hilux 3.0 D-4D, 2014" },
  { key: "name", label: "Your name", max: 100, autoComplete: "name", placeholder: "Full name" },
  { key: "email", label: "Email address", max: 160, type: "email", autoComplete: "email", placeholder: "you@example.com" },
  { key: "phone", label: "Phone number", max: 40, type: "tel", autoComplete: "tel", placeholder: "Your contact number" },
  { key: "companyOrLocation", label: "Company or location", max: 160, placeholder: "Company name or your town / area" },
];

export function validateQuote(value: unknown): { data?: QuoteDetails; errors: Partial<Record<QuoteField, string>> } {
  const input = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const data = { ...emptyQuote };
  const errors: Partial<Record<QuoteField, string>> = {};
  for (const field of quoteFields) {
    const entry = typeof input[field.key] === "string" ? (input[field.key] as string).trim() : "";
    data[field.key] = entry;
    if (entry.length < (field.key === "model" ? 1 : 2)) errors[field.key] = `Please complete this field.`;
    else if (entry.length > field.max || /[\u0000-\u001f\u007f]/.test(entry)) errors[field.key] = `Please check ${field.label.toLowerCase()}.`;
  }
  if (!/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(data.email)) errors.email = "Enter a valid email address.";
  if (!/^[+\d()\s.-]+$/.test(data.phone) || data.phone.replace(/\D/g, "").length < 7 || data.phone.replace(/\D/g, "").length > 15) errors.phone = "Enter a valid contact number.";
  return Object.keys(errors).length ? { errors } : { data, errors };
}

export function quoteText(details: QuoteDetails, reference?: string) {
  return [
    "DCB Assist — quote request",
    reference ? `Reference: ${reference}` : "",
    "",
    ...quoteFields.map(field => `${field.label.replace("?", "")}: ${details[field.key]}`),
    "",
    "Please contact this customer about their requested aftermarket parts.",
  ].filter((line, index, all) => line || all[index - 1] !== "").join("\n");
}
export function quoteEmailLink(details: QuoteDetails) {
  return `mailto:${salesContacts.map(contact => contact.email).join(",")}?subject=${encodeURIComponent("DCB Assist — parts quote request")}&body=${encodeURIComponent(quoteText(details))}`;
}
