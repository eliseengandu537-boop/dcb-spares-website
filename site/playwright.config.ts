import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  workers: 2,
  reporter: "list",
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3001",
    headless: true,
    launchOptions: { channel: "chrome" },
    trace: "retain-on-failure",
  },
  projects: [
    { name: "desktop", testIgnore: /quote-server\.spec\.ts/, use: { viewport: { width: 1440, height: 1000 } } },
    { name: "mobile", testIgnore: /quote-server\.spec\.ts/, use: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } },
    { name: "server", testMatch: /quote-server\.spec\.ts/ },
  ],
});
