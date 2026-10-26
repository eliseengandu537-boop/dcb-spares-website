import { createHash, randomUUID } from "node:crypto";
import { validateQuote, type QuoteDetails } from "../quote";
import { DeliveryUnavailable, type MailConfig } from "./quote-delivery";
import { InvalidQuotePhoto, readQuotePhoto, type QuotePhotoAttachment } from "./quote-photo";
import { maxUploadPhotoBytes } from "../quote-photo";

type Dependencies = {
  getConfig: () => MailConfig | undefined;
  deliver: (details: QuoteDetails, reference: string, config: MailConfig, photo?: QuotePhotoAttachment) => Promise<void>;
  now?: () => number;
};
const response = (data: object, status: number) => Response.json(data, { status, headers: { "Cache-Control": "no-store" } });
const tenMinutes = 600_000;
const maxBytes = 12_000;

async function readBody(request: Request) {
  const contentType = request.headers.get("content-type") || "";
  const multipart = contentType.startsWith("multipart/form-data");
  const limit = multipart ? maxUploadPhotoBytes + 16_384 : maxBytes;
  if (Number(request.headers.get("content-length") || 0) > limit) throw new RangeError("Request too large");
  const reader = request.body?.getReader();
  if (!reader) throw new SyntaxError("Missing request");
  const chunks: Uint8Array[] = [];
  let length = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    length += value.byteLength;
    if (length > limit) { await reader.cancel(); throw new RangeError("Request too large"); }
    chunks.push(value);
  }
  const buffer = Buffer.concat(chunks);
  if (!multipart) return { input: JSON.parse(buffer.toString("utf8")) as Record<string, unknown>, photo: undefined };
  const form = await new Response(buffer, { headers: { "Content-Type": contentType } }).formData();
  const quote = form.get("quote");
  if (typeof quote !== "string" || quote.length > maxBytes || form.getAll("quote").length !== 1) throw new SyntaxError("Invalid quote");
  const photo = form.get("photo");
  if ((photo !== null && !(photo instanceof File)) || form.getAll("photo").length > 1) throw new InvalidQuotePhoto("Please attach one JPG, PNG or WebP photo.");
  return { input: JSON.parse(quote) as Record<string, unknown>, photo: photo ?? undefined };
}

export function createQuoteHandler({ getConfig, deliver, now = Date.now }: Dependencies) {
  // Single-instance limits. No customer text or credentials are logged or persisted.
  const requests = new Map<string, { digest: string; expires: number; result: Promise<Response> }>();
  const customers = new Map<string, { count: number; expires: number }>();
  let windowStarted = 0, windowCount = 0;
  return async function POST(request: Request) {
    const origin = request.headers.get("origin");
    const url = new URL(request.url);
    // Next may use its internal hostname in request.url. Match the browser's
    // actual Host header, which browser JavaScript cannot override.
    const expectedOrigin = `${url.protocol}//${request.headers.get("host") || url.host}`;
    if (!origin || origin !== expectedOrigin) return response({ error: "Please submit your quote from the DCB website." }, 403);
    const contentType = request.headers.get("content-type") || "";
    if (!contentType.startsWith("application/json") && !contentType.startsWith("multipart/form-data")) return response({ error: "Please send a valid quote request." }, 415);
    let input: Record<string, unknown>;
    let uploadedPhoto: File | undefined;
    try { ({ input, photo: uploadedPhoto } = await readBody(request)); }
    catch (error) {
      if (error instanceof InvalidQuotePhoto) return response({ error: error.message, photoError: error.message }, 400);
      return response({ error: error instanceof RangeError ? "This request is too large. Choose a smaller photo or continue without one." : "Please check your quote details and try again." }, error instanceof RangeError ? 413 : 400);
    }
    if (!input || typeof input !== "object" || input.website) return response({ error: "Please check your quote details." }, 400);
    const { data, errors } = validateQuote(input);
    if (!data) return response({ error: "Please check the highlighted details.", fields: errors }, 400);
    if (typeof input.requestId !== "string" || !/^[0-9a-f-]{36}$/i.test(input.requestId)) return response({ error: "Please start a new quote request." }, 400);
    const config = getConfig();
    if (!config) return response({ error: "Online submission is not connected yet. You can send these details to DCB using WhatsApp or email below.", code: "delivery_unavailable" }, 503);
    const time = now();
    for (const [key, value] of requests) if (value.expires <= time) requests.delete(key);
    for (const [key, value] of customers) if (value.expires <= time) customers.delete(key);
    const photoBytes = uploadedPhoto ? Buffer.from(await uploadedPhoto.arrayBuffer()) : undefined;
    const digest = createHash("sha256").update(JSON.stringify(data)).update(uploadedPhoto?.type ?? "").update(photoBytes ?? "").digest("hex");
    const existing = requests.get(input.requestId);
    if (existing) {
      if (existing.digest !== digest) return response({ error: "The details changed. Please review and submit a new quote." }, 409);
      return (await existing.result).clone();
    }
    const customer = createHash("sha256").update(data.email.toLowerCase()).digest("hex");
    const attempts = customers.get(customer);
    if (time - windowStarted >= 60_000) { windowStarted = time; windowCount = 0; }
    if (windowCount >= 20 || (attempts?.count ?? 0) >= 3) return response({ error: "Please wait a few minutes before trying again, or contact DCB on WhatsApp." }, 429);
    windowCount++;
    customers.set(customer, { count: (attempts?.count ?? 0) + 1, expires: attempts?.expires ?? time + tenMinutes });
    const reference = `DCB-${randomUUID().slice(0, 8).toUpperCase()}`;
    const result = (async () => {
      let photo: QuotePhotoAttachment | undefined;
      try { if (uploadedPhoto && photoBytes) photo = await readQuotePhoto(uploadedPhoto, photoBytes); }
      catch (error) {
        const message = error instanceof InvalidQuotePhoto ? error.message : "The photo could not be processed. Please try another image.";
        return response({ error: message, photoError: message }, 400);
      }
      try {
        await deliver(data, reference, config, photo);
        return response({ status: "submitted", reference }, 202);
      } catch (error) {
        // Keep the outcome for this request ID so a network retry cannot send twice.
        return response({
          error: error instanceof DeliveryUnavailable
            ? "Online submission is temporarily unavailable. Please send your details by WhatsApp or email below."
            : "We couldn’t confirm submission. Please contact DCB on WhatsApp or email with your details.",
          code: "delivery_unavailable",
        }, 503);
      }
    })();
    requests.set(input.requestId, { digest, expires: time + tenMinutes, result });
    return (await result).clone();
  };
}
