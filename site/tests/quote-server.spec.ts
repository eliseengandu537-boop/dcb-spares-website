import { test, expect } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { createQuoteHandler } from "../src/lib/server/quote-handler";
import { buildQuoteEmail, deliverQuote, getMailConfig, type MailConfig } from "../src/lib/server/quote-delivery";
import type { QuoteDetails } from "../src/lib/quote";
import { quoteEmailLink, quoteText } from "../src/lib/quote";
import { getQuoteRouting, quoteAreas, quoteAreaLabel, type QuoteTerritories } from "../src/lib/quote-routing";
import { maxUploadPhotoBytes } from "../src/lib/quote-photo";
import type { QuotePhotoAttachment } from "../src/lib/server/quote-photo";
import sharp from "sharp";

const details: QuoteDetails = {
  part: "2 aftermarket starter motors, STR1246",
  make: "Toyota",
  model: "Hilux 3.0 D-4D, 2014",
  name: "Test Customer",
  email: "customer@example.invalid",
  phone: "+27 82 123 4567",
  area: "not-sure",
  companyOrLocation: "Test Workshop, Cape Town",
};
const config: MailConfig = { sender: "quotes@dcbspares.co.za", auth: { user: "quotes@dcbspares.co.za", pass: "test-only-not-real" } };
const request = (overrides: Record<string, unknown> = {}, origin = "http://localhost:3001") => new Request("http://localhost:3001/api/quotes/", {
  method: "POST",
  headers: { "Content-Type": "application/json", Origin: origin },
  body: JSON.stringify({ ...details, requestId: randomUUID(), ...overrides }),
});

function photoRequest(bytes: Buffer, type = "image/jpeg", requestId = randomUUID(), extraPhoto = false) {
  const form = new FormData();
  form.append("quote", JSON.stringify({ ...details, part: "10 work light bulbs\n24 V", make: "", model: "", requestId }));
  form.append("photo", new Blob([new Uint8Array(bytes)], { type }), "../../customer-photo.jpg");
  if (extraPhoto) form.append("photo", new Blob([new Uint8Array(bytes)], { type }), "second.jpg");
  return new Request("http://localhost:3001/api/quotes/", { method: "POST", headers: { Origin: "http://localhost:3001" }, body: form });
}

test("general items need no vehicle information and retain multiline descriptions", async () => {
  let received: QuoteDetails | undefined;
  const handler = createQuoteHandler({ getConfig: () => config, deliver: async value => { received = value; } });
  const result = await handler(request({ make: undefined, model: undefined, part: "10 work light bulbs\n24 V" }));
  expect(result.status).toBe(202);
  expect(received).toMatchObject({ make: "", model: "", part: "10 work light bulbs\n24 V" });
  expect(quoteText(received!)).not.toContain("Vehicle make");
  const email = buildQuoteEmail(received!, "DCB-BULBS", config.sender);
  expect(email.subject).toContain("10 work light bulbs 24 V");
  expect(email.subject).not.toContain("\n");
  expect(email.attachments).toBeUndefined();
});

test("photo quotes deliver a private metadata-free attachment and deduplicate retries", async () => {
  const original = await sharp({ create: { width: 80, height: 60, channels: 3, background: "#ef3344" } }).withMetadata({ orientation: 6 }).jpeg().toBuffer();
  let photo: QuotePhotoAttachment | undefined;
  let received: QuoteDetails | undefined;
  let deliveries = 0;
  const handler = createQuoteHandler({ getConfig: () => config, deliver: async (value, _reference, _config, attachment) => { received = value; photo = attachment; deliveries++; } });
  const requestId = randomUUID();
  const [first, retry] = await Promise.all([handler(photoRequest(original, "image/jpeg", requestId)), handler(photoRequest(original, "image/jpeg", requestId))]);
  expect(first.status).toBe(202);
  expect(await first.json()).toEqual(await retry.json());
  expect(deliveries).toBe(1);
  expect(photo?.filename).toBe("quote-photo.jpg");
  const metadata = await sharp(photo!.content).metadata();
  expect(metadata).toMatchObject({ format: "jpeg", width: 60, height: 80 });
  expect(metadata.exif).toBeUndefined();
  expect(metadata.icc).toBeUndefined();
  expect(metadata.xmp).toBeUndefined();
  let sentPhoto: unknown;
  await deliverQuote(received!, "DCB-PHOTO", config, photo, () => ({ sendMail: async mail => {
    expect(mail.to).toEqual([{ name: "Gary", address: "Gary@dcbspares.co.za" }]);
    expect(mail.cc).toBeUndefined();
    sentPhoto = mail.attachments?.[0];
    return { accepted: ["Gary@dcbspares.co.za"], rejected: [] };
  } }));
  expect(sentPhoto).toEqual(photo);
  const different = await sharp({ create: { width: 20, height: 20, channels: 3, background: "white" } }).jpeg().toBuffer();
  expect((await handler(photoRequest(different, "image/jpeg", requestId))).status).toBe(409);
});

test("invalid, oversized, disguised and multiple photo uploads never send mail", async () => {
  let deliveries = 0;
  const makeHandler = () => createQuoteHandler({ getConfig: () => config, deliver: async () => { deliveries++; } });
  for (const [bytes, type] of [[Buffer.from("not an image"), "image/jpeg"], [Buffer.from("<svg><script>alert(1)</script></svg>"), "image/jpeg"], [Buffer.from("<svg/>"), "image/svg+xml"]] as const) {
    const result = await makeHandler()(photoRequest(bytes, type));
    expect(result.status).toBe(400);
    expect(await result.json()).toHaveProperty("photoError");
  }
  // Model incoming bytes directly: Node's outgoing FormData stream can throw
  // asynchronously if cancelled while it is still encoding an oversized file.
  const oversized = new Request("http://localhost:3001/api/quotes/", {
    method: "POST", headers: { Origin: "http://localhost:3001", "Content-Type": "multipart/form-data; boundary=test" },
    body: Buffer.alloc(maxUploadPhotoBytes + 20_000),
  });
  expect((await makeHandler()(oversized)).status).toBe(413);
  const image = await sharp({ create: { width: 20, height: 20, channels: 3, background: "white" } }).png().toBuffer();
  expect((await makeHandler()(photoRequest(image, "image/png", randomUUID(), true))).status).toBe(400);
  expect((await makeHandler()(photoRequest(image, "image/jpeg"))).status).toBe(400);
  const crossOrigin = photoRequest(image, "image/png");
  crossOrigin.headers.set("origin", "https://unrelated.example");
  expect((await makeHandler()(crossOrigin)).status).toBe(403);
  expect(deliveries).toBe(0);
});

test("unassigned quotes go only to Gary with all supplied details and the customer's reply-to", () => {
  const mail = buildQuoteEmail(details, "DCB-TEST", config.sender);
  expect(mail.to).toEqual([{ name: "Gary", address: "Gary@dcbspares.co.za" }]);
  expect(mail.cc).toBeUndefined();
  expect(mail.from).toEqual({ name: "DCB Assist", address: config.sender });
  expect(mail.replyTo).toEqual({ name: details.name, address: details.email });
  for (const [key, value] of Object.entries(details)) expect(mail.text).toContain(key === "area" ? quoteAreaLabel(value) : value);
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

test("mail success requires both the assigned rep and Gary to be accepted", async () => {
  const routedConfig = { ...config, territories: { gauteng: "Hans" } satisfies QuoteTerritories };
  const localDetails = { ...details, area: "gauteng" };
  const accepted = ["Hans@dcbspares.co.za", "Gary@dcbspares.co.za"];
  await expect(deliverQuote(localDetails, "DCB-TEST", routedConfig, undefined, () => ({ sendMail: async mail => {
    expect(mail.to).toEqual([{ name: "Hans", address: "Hans@dcbspares.co.za" }]);
    expect(mail.cc).toEqual([{ name: "Gary", address: "Gary@dcbspares.co.za" }]);
    return { accepted, rejected: [] };
  } }))).resolves.toBeUndefined();
  for (const missing of accepted) {
    await expect(deliverQuote(localDetails, "DCB-TEST", routedConfig, undefined, () => ({ sendMail: async () => ({ accepted: accepted.filter(email => email !== missing), rejected: [] }) }))).rejects.toThrow("not confirmed");
  }
});

test("confirmed territory routing chooses one rep, always copies Gary, and matches the email fallback", () => {
  // Illustrative fixtures only; these are not DCB's actual territory assignments.
  const territories = { gauteng: "Hans", "western-cape": "Shane", "eastern-cape": "Sean" } satisfies QuoteTerritories;
  for (const [area, owner] of Object.entries(territories)) {
    const quote = { ...details, area };
    const mail = buildQuoteEmail(quote, "DCB-ROUTING", config.sender, undefined, territories);
    expect(mail.to).toEqual([{ name: owner, address: `${owner}@dcbspares.co.za` }]);
    expect(mail.cc).toEqual([{ name: "Gary", address: "Gary@dcbspares.co.za" }]);
    expect(mail.text).toContain(`Sales owner: ${owner}`);
    const fallback = new URL(quoteEmailLink(quote, territories));
    expect(fallback.pathname).toBe(`${owner}@dcbspares.co.za`);
    expect(fallback.searchParams.get("cc")).toBe("Gary@dcbspares.co.za");
  }
  for (const area of [...Object.keys(quoteAreas), "", "constructor", "unknown"]) {
    const routing = getQuoteRouting(area, {});
    expect(routing.to.email).toBe("Gary@dcbspares.co.za");
    expect(routing.cc).toBeUndefined();
  }
});

test("area validation supports older forms and never accepts customer-supplied recipients", async () => {
  const received: QuoteDetails[] = [];
  const handler = createQuoteHandler({ getConfig: () => config, deliver: async value => { received.push(value); } });
  expect((await handler(request({ area: "", to: "attacker@example.invalid" }))).status).toBe(400);
  expect((await handler(request({ area: "constructor" }))).status).toBe(400);
  expect((await handler(request({ area: undefined, to: ["attacker@example.invalid"], cc: ["Sean@dcbspares.co.za"], territories: { "not-sure": "Sean" } }))).status).toBe(202);
  expect(received[0]).toEqual(details);
  const mail = buildQuoteEmail(received[0], "DCB-LEGACY", config.sender);
  expect(mail.to).toEqual([{ name: "Gary", address: "Gary@dcbspares.co.za" }]);
  expect(mail.cc).toBeUndefined();
  expect(quoteEmailLink(received[0])).toMatch(/^mailto:Gary@dcbspares\.co\.za\?/);
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
