import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";

const browser = await chromium.launch({ channel: "chrome", headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 988 } });
  await page.goto(process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:3001/");
  await page.waitForFunction(() => document.querySelector(".alternator-experience")?.dataset.mode === "interactive");
  const result = await page.evaluate(async () => {
    const canvas = document.querySelector(".alternator-canvas canvas");
    const stage = document.querySelector(".alternator-stage");
    const start = scrollY + stage.getBoundingClientRect().top;
    const range = stage.offsetHeight * 0.6;
    const mimeType = ["video/webm;codecs=vp9", "video/webm;codecs=vp8"].find(type => MediaRecorder.isTypeSupported(type));
    if (!mimeType) throw new Error("The browser cannot encode WebM.");
    const stream = canvas.captureStream(30);
    const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 6_000_000 });
    const chunks = [];
    const stopped = new Promise(resolve => {
      recorder.ondataavailable = event => { if (event.data.size) chunks.push(event.data); };
      recorder.onstop = resolve;
    });
    recorder.start();
    const began = performance.now();
    await new Promise(resolve => {
      const animate = now => {
        const seconds = (now - began) / 1000;
        let progress = 0;
        if (seconds < 4) progress = Math.max(0, (seconds - 0.5) / 3.5);
        else if (seconds < 5.5) progress = 1;
        else progress = Math.max(0, 1 - (seconds - 5.5) / 3.5);
        window.scrollTo({ top: start + range * progress * 0.98, behavior: "instant" });
        if (seconds < 10) requestAnimationFrame(animate);
        else resolve();
      };
      requestAnimationFrame(animate);
    });
    recorder.stop();
    await stopped;
    stream.getTracks().forEach(track => track.stop());
    const blob = new Blob(chunks, { type: mimeType });
    return await new Promise(resolve => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result).split(",")[1]);
      reader.readAsDataURL(blob);
    });
  });
  await mkdir("artifacts", { recursive: true });
  const path = "artifacts/alternator-open-close.webm";
  await writeFile(path, Buffer.from(result, "base64"));
  console.log(`Rendered ${path}`);
} finally { await browser.close(); }
