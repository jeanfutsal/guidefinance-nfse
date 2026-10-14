import { test, expect } from "@playwright/test";
import { ADMIN, login, uniqueSuffix } from "./helpers";

test.describe.serial("CRUD de clientes (admin)", () => {
  const suffix = uniqueSuffix();
  const cnpj = `98.${suffix.slice(0, 4)}.${suffix.slice(2, 6)}/0001-9${suffix.slice(-1)}`;
  const razaoSocial = `Cliente E2E ${suffix}`;

  test("cria, edita e exclui um cliente", async ({ page }) => {
    await login(page, ADMIN);

    // --- Criação ---
    await page.goto("/admin/clients");
    await page.getByRole("link", { name: "Novo Cliente" }).click();
    await expect(page).toHaveURL(/\/admin\/clients\/novo/);

    await page.locator("#cnpj").fill(cnpj);
    await page.locator("#razaoSocial").fill(razaoSocial);
    await page.getByRole("button", { name: "Cadastrar" }).click();

    await expect(page).toHaveURL(/\/admin\/clients$/);
    const row = page.getByRole("row", { name: razaoSocial });
    await expect(row).toBeVisible();
    await expect(row.getByText(cnpj)).toBeVisible();

    // --- Edição ---
    await row.getByTitle("Editar").click();
    await expect(page).toHaveURL(/\/admin\/clients\/[a-z0-9]+/i);
    const nomeFantasia = `Fantasia E2E ${suffix}`;
    await page.locator("#nomeFantasia").fill(nomeFantasia);
    await page.getByRole("button", { name: "Salvar alterações" }).click();

    await expect(page).toHaveURL(/\/admin\/clients$/);
    // A listagem não exibe nomeFantasia — reabre o cadastro e confere a persistência
    await page.getByRole("row", { name: razaoSocial }).getByTitle("Editar").click();
    await expect(page.locator("#nomeFantasia")).toHaveValue(nomeFantasia);
    await page.getByRole("link", { name: "Voltar" }).click();
    await expect(page).toHaveURL(/\/admin\/clients$/);

    // --- Exclusão (também limpa o dado de teste) ---
    await page.getByRole("row", { name: razaoSocial }).getByTitle("Excluir").click();
    await expect(page.getByText("Excluir registro?")).toBeVisible();
    await page.locator("div.fixed").getByRole("button", { name: "Excluir", exact: true }).click();

    await expect(page.getByRole("row", { name: razaoSocial })).toHaveCount(0);
  });
});
