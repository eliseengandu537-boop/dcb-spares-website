import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";

await mkdir("test-results/alternator", { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true });
try {
  for (const [name, width, height] of [["desktop", 1440, 1000], ["mobile", 390, 844], ["small-mobile", 375, 667], ["tablet", 768, 1024]]) {
    const page = await browser.newPage({ viewport: { width, height } });
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
    await page.goto(process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:3001/");
    await page.waitForFunction(() => document.querySelector(".alternator-experience")?.dataset.mode !== "loading", { timeout: 30000 });
    await page.evaluate(() => document.fonts.ready);
    const mode = await page.locator(".alternator-experience").getAttribute("data-mode");
    for (const [state, progress] of [["closed", 0], ["opening", 0.5], ["open", 0.95], ["reclosed", 0]]) {
      await page.evaluate(progress => {
        const section = document.querySelector(".alternator-experience");
        const stage = document.querySelector(".alternator-stage");
        const start = scrollY + section.getBoundingClientRect().top - Number.parseFloat(getComputedStyle(stage).top);
        window.scrollTo({ top: Math.max(0, start + (section.offsetHeight - stage.offsetHeight) * progress), behavior: "instant" });
      }, progress);
      await page.waitForTimeout(1300);
      await page.screenshot({ path: `test-results/alternator/${name}-${state}.png` });
    }
    console.log(JSON.stringify({ name, mode, errors, overflow: await page.evaluate(() => document.documentElement.scrollWidth > innerWidth) }));
    await page.close();
  }
} finally { await browser.close(); }
