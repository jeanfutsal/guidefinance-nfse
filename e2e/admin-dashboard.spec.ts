import { expect, test } from "@playwright/test";
import { ADMIN, login } from "./helpers";

/**
 * Dashboard admin (/admin):
 * - exibe a seção "Indicadores Gerais" com 6 cards de KPI vindos do banco;
 * - Faturamento Líquido formatado em BRL e Notas Fiscais com contagem real;
 * - os cards de indicador são links clicáveis para as seções correspondentes;
 * - a seção "Acesso Rápido" mantém os atalhos de navegação existentes.
 */
test.describe("Dashboard admin (indicadores)", () => {
  test("exibe métricas reais e links de navegação", async ({ page }) => {
    await login(page, ADMIN);
    await page.goto("/admin");

    // Seção de indicadores com 6 cards
    await expect(
      page.getByRole("heading", { name: "Indicadores Gerais" })
    ).toBeVisible();
    const metricsGrid = page.locator('div[class*="lg:grid-cols-3"]');
    await expect(metricsGrid.locator("a")).toHaveCount(6);

    // Faturamento Líquido formatado em BRL
    const revenueCard = metricsGrid
      .locator('a[href="/relatorios"]')
      .filter({ hasText: "Faturamento Líquido" });
    await expect(revenueCard).toBeVisible();
    await expect(revenueCard).toContainText(/R\$\s?[\d.]+/);

    // Notas Fiscais com contagem numérica real
    const invoicesCard = metricsGrid
      .locator('a[href="/notas"]')
      .filter({ hasText: "Notas Fiscais" });
    await expect(invoicesCard).toBeVisible();
    await expect(invoicesCard).toContainText(/\d/);

    // Processos e Tickets presentes
    await expect(
      metricsGrid
        .locator('a[href="/admin/processos"]')
        .filter({ hasText: "Processos em Andamento" })
    ).toBeVisible();
    await expect(
      metricsGrid
        .locator('a[href="/admin/tickets"]')
        .filter({ hasText: "Tickets em Aberto" })
    ).toBeVisible();

    // Acesso rápido mantém os atalhos
    await expect(
      page.getByRole("heading", { name: "Acesso Rápido" })
    ).toBeVisible();

    // Clique em um card de indicador navega para a seção
    await invoicesCard.click();
    await expect(page).toHaveURL(/\/notas/);
  });
});
