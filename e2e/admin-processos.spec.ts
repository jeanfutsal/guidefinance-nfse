import { test, expect } from "@playwright/test";
import { ADMIN, login } from "./helpers";

test.describe.serial("Processos (admin)", () => {
  test("listagem e formulário carregam sem erro", async ({ page }) => {
    await login(page, ADMIN);

    // Regressão: a listagem é Server Component e o ExportCsvButton é cliente;
    // colunas com funções não podem cruzar essa fronteira (erro 500 em prod).
    await page.goto("/admin/processos");
    await expect(page.getByRole("heading", { name: "Processos" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Novo Processo" })).toBeVisible();

    await page.goto("/admin/processos/novo");
    await expect(page.locator("#process-title")).toBeVisible();
  });
});
