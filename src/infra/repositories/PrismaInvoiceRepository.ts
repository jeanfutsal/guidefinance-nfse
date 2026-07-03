import { InvoiceRepository, InvoiceFilters } from "../../core/repositories/InvoiceRepository";
import { Invoice, DashboardStats } from "../../core/entities/Invoice";
import { prisma } from "../db/prisma";

export class PrismaInvoiceRepository implements InvoiceRepository {
  async save(invoice: Omit<Invoice, "id"> & { id?: string }): Promise<Invoice> {
    const data = {
      accessKey: invoice.accessKey,
      number: invoice.number,
      issueDate: new Date(invoice.issueDate),
      competenceDate: invoice.competenceDate,
      emitenteCnpj: invoice.emitenteCnpj,
      emitenteName: invoice.emitenteName,
      emitenteCity: invoice.emitenteCity,
      emitenteState: invoice.emitenteState,
      tomadorCnpj: invoice.tomadorCnpj,
      tomadorName: invoice.tomadorName,
      tomadorCity: invoice.tomadorCity,
      tomadorState: invoice.tomadorState,
      serviceCode: invoice.serviceCode,
      serviceDescription: invoice.serviceDescription,
      serviceValue: invoice.serviceValue,
      liquidValue: invoice.liquidValue,
      issqnValue: invoice.issqnValue,
      issqnRate: invoice.issqnRate,
      issqnRetained: invoice.issqnRetained,
      federalRetentions: invoice.federalRetentions,
    };

    let result;
    if (invoice.id) {
      result = await prisma.invoice.update({
        where: { id: invoice.id },
        data,
      });
    } else {
      // Tenta criar. Se a chave de acesso já existir, atualiza
      result = await prisma.invoice.upsert({
        where: { accessKey: invoice.accessKey },
        update: data,
        create: data,
      });
    }

    return this.mapToEntity(result);
  }

  async findAll(filters?: InvoiceFilters): Promise<Invoice[]> {
    const whereClause = this.buildWhereClause(filters);
    const invoices = await prisma.invoice.findMany({
      where: whereClause,
      orderBy: { issueDate: "desc" },
    });

    return invoices.map(this.mapToEntity);
  }

  async findById(id: string): Promise<Invoice | null> {
    const invoice = await prisma.invoice.findUnique({
      where: { id },
    });
    return invoice ? this.mapToEntity(invoice) : null;
  }

  async findByAccessKey(accessKey: string): Promise<Invoice | null> {
    const invoice = await prisma.invoice.findUnique({
      where: { accessKey },
    });
    return invoice ? this.mapToEntity(invoice) : null;
  }

  async delete(id: string): Promise<boolean> {
    try {
      await prisma.invoice.delete({
        where: { id },
      });
      return true;
    } catch {
      return false;
    }
  }

  async getStats(filters?: InvoiceFilters): Promise<DashboardStats> {
    const invoices = await this.findAll(filters);
    
    let totalInvoiced = 0;
    let totalLiquid = 0;
    let totalTax = 0;
    const invoiceCount = invoices.length;

    const clientsMap: Record<string, { name: string; value: number; count: number }> = {};
    const suppliersMap: Record<string, { name: string; value: number; count: number }> = {};
    const monthlyMap: Record<string, { month: string; value: number; tax: number }> = {};

    for (const inv of invoices) {
      totalInvoiced += inv.serviceValue;
      totalLiquid += inv.liquidValue;
      totalTax += inv.issqnValue + inv.federalRetentions;

      // Agrupamento por Tomador (Cliente)
      const clientKey = inv.tomadorCnpj || inv.tomadorName;
      if (clientKey) {
        if (!clientsMap[clientKey]) {
          clientsMap[clientKey] = { name: inv.tomadorName, value: 0, count: 0 };
        }
        clientsMap[clientKey].value += inv.serviceValue;
        clientsMap[clientKey].count += 1;
      }

      // Agrupamento por Emitente (Fornecedor)
      const supplierKey = inv.emitenteCnpj || inv.emitenteName;
      if (supplierKey) {
        if (!suppliersMap[supplierKey]) {
          suppliersMap[supplierKey] = { name: inv.emitenteName, value: 0, count: 0 };
        }
        suppliersMap[supplierKey].value += inv.serviceValue;
        suppliersMap[supplierKey].count += 1;
      }

      // Agrupamento por Mês
      const date = new Date(inv.issueDate);
      if (!isNaN(date.getTime())) {
        const year = date.getFullYear();
        const monthNum = String(date.getMonth() + 1).padStart(2, "0");
        const monthKey = `${year}-${monthNum}`; // ex: "2026-03"
        
        // Nome de exibição amigável do mês em português
        const formatter = new Intl.DateTimeFormat("pt-BR", { month: "short", year: "2-digit" });
        const monthLabel = formatter.format(date).replace(".", ""); // ex: "mar de 26"

        if (!monthlyMap[monthKey]) {
          monthlyMap[monthKey] = { month: monthLabel, value: 0, tax: 0 };
        }
        monthlyMap[monthKey].value += inv.serviceValue;
        monthlyMap[monthKey].tax += inv.issqnValue + inv.federalRetentions;
      }
    }

    const averageValue = invoiceCount > 0 ? totalInvoiced / invoiceCount : 0;

    // Ordena e pega os top 5 clientes e fornecedores
    const topClients = Object.values(clientsMap)
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    const topSuppliers = Object.values(suppliersMap)
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    // Ordena os faturamentos mensais cronologicamente
    const monthlyBilling = Object.entries(monthlyMap)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([_, data]) => data)
      .slice(-12); // Pega no máximo os últimos 12 meses

    return {
      totalInvoiced,
      totalLiquid,
      totalTax,
      invoiceCount,
      averageValue,
      topClients,
      topSuppliers,
      monthlyBilling,
    };
  }

  // --- Auxiliares ---

  private buildWhereClause(filters?: InvoiceFilters) {
    if (!filters) return {};

    const conditions: any[] = [];

    // Filtro de Data
    if (filters.startDate || filters.endDate) {
      const dateCond: any = {};
      if (filters.startDate) dateCond.gte = new Date(filters.startDate);
      if (filters.endDate) {
        // Ajusta fim do dia para abranger até 23:59:59
        const end = new Date(filters.endDate);
        end.setHours(23, 59, 59, 999);
        dateCond.lte = end;
      }
      conditions.push({ issueDate: dateCond });
    }

    // CNPJs específicos
    if (filters.emitenteCnpj) {
      conditions.push({ emitenteCnpj: filters.emitenteCnpj });
    }
    if (filters.tomadorCnpj) {
      conditions.push({ tomadorCnpj: filters.tomadorCnpj });
    }

    // Intervalo de valores
    if (filters.minValue !== undefined || filters.maxValue !== undefined) {
      const valueCond: any = {};
      if (filters.minValue !== undefined) valueCond.gte = filters.minValue;
      if (filters.maxValue !== undefined) valueCond.lte = filters.maxValue;
      conditions.push({ serviceValue: valueCond });
    }

    // Busca textual global
    if (filters.searchValue && filters.searchValue.trim() !== "") {
      const search = filters.searchValue.trim();
      conditions.push({
        OR: [
          { accessKey: { contains: search } },
          { number: { contains: search } },
          { emitenteName: { contains: search } },
          { emitenteCnpj: { contains: search } },
          { tomadorName: { contains: search } },
          { tomadorCnpj: { contains: search } },
          { serviceDescription: { contains: search } },
        ],
      });
    }

    return conditions.length > 0 ? { AND: conditions } : {};
  }

  private mapToEntity(dbInvoice: any): Invoice {
    return {
      id: dbInvoice.id,
      accessKey: dbInvoice.accessKey,
      number: dbInvoice.number,
      issueDate: dbInvoice.issueDate.toISOString(),
      competenceDate: dbInvoice.competenceDate,
      emitenteCnpj: dbInvoice.emitenteCnpj,
      emitenteName: dbInvoice.emitenteName,
      emitenteCity: dbInvoice.emitenteCity,
      emitenteState: dbInvoice.emitenteState,
      tomadorCnpj: dbInvoice.tomadorCnpj,
      tomadorName: dbInvoice.tomadorName,
      tomadorCity: dbInvoice.tomadorCity,
      tomadorState: dbInvoice.tomadorState,
      serviceCode: dbInvoice.serviceCode,
      serviceDescription: dbInvoice.serviceDescription,
      serviceValue: dbInvoice.serviceValue,
      liquidValue: dbInvoice.liquidValue,
      issqnValue: dbInvoice.issqnValue,
      issqnRate: dbInvoice.issqnRate,
      issqnRetained: dbInvoice.issqnRetained,
      federalRetentions: dbInvoice.federalRetentions,
      createdAt: dbInvoice.createdAt.toISOString(),
      updatedAt: dbInvoice.updatedAt.toISOString(),
    };
  }
}
