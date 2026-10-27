import { chromium } from "@playwright/test";
import { readFile } from "node:fs/promises";

const photo = (await readFile("public/images/original/hero-alternator.webp")).toString("base64");
const logo = (await readFile("public/images/original/dcb-logo.webp")).toString("base64");
const browser = await chromium.launch({ channel: "chrome", headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  await page.setContent(`<!doctype html><html><head><meta charset="utf-8"><style>
    *{box-sizing:border-box}body{margin:0;background:#101217;color:#fff;font-family:Arial,Helvetica,sans-serif;border-top:9px solid #e32335;width:1200px;height:630px;padding:44px 64px}
    header{display:flex;align-items:center;justify-content:space-between;margin-bottom:42px}header strong{font-size:25px;letter-spacing:.5px}header span{font-size:19px;color:#bbc0ca}header img{width:88px;height:auto;vertical-align:middle;margin-right:14px}
    main{display:flex;align-items:center;gap:40px}section{width:675px}.eyebrow{color:#ff6372;font-size:17px;letter-spacing:2px;font-weight:bold}h1{font-size:68px;line-height:1.08;letter-spacing:-2px;margin:22px 0}p{font-size:24px;line-height:1.5;color:#c8ccd4;margin:0}.part{width:330px;height:330px;object-fit:contain;border:1px solid #343841;border-radius:22px;background:#000}
    footer{margin-top:42px;display:flex;justify-content:space-between;font-size:18px;color:#b3b8c3}footer b{color:#fff}
  </style></head><body><header><strong><img src="data:image/webp;base64,${logo}" alt="DCB">DCB AUTO SPARES</strong><span>www.dcbspares.co.za</span></header>
  <main><section><div class="eyebrow">YOUR PRIMARY GB DISTRIBUTOR</div><h1>Auto-electrical<br>spares. Sorted.</h1><p>Alternators, starters & electrical parts.<br>Wholesale and retail.</p></section><img class="part" src="data:image/webp;base64,${photo}" alt="DCB GB alternator"></main>
  <footer><span>AFTERMARKET PARTS. SPECIALIST SUPPORT.</span><b>ALRODE &nbsp; / &nbsp; CAPE TOWN</b></footer></body></html>`);
  await page.evaluate(() => Promise.all([...document.images].map(image => image.decode())));
  await page.screenshot({ path: "public/images/dcb-social-preview.png" });
  console.log("Created DCB's 1200 × 630 social sharing image from existing brand assets.");
} finally { await browser.close(); }
