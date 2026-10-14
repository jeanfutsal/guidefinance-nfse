import { test, expect } from "@playwright/test";
import { ADMIN, USER, login, logout } from "./helpers";

test.describe("autenticação e permissões", () => {
  test("admin loga e vê o item Administração na sidebar", async ({ page }) => {
    await login(page, ADMIN);
    await expect(page.getByRole("link", { name: "Administração" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Tickets", exact: true })).toBeVisible();
  });

  test("logout redireciona para /login", async ({ page }) => {
    await login(page, ADMIN);
    await logout(page, ADMIN);
    await expect(page.getByRole("button", { name: "Entrar" })).toBeVisible();
  });

  test("usuário comum não vê Administração e é barrado em /admin", async ({ page }) => {
    await login(page, USER);
    await expect(page.getByRole("link", { name: "Administração" })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Tickets", exact: true })).toBeVisible();

    await page.goto("/admin");
    await expect(page).toHaveURL(/\/403/);
  });

  test("senha inválida exibe erro sem sair do login", async ({ page }) => {
    await page.goto("/login");
    await page.locator("#email").fill(USER.email);
    await page.locator("#password").fill("senha-errada-123");
    await page.getByRole("button", { name: "Entrar" }).click();

    await expect(page.locator("div.text-error")).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });
});
