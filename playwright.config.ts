import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 60_000,
  fullyParallel: false,
  workers: 1,
  reporter: "html",
  use: {
    baseURL: "http://127.0.0.1:3100",
    trace: "on-first-retry"
  },
  webServer: {
    command:
      "E2E_AUTH_BYPASS=true node node_modules/next/dist/bin/next build && cp -R public .next/standalone/ && mkdir -p .next/standalone/.next && cp -R .next/static .next/standalone/.next/static && E2E_AUTH_BYPASS=true PORT=3100 HOSTNAME=127.0.0.1 node .next/standalone/server.js",
    url: "http://127.0.0.1:3100",
    reuseExistingServer: false,
    timeout: 180_000
  },
  projects: [
    {
      name: "chromium-desktop",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 1000 } }
    },
    {
      name: "mobile-safari",
      use: { ...devices["iPhone 15"], viewport: { width: 390, height: 844 } }
    }
  ]
});
