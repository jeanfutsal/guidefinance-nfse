import { defineConfig, devices } from "@playwright/test";

/**
 * E2E contra o server de produção (npm run start) na porta 3000.
 * Os testes usam os usuários seed (admin@guidefinance.com / user-comum@teste.com)
 * e limpam os dados criados ao final (via UI de exclusão).
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 90_000,
  expect: { timeout: 15_000 },
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:3000",
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run start",
    url: "http://localhost:3000/login",
    reuseExistingServer: true,
    timeout: 120_000,
    env: {
      ...(process.env as Record<string, string>),
      // E2E faz vários logins em sequência — desativa o rate limit do Better Auth
      RATE_LIMIT_DISABLED: "true",
    },
  },
});
