import { test, expect } from "@playwright/test";
import { ADMIN, USER, login, uniqueSuffix } from "./helpers";

test.describe("fluxo de tickets com notificação", () => {
  test("usuário abre chamado, admin responde e usuário vê a resposta no sino", async ({
    browser,
  }) => {
    const suffix = uniqueSuffix();
    const title = `Ticket E2E ${suffix}`;
    const response = `Resposta da equipe E2E ${suffix}`;

    // --- Usuário abre o chamado ---
    const userContext = await browser.newContext();
    const userPage = await userContext.newPage();
    await login(userPage, USER);
    await userPage.goto("/tickets");
    await userPage.getByRole("button", { name: "Abrir Chamado" }).click();
    await userPage.locator("#ticket-title").fill(title);
    await userPage.locator("#ticket-description").fill("Descrição do chamado E2E.");
    await userPage.getByRole("button", { name: "Enviar chamado" }).click();

    const userRow = userPage.getByRole("button", { name: new RegExp(title) });
    await expect(userRow).toBeVisible();

    // --- Admin responde ---
    const adminContext = await browser.newContext();
    const adminPage = await adminContext.newPage();
    await login(adminPage, ADMIN);
    await adminPage.goto("/admin/tickets");
    await adminPage.getByPlaceholder("Buscar por assunto, nome ou e-mail...").fill(title);

    const adminRow = adminPage
      .locator("li")
      .filter({ hasText: title })
      .first();
    await adminRow.getByTitle("Detalhes / responder").click();
    await adminPage.getByPlaceholder("Escreva a resposta para o solicitante...").fill(response);
    await adminPage.getByRole("button", { name: "Enviar resposta" }).click();
    // Status passa a ser "respondido" no select da linha
    await expect(adminRow.getByRole("combobox")).toHaveValue("respondido");

    // --- Usuário vê a resposta e a notificação no sino ---
    await userPage.reload();
    await userPage.getByRole("button", { name: new RegExp(title) }).click();
    await expect(userPage.locator("p.text-cyan-400")).toContainText("Resposta da equipe");
    await expect(userPage.getByText(response)).toBeVisible();

    await userPage.goto("/");
    const bell = userPage.locator('button[title*="notificação"]');
    await expect(bell).toBeVisible();
    await bell.click();
    await expect(userPage.getByText(`Resposta no ticket "${title}"`)).toBeVisible();
    // Clique na notificação marca como lida e leva para /tickets
    await userPage.getByText(`Resposta no ticket "${title}"`).click();
    await expect(userPage).toHaveURL(/\/tickets/);

    // --- Cleanup: admin exclui o ticket (notificação vai junto no cascade) ---
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
});
