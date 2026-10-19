import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";

await mkdir("test-results", { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true });
for (const [name, width, height] of [["desktop", 1440, 1000], ["mobile", 390, 844], ["tablet", 768, 1024]]) {
  const page = await browser.newPage({ viewport: { width, height }, reducedMotion: "reduce" });
  await page.goto("http://127.0.0.1:3001/", { waitUntil: "networkidle" });
  await page.screenshot({ path: `test-results/${name}-hero.png` });
  for (let y = 0; y < await page.evaluate(() => document.body.scrollHeight); y += 700) {
    await page.evaluate(position => window.scrollTo(0, position), y);
    await page.waitForTimeout(70);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: `test-results/${name}-full.png`, fullPage: true });
  console.log(`${name}: ${await page.title()}, horizontal overflow: ${await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)}`);
  await page.close();
}
await browser.close();
