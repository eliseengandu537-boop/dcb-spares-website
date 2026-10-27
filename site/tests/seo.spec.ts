import { test, expect } from "@playwright/test";
import sitemap from "../src/app/sitemap";
import { absoluteUrl, breadcrumbData, serializeJsonLd } from "../src/lib/seo";
import { products, productAliases } from "../src/lib/catalogue";

test("robots and sitemap expose every preferred product URL without duplicate aliases", async ({ request }) => {
  const robots = await request.get("/robots.txt");
  expect(robots.status()).toBe(200);
  expect(await robots.text()).toContain("Allow: /");
  expect(await robots.text()).toContain("Sitemap: https://www.dcbspares.co.za/sitemap.xml");
  expect(await robots.text()).not.toMatch(/^Disallow: \/$/m);
  const response = await request.get("/sitemap.xml");
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toContain("xml");
  const body = await response.text();
  const urls = [...body.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1]);
  expect(new Set(urls).size).toBe(1563);
  expect(urls).toEqual(sitemap().map(item => item.url));
  for (const product of products) expect(urls).toContain(absoluteUrl(`/product/${product.slug}/`));
  expect(urls.some(url => /\/category\/|\/brands\/product\/|\/about-us\/|\/contact-us\//.test(url))).toBe(false);
});

test("search engines receive production metadata and branch data without running JavaScript", async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, baseURL });
  const page = await context.newPage();
  await page.goto("/");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", absoluteUrl("/"));
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "index, follow");
  await expect(page).toHaveTitle("Auto-Electrical Spares & GB Distributor | DCB Spares");
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", absoluteUrl("/images/dcb-social-preview.png"));
  const graph = await page.locator('script[type="application/ld+json"]').allTextContents();
  const nodes = graph.flatMap(value => JSON.parse(value)["@graph"] ?? []);
  const stores = nodes.filter(node => node["@type"] === "AutoPartsStore");
  expect(stores).toHaveLength(2);
  expect(stores.map(store => store.address.postalCode)).toEqual(["1451", "7530"]);
  expect(stores.map(store => store.telephone)).toEqual(["+27119086366", "+27212862737"]);
  expect(JSON.stringify(nodes)).not.toMatch(/aggregateRating|openingHoursSpecification|priceRange/);
  await context.close();
});

test("legacy category, brand and product links identify the matching preferred page", async ({ page }) => {
  const alias = productAliases[0];
  const product = products.find(item => item.id === alias.id)!;
  const paths = [
    ["/category/14-alternators/", "/products/alternators/"],
    ["/brands/category/37-toyota/", "/brands/toyota/"],
    ["/about-us/", "/about/"], ["/contact-us/", "/contact/"],
    [`/product/${alias.slug}/`, `/product/${product.slug}/`],
  ];
  for (const [path, preferred] of paths) {
    const response = await page.goto(path);
    expect(response?.status(), path).toBe(200);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", absoluteUrl(preferred));
    await expect(page.locator('meta[property="og:url"]')).toHaveAttribute("content", absoluteUrl(preferred));
  }
});

test("unknown routes stay noindex and structured data safely preserves catalogue text", async ({ page }) => {
  const response = await page.goto("/products/not-a-real-product-range/");
  expect(response?.status()).toBe(404);
  expect(await page.locator('meta[name="robots"]').evaluateAll(tags => tags.map(tag => tag.getAttribute("content")))).toContain("noindex");
  const data = breadcrumbData([{ name: '</script><img src=x onerror="alert(1)">', path: "/products/" }]);
  const serialized = serializeJsonLd(data);
  expect(serialized).not.toContain("<");
  expect(JSON.parse(serialized)).toEqual(data);
});
