import { InvoiceRepository, InvoiceFilters } from "../../core/repositories/InvoiceRepository";
import { Invoice, DashboardStats } from "../../core/entities/Invoice";
import localforage from "localforage";

// Configura o localforage para usar o IndexedDB como prioridade
localforage.config({
  name: "GuideFinance",
  storeName: "invoices_store",
  description: "Armazenamento offline das notas fiscais",
});

const INVOICES_KEY = "invoices";

export class IndexedDBInvoiceRepository implements InvoiceRepository {
  private async getList(): Promise<Invoice[]> {
    const list = await localforage.getItem<Invoice[]>(INVOICES_KEY);
    return list || [];
  }

  private async saveList(list: Invoice[]): Promise<void> {
    await localforage.setItem(INVOICES_KEY, list);
  }

  async save(invoice: Omit<Invoice, "id"> & { id?: string }): Promise<Invoice> {
    const list = await this.getList();
    const nowStr = new Date().toISOString();

    let existingIndex = -1;
    if (invoice.id) {
      existingIndex = list.findIndex((item) => item.id === invoice.id);
    } else {
      existingIndex = list.findIndex((item) => item.accessKey === invoice.accessKey);
    }

    const savedInvoice: Invoice = {
      ...invoice,
      id: invoice.id || (existingIndex >= 0 ? list[existingIndex].id : crypto.randomUUID()),
      createdAt: existingIndex >= 0 ? list[existingIndex].createdAt : nowStr,
      updatedAt: nowStr,
    };

    if (existingIndex >= 0) {
      list[existingIndex] = savedInvoice;
    } else {
      list.push(savedInvoice);
    }

    await this.saveList(list);
    return savedInvoice;
  }

  async findAll(filters?: InvoiceFilters): Promise<Invoice[]> {
    let list = await this.getList();

    // Ordenar por data de emissão decrescente por padrão
    list.sort((a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime());

    if (!filters) return list;

    // Aplicar filtros
    if (filters.startDate) {
      const start = new Date(filters.startDate).getTime();
      list = list.filter((inv) => new Date(inv.issueDate).getTime() >= start);
    }

    if (filters.endDate) {
      const end = new Date(filters.endDate);
      end.setHours(23, 59, 59, 999);
      const endTime = end.getTime();
      list = list.filter((inv) => new Date(inv.issueDate).getTime() <= endTime);
    }

    if (filters.emitenteCnpj) {
      list = list.filter((inv) => inv.emitenteCnpj === filters.emitenteCnpj);
    }

    if (filters.tomadorCnpj) {
      list = list.filter((inv) => inv.tomadorCnpj === filters.tomadorCnpj);
    }

    if (filters.minValue !== undefined) {
      list = list.filter((inv) => inv.serviceValue >= (filters.minValue ?? 0));
    }

    if (filters.maxValue !== undefined) {
      list = list.filter((inv) => inv.serviceValue <= (filters.maxValue ?? Infinity));
    }

    if (filters.searchValue && filters.searchValue.trim() !== "") {
      const search = filters.searchValue.trim().toLowerCase();
      list = list.filter((inv) => {
        return (
          inv.accessKey.toLowerCase().includes(search) ||
          inv.number.toLowerCase().includes(search) ||
          inv.emitenteName.toLowerCase().includes(search) ||
          inv.emitenteCnpj.toLowerCase().includes(search) ||
          inv.tomadorName.toLowerCase().includes(search) ||
          inv.tomadorCnpj.toLowerCase().includes(search) ||
          inv.serviceDescription.toLowerCase().includes(search)
        );
      });
    }

    return list;
  }

  async findById(id: string): Promise<Invoice | null> {
    const list = await this.getList();
    return list.find((item) => item.id === id) || null;
  }

  async findByAccessKey(accessKey: string): Promise<Invoice | null> {
    const list = await this.getList();
    return list.find((item) => item.accessKey === accessKey) || null;
  }

  async delete(id: string): Promise<boolean> {
    const list = await this.getList();
    const initialLen = list.length;
    const filtered = list.filter((item) => item.id !== id);
    
    if (filtered.length < initialLen) {
      await this.saveList(filtered);
      return true;
    }
    return false;
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

      // Tomador (Cliente)
      const clientKey = inv.tomadorCnpj || inv.tomadorName;
      if (clientKey) {
        if (!clientsMap[clientKey]) {
          clientsMap[clientKey] = { name: inv.tomadorName, value: 0, count: 0 };
        }
        clientsMap[clientKey].value += inv.serviceValue;
        clientsMap[clientKey].count += 1;
      }

      // Emitente (Fornecedor)
      const supplierKey = inv.emitenteCnpj || inv.emitenteName;
      if (supplierKey) {
        if (!suppliersMap[supplierKey]) {
          suppliersMap[supplierKey] = { name: inv.emitenteName, value: 0, count: 0 };
        }
        suppliersMap[supplierKey].value += inv.serviceValue;
        suppliersMap[supplierKey].count += 1;
      }

      // Mês
      const date = new Date(inv.issueDate);
      if (!isNaN(date.getTime())) {
        const year = date.getFullYear();
        const monthNum = String(date.getMonth() + 1).padStart(2, "0");
        const monthKey = `${year}-${monthNum}`;

        const formatter = new Intl.DateTimeFormat("pt-BR", { month: "short", year: "2-digit" });
        const monthLabel = formatter.format(date).replace(".", "");

        if (!monthlyMap[monthKey]) {
          monthlyMap[monthKey] = { month: monthLabel, value: 0, tax: 0 };
        }
        monthlyMap[monthKey].value += inv.serviceValue;
        monthlyMap[monthKey].tax += inv.issqnValue + inv.federalRetentions;
      }
    }

    const averageValue = invoiceCount > 0 ? totalInvoiced / invoiceCount : 0;

    const topClients = Object.values(clientsMap)
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    const topSuppliers = Object.values(suppliersMap)
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    const monthlyBilling = Object.entries(monthlyMap)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([_, data]) => data)
      .slice(-12);

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
}
