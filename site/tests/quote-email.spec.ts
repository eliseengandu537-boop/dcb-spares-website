import { test, expect } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import sharp from "sharp";
import { buildQuoteEmail } from "../src/lib/server/quote-delivery";
import type { QuoteDetails } from "../src/lib/quote";

const sample: QuoteDetails = {
  part: "2 aftermarket starter motors\nPart number: STR1246\nPlease confirm price, availability and delivery to Johannesburg.",
  make: "Toyota", model: "Hilux 3.0 D-4D, 2014",
  name: "Alex Mokoena (sample)", email: "alex@example.invalid", phone: "+27 00 000 0000",
  area: "gauteng", companyOrLocation: "Example Auto Workshop, Johannesburg",
};

test("quote email is readable on desktop and phone with working contact links and a visible photo", async ({ page }, testInfo) => {
  const content = await sharp("public/images/original/starters.webp").resize(480, 300, { fit: "inside" }).jpeg().toBuffer();
  const mail = buildQuoteEmail(sample, "DCB-PREVIEW", "eliseeweb@gmail.com", { filename: "quote-photo.jpg", content, contentType: "image/jpeg" }, undefined, new Date("2026-10-26T08:30:00Z"));
  // The real email uses a CID attachment. Only this local, synthetic preview
  // substitutes a data URL so an ordinary browser can display that same photo.
  const html = String(mail.html).replace(`cid:${mail.attachments![0].cid}`, `data:image/jpeg;base64,${content.toString("base64")}`);
  await page.setContent(html);
  await expect(page.getByRole("heading", { name: "New quote request." })).toBeVisible();
  await expect(page.getByText(sample.name, { exact: true })).toBeVisible();
  await expect(page.getByText(sample.companyOrLocation, { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Assigned to Sean" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Reply to customer", exact: true })).toHaveAttribute("href", "mailto:alex@example.invalid?subject=Re%3A%20DCB%20quote%20DCB-PREVIEW");
  await expect(page.getByRole("link", { name: "Call customer", exact: true })).toHaveAttribute("href", "tel:+27000000000");
  const photo = page.getByRole("img", { name: "Photo supplied by the customer with this quote request" });
  await expect(photo).toBeVisible();
  expect(await photo.evaluate((element: HTMLImageElement) => element.complete && element.naturalWidth > 0)).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await mkdir("artifacts", { recursive: true });
  await page.screenshot({ path: `artifacts/quote-email-${testInfo.project.name}.png`, fullPage: true });
  if (testInfo.project.name === "desktop") {
    const preview = html.replace(/(<body[^>]*>)/, '$1<div style="padding:16px;text-align:center;font-family:Arial,sans-serif;font-size:13px;background:#fff8e6;color:#584214;">EMAIL TEMPLATE PREVIEW · Sample customer details · To: Sean · CC: Gary</div>');
    await writeFile("artifacts/quote-email-preview.html", preview);
  }
});

test("long customer text stays readable at narrow widths and general items need no vehicle fields", async ({ page }, testInfo) => {
  if (testInfo.project.name === "mobile") await page.setViewportSize({ width: 320, height: 700 });
  const quote = { ...sample, make: "", model: "", part: "Bulb-" + "x".repeat(495), name: "N".repeat(100), email: `${"e".repeat(135)}@example.invalid`, companyOrLocation: "W".repeat(160) };
  const mail = buildQuoteEmail(quote, "DCB-LONG", "sender@example.invalid");
  await page.setContent(String(mail.html));
  await expect(page.getByRole("heading", { name: "Vehicle details supplied by the customer" })).toHaveCount(0);
  await expect(page.getByText(quote.part, { exact: true })).toBeVisible();
  await expect(page.getByText(quote.companyOrLocation, { exact: true })).toBeVisible();
  await expect(page.getByText("No photo supplied with this request.")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
