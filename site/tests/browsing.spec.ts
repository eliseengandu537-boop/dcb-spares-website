import { test, expect } from "@playwright/test";

test("search stays reachable through the catalogue and filters can be cleared", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto("/products/#catalogue-search");
  const search = page.getByRole("searchbox", { name: "Search products" });
  await expect(search).toBeInViewport();
  await expect.poll(() => search.evaluate(element => element.getBoundingClientRect().top)).toBeLessThan(150);
  await page.locator(".part-card").nth(12).scrollIntoViewIfNeeded();
  await expect(search).toBeInViewport();
  const searchTop = await search.evaluate(element => element.getBoundingClientRect().top);
  const headerBottom = await page.locator(".nav-shell").evaluate(element => element.getBoundingClientRect().bottom);
  expect(searchTop).toBeGreaterThanOrEqual(headerBottom);
  await page.getByRole("link", { name: "Go to filters" }).click();
  const range = page.getByRole("combobox", { name: "Product range", exact: true });
  await expect(range).toBeInViewport();
  await range.selectOption("alternators");
  await expect(page.getByRole("status")).toContainText("457 products");
  await page.getByRole("button", { name: "Clear filters", exact: true }).click();
  await expect(range).toHaveValue("");
  await expect(page.getByRole("status")).toContainText("1,528 products");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
  expect(errors).toEqual([]);
});

test("mobile shortcuts open help, find parts and return to the top", async ({ page, isMobile }) => {
  test.skip(!isMobile, "The shortcuts replace floating buttons on phones.");
  await page.goto("/");
  const actions = page.getByRole("navigation", { name: "Quick actions" });
  await expect(actions).toBeVisible();
  await expect(actions.getByRole("link", { name: /WhatsApp/ })).toHaveAttribute("href", /wa\.me\/27836303818/);
  await page.locator(".footer-bottom").scrollIntoViewIfNeeded();
  const dockTop = await actions.evaluate(element => element.getBoundingClientRect().top);
  expect(await page.locator(".footer-bottom").evaluate(element => element.getBoundingClientRect().bottom)).toBeLessThanOrEqual(dockTop);
  const assist = actions.getByRole("button", { name: "Open DCB Assist" });
  await assist.click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect(assist).toBeFocused();
  await actions.getByRole("link", { name: "Back to top" }).click();
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
  await actions.getByRole("link", { name: "Find parts" }).click();
  await expect(page).toHaveURL(/\/products\/#catalogue-search/);
  await expect(page.getByRole("searchbox", { name: "Search products" })).toBeInViewport();
  await expect.poll(() => page.getByRole("searchbox", { name: "Search products" }).evaluate(element => element.getBoundingClientRect().top)).toBeLessThan(150);
});
