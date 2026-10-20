import { test, expect } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { createQuoteHandler } from "../src/lib/server/quote-handler";
import { buildQuoteEmail, deliverQuote, getMailConfig, type MailConfig } from "../src/lib/server/quote-delivery";
import { salesContacts } from "../src/lib/business";
import type { QuoteDetails } from "../src/lib/quote";

const details: QuoteDetails = {
  part: "2 aftermarket starter motors, STR1246",
  make: "Toyota",
  model: "Hilux 3.0 D-4D, 2014",
  name: "Test Customer",
  email: "customer@example.invalid",
  phone: "+27 82 123 4567",
  companyOrLocation: "Test Workshop, Cape Town",
};
const config: MailConfig = { sender: "quotes@dcbspares.co.za", auth: { user: "quotes@dcbspares.co.za", pass: "test-only-not-real" } };
const request = (overrides: Record<string, unknown> = {}, origin = "http://localhost:3001") => new Request("http://localhost:3001/api/quotes/", {
  method: "POST",
  headers: { "Content-Type": "application/json", Origin: origin },
  body: JSON.stringify({ ...details, requestId: randomUUID(), ...overrides }),
});

test("email includes every supplied detail, all four fixed sales contacts and the customer's reply-to", () => {
  const mail = buildQuoteEmail(details, "DCB-TEST", config.sender);
  expect(mail.to).toEqual(salesContacts.map(contact => ({ name: contact.name, address: contact.email })));
  expect(mail.from).toEqual({ name: "DCB Assist", address: config.sender });
  expect(mail.replyTo).toEqual({ name: details.name, address: details.email });
  for (const value of Object.values(details)) expect(mail.text).toContain(value);
  expect(mail.text).toContain("DCB-TEST");
  expect(mail.disableFileAccess).toBe(true);
  expect(mail.disableUrlAccess).toBe(true);
});

test("valid submissions are delivered once, even with concurrent browser retries", async () => {
  const delivered: QuoteDetails[] = [];
  const handler = createQuoteHandler({ getConfig: () => config, deliver: async value => { delivered.push(value); await new Promise(resolve => setTimeout(resolve, 20)); } });
  const requestId = randomUUID();
  const [first, retry] = await Promise.all([handler(request({ requestId, to: ["attacker@example.invalid"] })), handler(request({ requestId }))]);
  expect(first.status).toBe(202);
  expect(await first.json()).toEqual(await retry.json());
  expect(delivered).toEqual([details]);
  expect((await handler(request({ requestId, part: "Changed request" }))).status).toBe(409);
});

test("invalid fields, cross-origin posts, bots and oversized requests do not send email", async () => {
  let deliveries = 0;
  const handler = createQuoteHandler({ getConfig: () => config, deliver: async () => { deliveries++; } });
  expect((await handler(request({ email: "invalid", phone: "12", companyOrLocation: "" }))).status).toBe(400);
  expect((await handler(request({ name: "Test\r\nBcc: unwanted@example.invalid" }))).status).toBe(400);
  expect((await handler(request({}, "https://unrelated.example"))).status).toBe(403);
  expect((await handler(request({ website: "spam" }))).status).toBe(400);
  expect((await handler(request({ part: "x".repeat(13000) }))).status).toBe(413);
  expect(deliveries).toBe(0);
});

test("origin validation uses the requested host when Next normalises its internal URL", async () => {
  let deliveries = 0;
  const handler = createQuoteHandler({ getConfig: () => config, deliver: async () => { deliveries++; } });
  const localRequest = () => new Request("http://localhost:3001/api/quotes/", {
    method: "POST",
    headers: { "Content-Type": "application/json", Host: "127.0.0.1:3001", Origin: "http://127.0.0.1:3001" },
    body: JSON.stringify({ ...details, requestId: randomUUID() }),
  });
  expect((await handler(localRequest())).status).toBe(202);
  const mismatch = localRequest();
  mismatch.headers.set("origin", "http://localhost:3001");
  expect((await handler(mismatch)).status).toBe(403);
  const forwarded = localRequest();
  forwarded.headers.set("origin", "https://unrelated.example");
  forwarded.headers.set("x-forwarded-host", "unrelated.example");
  expect((await handler(forwarded)).status).toBe(403);
  expect(deliveries).toBe(1);
});

test("the running Next endpoint accepts same-origin validation and rejects cross-origin requests", async ({ request: api, baseURL }) => {
  // Empty data cannot send an email, even if local credentials are configured.
  const invalid = await api.post("/api/quotes/", { headers: { Origin: new URL(baseURL!).origin }, data: {} });
  expect(invalid.status()).toBe(400);
  expect((await invalid.json()).fields).toHaveProperty("email");
  const crossOrigin = await api.post("/api/quotes/", { headers: { Origin: "https://unrelated.example" }, data: {} });
  expect(crossOrigin.status()).toBe(403);
});

test("missing mail configuration and sending failures never return success", async () => {
  let deliveries = 0;
  const missing = createQuoteHandler({ getConfig: () => undefined, deliver: async () => { deliveries++; } });
  const unavailable = await missing(request());
  expect(unavailable.status).toBe(503);
  expect((await unavailable.json()).code).toBe("delivery_unavailable");
  expect(deliveries).toBe(0);
  const failure = createQuoteHandler({ getConfig: () => config, deliver: async () => { deliveries++; throw new Error("private provider details"); } });
  const requestId = randomUUID();
  const result = await failure(request({ requestId }));
  expect(result.status).toBe(503);
  expect(await result.text()).not.toContain("private provider details");
  expect((await failure(request({ requestId }))).status).toBe(503);
  expect(deliveries).toBe(1);
});

test("mail success requires acceptance for all four sales recipients", async () => {
  const accepted = salesContacts.map(contact => contact.email);
  await expect(deliverQuote(details, "DCB-TEST", config, () => ({ sendMail: async () => ({ accepted, rejected: [] }) }))).resolves.toBeUndefined();
  await expect(deliverQuote(details, "DCB-TEST", config, () => ({ sendMail: async () => ({ accepted: accepted.slice(0, 3), rejected: [accepted[3]] }) }))).rejects.toThrow("not confirmed");
});

test("repeat submissions are rate limited and the window expires", async () => {
  let time = 1_000_000, deliveries = 0;
  const handler = createQuoteHandler({ getConfig: () => config, now: () => time, deliver: async () => { deliveries++; } });
  for (let index = 0; index < 3; index++) expect((await handler(request())).status).toBe(202);
  expect((await handler(request())).status).toBe(429);
  time += 601_000;
  expect((await handler(request())).status).toBe(202);
  expect(deliveries).toBe(4);
});

test("Google Workspace supports either app passwords or OAuth without falling back to an unconfigured sender", () => {
  expect(getMailConfig({})).toBeUndefined();
  expect(getMailConfig({ GMAIL_USER: "quotes@dcbspares.co.za" })).toBeUndefined();
  expect(getMailConfig({ GMAIL_USER: "external@example.invalid", GMAIL_APP_PASSWORD: "fake" })).toBeUndefined();
  expect(getMailConfig({ GMAIL_USER: config.sender, GMAIL_APP_PASSWORD: "test only password" })?.auth).toEqual({ user: config.sender, pass: "testonlypassword" });
  expect(getMailConfig({ GMAIL_USER: config.sender, GMAIL_CLIENT_ID: "id", GMAIL_CLIENT_SECRET: "secret", GMAIL_REFRESH_TOKEN: "refresh" })?.auth).toEqual({ type: "OAuth2", user: config.sender, clientId: "id", clientSecret: "secret", refreshToken: "refresh" });
});
