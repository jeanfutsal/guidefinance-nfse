import { test, expect } from "@playwright/test";
import fs from "node:fs";
import { ADMIN, USER, login, uniqueSuffix } from "./helpers";

test("usuário exporta os tickets (com filtros atuais) em CSV", async ({ browser }) => {
  const suffix = uniqueSuffix();
  const title = `Ticket CSV E2E ${suffix}`;

  // --- Usuário cria um chamado para ter o que exportar ---
  const userContext = await browser.newContext();
  const userPage = await userContext.newPage();
  await login(userPage, USER);
  await userPage.goto("/tickets");
  await userPage.getByRole("button", { name: "Abrir Chamado" }).click();
  await userPage.locator("#ticket-title").fill(title);
  await userPage.getByRole("button", { name: "Enviar chamado" }).click();
  await expect(userPage.getByRole("button", { name: new RegExp(title) })).toBeVisible();

  // --- Exporta e valida o arquivo baixado ---
  const downloadPromise = userPage.waitForEvent("download");
  await userPage.getByRole("button", { name: "Exportar CSV" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("meus-tickets.csv");

  const filePath = await download.path();
  expect(filePath).toBeTruthy();
  const content = fs.readFileSync(filePath!, "utf8");
  // BOM UTF-8 para Excel + cabeçalho + linha com o dado criado
  expect(content.startsWith("\uFEFF")).toBe(true);
  expect(content).toContain('"Assunto"');
  expect(content).toContain('"Prioridade"');
  expect(content).toContain(title);

  // --- Cleanup: admin exclui o ticket ---
  const adminContext = await browser.newContext();
  const adminPage = await adminContext.newPage();
  await login(adminPage, ADMIN);
  await adminPage.goto("/admin/tickets");
  await adminPage.getByPlaceholder("Buscar por assunto, nome ou e-mail...").fill(title);
  await adminPage
    .locator("li")
    .filter({ hasText: title })
    .first()
    .getByTitle("Excluir ticket")
    .click();
  await expect(adminPage.getByText("Remover ticket?")).toBeVisible();
  await adminPage.getByRole("button", { name: "Remover" }).click();
  await expect(adminPage.getByText(title)).toHaveCount(0);

  await adminContext.close();
  await userContext.close();
});
