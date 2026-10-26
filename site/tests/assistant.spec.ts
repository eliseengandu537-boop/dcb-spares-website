import { test, expect, type Locator } from "@playwright/test";
import sharp from "sharp";

test("demo assistant finds real products and opens their details",async({page})=>{
  await page.goto("/");
  await page.getByRole("button",{name:"Open DCB Assist"}).click();
  const assistant=page.getByRole("dialog",{name:"DCB Assist"});
  await expect(assistant).toBeVisible();
  await expect(assistant).toContainText("catalogue-based replies");
  await assistant.getByLabel("Message DCB Assist").fill("STR1246");
  await assistant.getByRole("button",{name:"Send message"}).click();
  await expect(assistant.locator(".assistant-product").first()).toContainText("STR1246");
  expect(await assistant.evaluate(el=>el.getBoundingClientRect().right<=innerWidth)).toBeTruthy();
  await assistant.locator(".assistant-product").first().click();
  await expect(assistant).not.toBeVisible();
  await expect(page.getByRole("heading",{level:1})).toContainText("Toyota D4D");
});

async function completeQuote(assistant: Locator, options: { general?: boolean; photo?: boolean } = {}) {
  await assistant.getByRole("button", { name: "How do I get a quote?" }).click();
  await expect(assistant.getByRole("log")).toContainText("vehicle details are optional");
  await expect(assistant.getByRole("link", { name: "Chat on WhatsApp", exact: true })).toHaveAttribute("href", /wa\.me\/27836303818/);
  await assistant.getByRole("button", { name: "Request with DCB Assist" }).click();
  await assistant.getByRole("button", { name: "Continue", exact: true }).click();
  expect(await assistant.getByLabel("What do you need a quote for?").evaluate((element: HTMLInputElement) => element.validity.valueMissing)).toBeTruthy();
  await assistant.getByLabel("What do you need a quote for?").fill(options.general ? "10 light bulbs\n24 V, part number unknown" : "Two aftermarket starters, STR1246");
  await expect(assistant.getByLabel("Vehicle make", { exact: true })).not.toBeVisible();
  if (!options.general) {
    await assistant.locator(".quote-vehicle-details summary").click();
    await assistant.getByLabel("Vehicle make", { exact: true }).fill("Toyota");
    await assistant.getByLabel("Vehicle model", { exact: true }).fill("Hilux 3.0, 2014");
  }
  if (options.photo) {
    const buffer = await sharp({ create: { width: 80, height: 60, channels: 3, background: "#ef3344" } }).png().toBuffer();
    await assistant.locator("#quote-photo").setInputFiles({ name: "bulb.png", mimeType: "image/png", buffer });
    await expect(assistant.getByRole("img", { name: "Photo supplied with this quote" })).toBeVisible();
  }
  await assistant.getByRole("button", { name: "Continue", exact: true }).click();
  await assistant.getByLabel("Your name", { exact: true }).fill("Test Customer");
  await assistant.getByLabel("Email address", { exact: true }).fill("customer@example.invalid");
  await assistant.getByLabel("Phone number", { exact: true }).fill("abc");
  await assistant.getByLabel("Company or location", { exact: true }).fill("Example Workshop, Cape Town");
  await assistant.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(assistant.getByText("Enter a valid contact number.")).toBeVisible();
  await assistant.getByLabel("Phone number", { exact: true }).fill("+27 82 123 4567");
  await assistant.getByRole("button", { name: "Continue", exact: true }).click();
}

test("DCB Assist collects, reviews and submits a quote with both contact options", async ({ page }) => {
  let submitted: Record<string, unknown> | undefined;
  await page.route("**/api/quotes/", async route => {
    submitted = route.request().postDataJSON();
    await route.fulfill({ status: 202, contentType: "application/json", body: JSON.stringify({ status: "submitted", reference: "DCB-TEST1234" }) });
  });
  await page.goto("/");
  await page.getByRole("button", { name: "Open DCB Assist" }).click();
  const assistant = page.getByRole("dialog", { name: "DCB Assist" });
  await completeQuote(assistant);
  for (const name of ["Hans", "Shane", "Gary", "Sean"]) await expect(assistant.getByRole("link", { name: `${name}@dcbspares.co.za`, exact: true })).toBeVisible();
  await assistant.getByRole("button", { name: "Back", exact: true }).click();
  await expect(assistant.getByLabel("Your name", { exact: true })).toHaveValue("Test Customer");
  await assistant.getByLabel("Company or location", { exact: true }).fill("Updated Workshop, Alrode");
  await assistant.getByRole("button", { name: "Continue", exact: true }).click();
  await assistant.getByRole("button", { name: "Submit quote request" }).click();
  await expect(assistant.getByRole("heading", { name: "Your quote request is submitted." })).toBeVisible();
  await expect(assistant).toContainText("DCB-TEST1234");
  expect(submitted).toMatchObject({
    part: "Two aftermarket starters, STR1246", make: "Toyota", model: "Hilux 3.0, 2014",
    name: "Test Customer", email: "customer@example.invalid", phone: "+27 82 123 4567", companyOrLocation: "Updated Workshop, Alrode",
  });
  expect(submitted).not.toHaveProperty("to");
  expect(await assistant.evaluate(element => element.scrollWidth <= element.clientWidth)).toBeTruthy();
});

test("a bulb quote can be submitted without a vehicle or photo", async ({ page }) => {
  let submitted: Record<string, unknown> | undefined;
  await page.route("**/api/quotes/", async route => {
    submitted = route.request().postDataJSON();
    await route.fulfill({ status: 202, contentType: "application/json", body: JSON.stringify({ status: "submitted", reference: "DCB-BULBTEST" }) });
  });
  await page.goto("/");
  await page.getByRole("button", { name: "Open DCB Assist" }).click();
  const assistant = page.getByRole("dialog", { name: "DCB Assist" });
  await completeQuote(assistant, { general: true });
  await expect(assistant.locator(".quote-review")).not.toContainText("Vehicle make");
  await assistant.getByRole("button", { name: "Submit quote request" }).click();
  await expect(assistant.getByRole("heading", { name: "Your quote request is submitted." })).toBeVisible();
  expect(submitted).toMatchObject({ part: "10 light bulbs\n24 V, part number unknown", make: "", model: "" });
});

test("an optional photo survives review and failed delivery and is sent with the quote", async ({ page }) => {
  let attempts = 0;
  let uploaded: File | undefined;
  const quotes: Record<string, unknown>[] = [];
  await page.route("**/api/quotes/", async route => {
    const form = await new Response(new Uint8Array(route.request().postDataBuffer()!), { headers: { "Content-Type": route.request().headers()["content-type"] } }).formData();
    uploaded = form.get("photo") as File;
    quotes.push(JSON.parse(String(form.get("quote"))));
    attempts++;
    await route.fulfill({ status: attempts === 1 ? 503 : 202, contentType: "application/json", body: JSON.stringify(attempts === 1 ? { error: "Sending is temporarily unavailable." } : { status: "submitted", reference: "DCB-PHOTOTEST" }) });
  });
  await page.goto("/");
  await page.getByRole("button", { name: "Open DCB Assist" }).click();
  const assistant = page.getByRole("dialog", { name: "DCB Assist" });
  await completeQuote(assistant, { general: true, photo: true });
  await expect(assistant.getByRole("img", { name: "Photo supplied with this quote" })).toBeVisible();
  await assistant.getByRole("button", { name: "Back", exact: true }).click();
  await assistant.getByRole("button", { name: "Back", exact: true }).click();
  await expect(assistant.getByRole("img", { name: "Photo supplied with this quote" })).toBeVisible();
  await assistant.getByRole("button", { name: "Continue", exact: true }).click();
  await assistant.getByRole("button", { name: "Continue", exact: true }).click();
  await assistant.getByRole("button", { name: "Submit quote request" }).click();
  await expect(assistant.getByRole("alert")).toContainText("The photo is not included in these links");
  await expect(assistant.getByRole("img", { name: "Photo supplied with this quote" })).toBeVisible();
  await assistant.getByRole("button", { name: "Submit quote request" }).click();
  await expect(assistant.getByRole("heading", { name: "Your quote request is submitted." })).toBeVisible();
  await expect(assistant).toContainText("Your photo is attached to the quote email");
  expect(quotes[0]).toMatchObject({ make: "", model: "" });
  expect(quotes[1].requestId).toBe(quotes[0].requestId);
  expect(uploaded?.type).toBe("image/jpeg");
  expect(uploaded!.size).toBeLessThan(3 * 1024 * 1024);
  expect((await sharp(Buffer.from(await uploaded!.arrayBuffer())).metadata()).format).toBe("jpeg");
});

test("invalid photos are explained and an attached photo can be removed", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Get a quote with DCB Assist" }).click();
  const assistant = page.getByRole("dialog", { name: "DCB Assist" });
  await assistant.getByLabel("What do you need a quote for?").fill("A replacement work light");
  await assistant.locator("#quote-photo").setInputFiles({ name: "not-a-photo.svg", mimeType: "image/svg+xml", buffer: Buffer.from("<svg/>") });
  await expect(assistant.getByRole("alert")).toContainText("Choose a JPG, PNG or WebP photo");
  await assistant.getByRole("button", { name: "Continue without a photo" }).click();
  const buffer = await sharp({ create: { width: 20, height: 20, channels: 3, background: "white" } }).png().toBuffer();
  await assistant.locator("#quote-photo").setInputFiles({ name: "light.png", mimeType: "image/png", buffer });
  await expect(assistant.getByRole("img", { name: "Photo supplied with this quote" })).toBeVisible();
  await assistant.getByRole("button", { name: "Remove photo", exact: true }).click();
  await expect(assistant.getByRole("img", { name: "Photo supplied with this quote" })).toHaveCount(0);
  await assistant.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(assistant.getByLabel("Your name", { exact: true })).toBeVisible();
});

test("an unavailable mail service preserves the quote and offers accurate WhatsApp and email fallbacks", async ({ page }) => {
  await page.route("**/api/quotes/", route => route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ error: "Online submission is not connected yet. Send your details using WhatsApp or email below." }) }));
  await page.goto("/");
  await page.getByRole("button", { name: "Open DCB Assist" }).click();
  const assistant = page.getByRole("dialog", { name: "DCB Assist" });
  await completeQuote(assistant);
  await assistant.getByRole("button", { name: "Submit quote request" }).click();
  await expect(assistant.getByRole("alert")).toContainText("Online submission is not connected yet");
  await expect(assistant.getByRole("heading", { name: "Your quote request is submitted." })).toHaveCount(0);
  const email = await assistant.getByRole("link", { name: "Email the sales team" }).getAttribute("href");
  expect(email).toContain("Hans@dcbspares.co.za,Shane@dcbspares.co.za,Gary@dcbspares.co.za,Sean@dcbspares.co.za");
  expect(decodeURIComponent(email!)).toContain("customer@example.invalid");
  const handoff = await assistant.getByRole("link", { name: "Send on WhatsApp" }).getAttribute("href");
  expect(new URL(handoff!).searchParams.get("text")).toContain("Example Workshop, Cape Town");
  await assistant.getByRole("button", { name: "Back", exact: true }).click();
  await expect(assistant.getByLabel("Email address", { exact: true })).toHaveValue("customer@example.invalid");
});

test("homepage and brand pages identify GB distribution and aftermarket compatibility", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".alternator-intro")).toContainText("DCB Spares is the primary distributor of GB products.");
  await expect(page.locator(".brand-strip")).toContainText("We supply aftermarket equivalents compatible with these vehicles.");
  await expect(page.locator(".brand-strip")).toContainText("DCB does not manufacture or distribute these vehicle makers’ branded parts.");
  await expect(page.locator(".floating-whatsapp")).toHaveAttribute("href", /wa\.me\/27836303818/);
  await page.getByRole("button", { name: "Get a quote with DCB Assist" }).click();
  await expect(page.getByRole("dialog", { name: "DCB Assist" }).getByRole("heading", { name: "What do you need a quote for?" })).toBeVisible();
  await page.keyboard.press("Escape");
  await page.goto("/brands/toyota/");
  await expect(page.locator(".brand-detail-heading")).toContainText("AFTERMARKET PARTS COMPATIBLE WITH");
  await expect(page.locator(".brand-detail-heading")).toContainText("aftermarket auto-electrical parts listed for Toyota");
  await expect(page).toHaveTitle(/Aftermarket parts compatible with Toyota/);
});

test("demo quick replies, quote handoff, reset and keyboard close work",async({page})=>{
  await page.goto("/");
  const launcher=page.getByRole("button",{name:"Open DCB Assist"});
  await launcher.click();
  const assistant=page.getByRole("dialog",{name:"DCB Assist"});
  await assistant.getByRole("button",{name:"Where are your branches?"}).click();
  await expect(assistant.getByRole("log")).toContainText("25 Palmiet Road");
  await assistant.getByLabel("Message DCB Assist").fill("How much is a starter?");
  await assistant.getByRole("button",{name:"Send message"}).click();
  await expect(assistant.getByRole("log")).toContainText("confirm the price, stock and correct fit");
  const handoff=assistant.getByRole("link",{name:"Chat with our team"});
  await expect(handoff).toHaveAttribute("href",/wa\.me\/27836303818/);
  expect(new URL((await handoff.getAttribute("href"))!).searchParams.get("text")).toContain("How much is a starter?");
  await assistant.getByRole("button",{name:"Start a new conversation"}).click();
  await expect(assistant.getByRole("button",{name:"Toyota Hilux starter"})).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(assistant).not.toBeVisible();
  await expect(launcher).toBeFocused();
  expect(await page.evaluate(()=>document.body.style.overflow)).not.toBe("hidden");
});
