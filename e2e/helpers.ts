import { Page, expect } from "@playwright/test";

export const ADMIN = {
  email: "admin@guidefinance.com",
  password: "mudar-senha-123",
};

export const USER = {
  email: "user-comum@teste.com",
  password: "senha-teste-123",
};

/** Login pela UI e espera o dashboard. */
export async function login(
  page: Page,
  account: { email: string; password: string }
) {
  await page.goto("/login");
  await page.locator("#email").fill(account.email);
  await page.locator("#password").fill(account.password);
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL("/");
}

/** Abre o menu do avatar e clica em "Sair". */
export async function logout(page: Page, account: { email: string }) {
  await page.locator(`button[title="${account.email}"]`).click();
  await page.getByRole("button", { name: "Sair" }).click();
  await expect(page).toHaveURL(/\/login/);
}

/** Timestamp curto para dados de teste únicos. */
export function uniqueSuffix() {
  return `${Date.now()}`.slice(-8);
}
