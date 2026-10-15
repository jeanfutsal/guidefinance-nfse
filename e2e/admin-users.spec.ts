import { expect, test } from "@playwright/test";
import { ADMIN, login } from "./helpers";

/**
 * Gestão de usuários (/admin/usuarios):
 * - o botão de papel do PRÓPRIO usuário fica habilitado e abre modal de confirmação;
 * - a remoção da própria conta continua bloqueada;
 * - ao cancelar, o modal fecha sem alterar nada.
 */
test.describe("Gestão de usuários (admin)", () => {
  test("admin pode abrir a confirmação para alterar o próprio papel", async ({
    page,
  }) => {
    await login(page, ADMIN);
    await page.goto("/admin/usuarios");

    const selfRow = page.locator("tr", { hasText: ADMIN.email });
    await expect(selfRow).toBeVisible();

    // Regressão: botão de papel do próprio usuário NÃO pode ficar desabilitado
    const roleButton = selfRow.locator(
      'button[title="Alterar seu próprio papel"]'
    );
    await expect(roleButton).toBeEnabled();
    await roleButton.click();

    // Modal de confirmação aberto
    const heading = page.getByRole("heading", {
      name: "Alterar seu próprio papel?",
    });
    await expect(heading).toBeVisible();
    const modal = page.locator("div.glass-panel").filter({ has: heading });
    await expect(modal.getByText(ADMIN.email)).toBeVisible();

    // Remover a própria conta segue bloqueado
    await expect(
      selfRow.locator('button[title="Você não pode remover a própria conta"]')
    ).toBeDisabled();

    // Cancelar fecha o modal sem efeitos
    await page.getByRole("button", { name: "Cancelar" }).click();
    await expect(heading).toBeHidden();
    await expect(selfRow).toBeVisible();
  });
});
