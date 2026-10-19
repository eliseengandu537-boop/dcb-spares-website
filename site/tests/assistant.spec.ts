import { test, expect } from "@playwright/test";

test("demo assistant finds real products and opens their details",async({page})=>{
  await page.goto("/");
  await page.getByRole("button",{name:"Open DCB demo assistant"}).click();
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

test("demo quick replies, quote handoff, reset and keyboard close work",async({page})=>{
  await page.goto("/");
  const launcher=page.getByRole("button",{name:"Open DCB demo assistant"});
  await launcher.click();
  const assistant=page.getByRole("dialog",{name:"DCB Assist"});
  await assistant.getByRole("button",{name:"Where are your branches?"}).click();
  await expect(assistant.getByRole("log")).toContainText("25 Palmiet Road");
  await assistant.getByLabel("Message DCB Assist").fill("How much is a starter?");
  await assistant.getByRole("button",{name:"Send message"}).click();
  await expect(assistant.getByRole("log")).toContainText("confirm the price, stock and correct fit");
  const handoff=assistant.getByRole("link",{name:"Chat with our team"});
  await expect(handoff).toHaveAttribute("href",/wa\.me\/27646805363/);
  expect(new URL((await handoff.getAttribute("href"))!).searchParams.get("text")).toContain("How much is a starter?");
  await assistant.getByRole("button",{name:"Start a new conversation"}).click();
  await expect(assistant.getByRole("button",{name:"Toyota Hilux starter"})).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(assistant).not.toBeVisible();
  await expect(launcher).toBeFocused();
  expect(await page.evaluate(()=>document.body.style.overflow)).not.toBe("hidden");
});
