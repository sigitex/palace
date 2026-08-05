import { defineConfig, devices } from "@playwright/test"

export default defineConfig({
  testDir: "./tests/browser",
  testMatch: "**/*.e2e.ts",
  fullyParallel: false,
  use: {
    baseURL: "http://127.0.0.1:5189",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: [
    {
      command: "bun run serve:test",
      url: "http://127.0.0.1:3019/",
      reuseExistingServer: false,
      env: {
        ...process.env,
        PORT: "3019",
        PALACE_DATABASE: `/tmp/palace-playwright-${process.pid}.sqlite`,
      },
    },
    {
      command: "bunx --bun vite --host 127.0.0.1 --port 5189",
      url: "http://127.0.0.1:5189",
      reuseExistingServer: false,
      env: {
        ...process.env,
        PALACE_NO_SERVER_PLUGIN: "1",
        PALACE_SERVER_PORT: "3019",
      },
    },
  ],
})
