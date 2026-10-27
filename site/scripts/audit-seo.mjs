import { readFile, access, writeFile } from "node:fs/promises";
import assert from "node:assert/strict";

const products = JSON.parse(await readFile("src/data/products.json", "utf8"));
const catalogue = JSON.parse(await readFile("src/data/catalogue.json", "utf8"));
const aliases = JSON.parse(await readFile("src/data/product-aliases.json", "utf8"));
const origin = "https://www.dcbspares.co.za";
const routes = new Map();
const add = (path, canonical = path) => routes.set(path, canonical);
for (const path of ["/", "/about/", "/contact/", "/products/", "/brands/", "/company-profile/", "/privacy-policy/"]) add(path);
add("/about-us/", "/about/"); add("/contact-us/", "/contact/");
for (const category of catalogue.categories) { add(`/products/${category.slug}/`); add(`/category/${category.original}/`, `/products/${category.slug}/`); }
for (const brand of catalogue.brands) { add(`/brands/${brand.slug}/`); add(`/brands/category/${brand.original}/`, `/brands/${brand.slug}/`); }
for (const product of products) { add(`/product/${product.slug}/`); if (product.brands.length) add(`/brands/product/${product.slug}/`, `/product/${product.slug}/`); }
for (const alias of aliases) add(`/product/${alias.slug}/`, `/product/${products.find(product => product.id === alias.id).slug}/`);
const imagePaths = new Set();
let breadcrumbs = 0;
for (const [path, canonical] of routes) {
  const html = await readFile(`.next/server/app/${path === "/" ? "index" : path.slice(1, -1)}.html`, "utf8");
  const tags = html.match(/<(?:meta|link)\b[^>]*>/g) || [];
  const meta = name => tags.find(tag => tag.includes(`name="${name}"`) || tag.includes(`property="${name}"`))?.match(/content="([^"]*)"/)?.[1];
  const canonicals = tags.filter(tag => tag.includes('rel="canonical"')).map(tag => tag.match(/href="([^"]*)"/)?.[1]);
  assert.deepEqual(canonicals, [origin + canonical], `${path}: canonical`);
  assert(meta("robots") && !meta("robots").includes("noindex"), `${path}: blocked from indexing`);
  assert(meta("googlebot") && !meta("googlebot").includes("noindex"), `${path}: Googlebot blocked`);
  assert(meta("description")?.length > 30, `${path}: description`);
  assert.equal(meta("og:url"), origin + canonical, `${path}: social URL`);
  assert(meta("og:title")?.length > 10 && meta("og:description")?.length > 30, `${path}: sharing text`);
  assert.equal(meta("twitter:card"), "summary_large_image", `${path}: sharing card`);
  const image = new URL(meta("og:image")); assert.equal(image.origin, origin, `${path}: image host`); imagePaths.add(image.pathname);
  assert(!tags.some(tag => /chatgpt\.site|contact\.dcbspares\.co\.za/.test(tag)), `${path}: stale domain in metadata`);
  const data = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(match => JSON.parse(match[1]));
  assert(data.some(item => item["@graph"]?.some(node => node["@type"] === "Organization")), `${path}: organization data`);
  if (/^\/(?:products|product|category|brands)\/[^/]+/.test(path)) {
    const trail = data.find(item => item["@type"] === "BreadcrumbList");
    assert(trail && trail.itemListElement.at(-1).item === origin + canonical, `${path}: breadcrumb target`); breadcrumbs++;
  }
}
for (const image of imagePaths) await access(`public${decodeURIComponent(image)}`);
const summary = { checkedAt: new Date().toISOString(), pages: routes.size, preferredUrls: new Set(routes.values()).size, aliases: [...routes].filter(([path, canonical]) => path !== canonical).length, breadcrumbPages: breadcrumbs, socialImages: imagePaths.size, failures: 0 };
await writeFile("artifacts/seo-build-audit.json", JSON.stringify(summary, null, 2));
console.log(JSON.stringify(summary));
