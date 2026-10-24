import { test, expect } from "@playwright/test";

test("home loads its assets without errors and fits the viewport", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("journey");
  for (const image of await page.locator("img").all()) {
    await image.scrollIntoViewIfNeeded();
    await expect.poll(() => image.evaluate(element => element instanceof HTMLImageElement && element.complete && element.naturalWidth > 0)).toBeTruthy();
  }
  await page.locator(".footer").scrollIntoViewIfNeeded();
  await page.evaluate(() => document.fonts.ready);
  expect(await page.locator("img").evaluateAll(images => images.every(image => image instanceof HTMLImageElement && image.complete && image.naturalWidth > 0))).toBeTruthy();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
  expect(errors).toEqual([]);
});

test("page scrolls freely while the alternator opens, explains parts, and closes", async ({ page }) => {
  await page.goto("/");
  const story = page.locator(".alternator-experience");
  await expect(story).toHaveAttribute("data-mode", "interactive", { timeout: 30000 });
  await expect(story.locator("canvas")).toBeVisible();
  const metrics = await story.evaluate(element => {
    const stage = element.querySelector(".alternator-stage")!;
    return {
      start: window.scrollY + stage.getBoundingClientRect().top,
      range: stage.getBoundingClientRect().height * 0.6,
    };
  });
  const spread = () => story.locator(".alternator-part-tags > span").evaluateAll(labels => {
    const first = labels[0].getBoundingClientRect(), last = labels[5].getBoundingClientRect();
    return Math.abs((last.left + last.width / 2) - (first.left + first.width / 2));
  });
  const scrollTo = async (progress: number) => {
    await page.evaluate(top => window.scrollTo({ top, behavior: "instant" }), metrics.start + metrics.range * progress);
  };
  await scrollTo(0);
  await expect(story).toHaveAttribute("data-phase", "assembled");
  const closed = await spread();
    const before = await page.evaluate(() => ({
      hero: document.querySelector(".alternator-stage")!.getBoundingClientRect().top,
      search: document.querySelector(".finder-bar")!.getBoundingClientRect().top,
    }));
    await page.evaluate(() => window.scrollBy({ top: 200, behavior: "instant" }));
    // The hero and following content must move immediately, even mid-animation.
    await expect.poll(() => story.locator(".alternator-stage").evaluate(element => element.getBoundingClientRect().top)).toBeLessThanOrEqual(before.hero - 195);
    await expect.poll(() => page.locator(".finder-bar").evaluate(element => element.getBoundingClientRect().top)).toBeLessThanOrEqual(before.search - 195);
    await expect(story).toHaveAttribute("data-phase", "opening");
    await expect(story.locator(".alternator-intro")).not.toHaveAttribute("inert", "");
  await scrollTo(0.95);
  await expect(story).toHaveAttribute("data-phase", "exploded");
  await expect.poll(spread).toBeGreaterThan(closed * 1.3);
  await expect(story.locator(".alternator-part-description")).not.toBeVisible();
  await story.locator("summary").click();
  await story.getByRole("button", { name: "04 Rotor & shaft" }).click();
  await expect(story.locator(".alternator-part-description")).toContainText("changing magnetic field");
  await story.getByRole("button", { name: "06 Drive pulley" }).click();
  await expect(story.locator(".alternator-part-description")).toContainText("engine’s belt");
  await story.locator("summary").click();
  await expect(story.locator(".alternator-part-description")).not.toBeVisible();
  await scrollTo(0);
  await expect(story).toHaveAttribute("data-phase", "assembled");
  await expect.poll(async () => Math.abs(await spread() - closed)).toBeLessThan(2);
  await expect(story.getByRole("link", { name: "Explore our parts" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
});

test("alternator keeps its photo and readable details when WebGL is unavailable", async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, ...args: Parameters<typeof original>) {
      if (String(args[0]).includes("webgl")) return null;
      return original.apply(this, args);
    } as typeof original;
  });
  await page.goto("/");
  await expect(page.locator(".alternator-experience")).toHaveAttribute("data-mode", "static");
  await expect(page.getByRole("img", { name: "DCB GB alternator", exact: true })).toBeVisible();
  await page.locator(".alternator-explainer summary").click();
  await page.getByRole("button", { name: "06 Drive pulley" }).click();
  await expect(page.locator(".alternator-part-description")).toContainText("engine’s belt");
  expect(await page.locator(".alternator-stage").evaluate(element => getComputedStyle(element).position)).toBe("relative");
});

test("search, filters, empty state and reset work", async ({ page }) => {
  await page.goto("/");
  await page.locator("#home-search").fill("alternator");
  await page.getByRole("button", { name: "Search products", exact: true }).click();
  await expect(page).toHaveURL(/products\/\?q=alternator/);
  await expect(page.locator(".parts-grid")).toContainText("Alternator");
  await page.getByRole("button", { name: "Clear search" }).click();
  await expect(page.locator(".parts-grid .part-card")).toHaveCount(24);
  const firstProduct = await page.locator(".parts-grid .part-card").first().getAttribute("href");
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(page.getByRole("navigation", { name: "Product pages" })).toContainText("Page 2");
  expect(await page.locator(".parts-grid .part-card").first().getAttribute("href")).not.toBe(firstProduct);
  await page.getByRole("button", { name: "Product ranges" }).click();
  await page.getByRole("button", { name: "Lighting", exact: true }).click();
  await expect(page.locator(".catalogue-grid .product-card")).toHaveCount(3);
  await page.locator("#catalogue-search").fill("not-a-real-category");
  await expect(page.getByRole("heading", { name: "Let’s find it together." })).toBeVisible();
  await page.getByRole("button", { name: "Reset all filters" }).click();
  await expect(page.locator(".catalogue-grid .product-card")).toHaveCount(16);
});

test("enquiry validates, previews safely encoded details, and closes with Escape", async ({ page }) => {
  await page.goto("/products/starters/");
  await page.getByRole("button", { name: "Enquire about this range" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.getByLabel("What part do you need?")).toHaveValue("Starter motors");
  await dialog.getByRole("button", { name: "Prepare WhatsApp enquiry" }).click();
  expect(await dialog.locator("input[name=name]").evaluate((input: HTMLInputElement) => input.validity.valueMissing)).toBeTruthy();
  await expect(dialog.locator(".enquiry-ready")).toHaveCount(0);
  await dialog.getByLabel("Your name").fill("Alex & Co");
  await dialog.getByLabel("Vehicle or equipment").fill("Toyota Hilux 3.0, 2014");
  await dialog.getByLabel("Part number").fill("OE+123/45");
  await dialog.getByRole("button", { name: "Prepare WhatsApp enquiry" }).click();
  await expect(dialog.getByRole("heading", { name: "Your enquiry is ready." })).toBeVisible();
  const href = await dialog.getByRole("link", { name: "Continue to WhatsApp" }).getAttribute("href");
  const url = new URL(href!);
  expect(url.hostname).toBe("wa.me");
  expect(url.pathname).toBe("/27836303818");
  expect(url.searchParams.get("text")).toContain("Alex & Co");
  expect(url.searchParams.get("text")).toContain("OE+123/45");
  await dialog.getByRole("button", { name: "Edit enquiry" }).click();
  await expect(dialog.getByLabel("Your name")).toHaveValue("Alex & Co");
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(page.getByRole("button", { name: "Enquire about this range" })).toBeFocused();
});

test("navigation and category routes work", async ({ page, isMobile }) => {
  await page.goto("/");
  if (isMobile) {
    await page.getByRole("button", { name: "Open menu" }).click();
    await page.getByRole("navigation", { name: "Mobile navigation" }).getByRole("link", { name: "Vehicle brands" }).click();
    await expect(page.getByRole("navigation", { name: "Mobile navigation" })).toHaveCount(0);
  } else {
    await page.getByRole("navigation", { name: "Main navigation" }).getByRole("link", { name: "Vehicle brands" }).click();
  }
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Different badges");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
  await page.goto("/products/alternators/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Alternators");
  await expect(page.getByRole("link", { name: "Explore 457 products" })).toHaveAttribute("href", "#product-list");
  await expect(page.locator(".parts-grid .part-card")).toHaveCount(24);
  await page.goto("/contact/");
  await expect(page.getByRole("heading", { name: "Cape Town." })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
});

test("part number and OE search open the original gallery and specifications", async ({ page }) => {
  await page.goto("/products/");
  await page.getByLabel("Search products", { exact: true }).fill("F004A94008");
  const part = page.locator(".part-card").filter({ hasText: "STR1246" });
  await expect(part).toHaveCount(1);
  await part.click();
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Toyota D4D");
  await expect(page.locator(".specification-table")).toContainText("281000L080");
  await page.getByRole("button", { name: "Show product view 2", exact: true }).click();
  await expect(page.getByRole("button", { name: "Show product view 2", exact: true })).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Enlarge product photograph" }).click();
  await expect(page.getByRole("dialog", { name: "Enlarged product photograph" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: "Enlarged product photograph" })).not.toBeVisible();
  await page.getByRole("button", { name: "Enquire about this part" }).click();
  await expect(page.getByRole("dialog").getByLabel("What part do you need?")).toHaveValue(/STR1246/);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
});

test("brand ranges, original category routes and full profile are available", async ({ page, request }) => {
  await page.goto("/brands/toyota/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Toyota.");
  await expect(page.locator(".catalogue-result-line")).toContainText("119 products");
  await page.getByRole("combobox", { name: "Product range", exact: true }).selectOption("alternators");
  await expect(page.locator(".parts-grid")).toContainText("Alternator");
  await page.goto("/category/31-bearings/");
  await expect(page.locator(".parts-grid .part-card")).toHaveCount(8);
  await page.goto("/company-profile/");
  await expect(page.locator(".profile-pages figure")).toHaveCount(5);
  const download = page.getByRole("link", { name: "Download company profile" });
  await expect(download).toHaveAttribute("download", "");
  const pdf = await request.get((await download.getAttribute("href"))!);
  expect(pdf.status()).toBe(200);
  expect((await pdf.body()).subarray(0,4).toString()).toBe("%PDF");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
});

test("reduced motion is respected and core content works without JavaScript", async ({ browser, page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  expect(await page.locator(".atmosphere").evaluate(element => getComputedStyle(element).animationName)).toBe("none");
  const context = await browser.newContext({ javaScriptEnabled: false });
  const plain = await context.newPage();
  await plain.goto("/");
  await expect(plain.getByRole("heading", { name: /Built to perform/ })).toBeVisible();
  await expect(plain.getByRole("link", { name: "Explore our parts" })).toBeVisible();
  await context.close();
});
