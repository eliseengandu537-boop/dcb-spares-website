import nodemailer from "nodemailer";
import type Mail from "nodemailer/lib/mailer";
import { quoteText, type QuoteDetails } from "../quote";
import { getQuoteRouting, quoteAreaLabel, type QuoteTerritories } from "../quote-routing";
import type { QuotePhotoAttachment } from "./quote-photo";

export type MailConfig = {
  sender: string;
  auth: { user: string; pass: string } | { type: "OAuth2"; user: string; clientId: string; clientSecret: string; refreshToken: string };
  territories?: QuoteTerritories;
};
type Receipt = { accepted: (string | Mail.Address)[]; rejected: (string | Mail.Address)[] };
type Transport = { sendMail: (mail: Mail.Options) => Promise<Receipt>; close?: () => void };
export class DeliveryUnavailable extends Error {}
export class DeliveryFailed extends Error {}

export function getMailConfig(env: Record<string, string | undefined>): MailConfig | undefined {
  const sender = env.GMAIL_USER?.trim();
  // The trusted server configuration identifies the authenticated sending
  // account. It can be Gmail or Workspace; DCB recipients are resolved below.
  if (!sender || !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(sender)) return undefined;
  if (env.GMAIL_CLIENT_ID && env.GMAIL_CLIENT_SECRET && env.GMAIL_REFRESH_TOKEN) {
    return { sender, auth: { type: "OAuth2", user: sender, clientId: env.GMAIL_CLIENT_ID, clientSecret: env.GMAIL_CLIENT_SECRET, refreshToken: env.GMAIL_REFRESH_TOKEN } };
  }
  const pass = env.GMAIL_APP_PASSWORD?.replace(/\s/g, "");
  return pass ? { sender, auth: { user: sender, pass } } : undefined;
}

export function buildQuoteEmail(details: QuoteDetails, reference: string, sender: string, photo?: QuotePhotoAttachment, territories?: QuoteTerritories): Mail.Options {
  const description = [details.make, details.model].filter(Boolean).join(" ") || details.part.replace(/\s+/g, " ");
  const routing = getQuoteRouting(details.area, territories);
  const assignment = routing.cc
    ? `Sales owner: ${routing.to.name}. Gary is copied for coordination. Please coordinate any reassignment with Gary.`
    : "Sales owner: Gary. Please assign this lead to one sales representative for the customer's area.";
  return {
    from: { name: "DCB Assist", address: sender },
    to: [{ name: routing.to.name, address: routing.to.email }],
    cc: routing.cc ? [{ name: routing.cc.name, address: routing.cc.email }] : undefined,
    replyTo: { name: details.name, address: details.email },
    subject: `DCB quote ${reference} — ${quoteAreaLabel(details.area)} — ${description}`.slice(0, 230),
    text: `${assignment}\n\n${quoteText(details, reference)}` + (photo ? "\n\nCustomer photo: attached to this email." : ""),
    attachments: photo ? [photo] : undefined,
    disableFileAccess: true,
    disableUrlAccess: true,
  };
}
const createTransport = (config: MailConfig): Transport => nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: config.auth,
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 20000,
  logger: false,
  debug: false,
});

export async function deliverQuote(details: QuoteDetails, reference: string, config: MailConfig, photo?: QuotePhotoAttachment, transportFactory = createTransport) {
  const transport = transportFactory(config);
  try {
    const routing = getQuoteRouting(details.area, config.territories);
    const recipients = [routing.to, ...(routing.cc ? [routing.cc] : [])];
    const receipt = await transport.sendMail(buildQuoteEmail(details, reference, config.sender, photo, config.territories));
    const accepted = receipt.accepted.map(item => (typeof item === "string" ? item : item.address || "").toLowerCase());
    if (receipt.rejected.length || !recipients.every(contact => accepted.includes(contact.email.toLowerCase()))) {
      throw new DeliveryFailed("Submission to all sales recipients was not confirmed");
    }
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "EAUTH") throw new DeliveryUnavailable("Mail authorisation unavailable");
    throw new DeliveryFailed("Mail submission was not confirmed");
  } finally { transport.close?.(); }
}
