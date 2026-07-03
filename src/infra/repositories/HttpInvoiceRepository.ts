import { InvoiceRepository, InvoiceFilters } from "../../core/repositories/InvoiceRepository";
import { Invoice, DashboardStats } from "../../core/entities/Invoice";

export class HttpInvoiceRepository implements InvoiceRepository {
  async save(invoice: Omit<Invoice, "id"> & { id?: string }): Promise<Invoice> {
    const res = await fetch("/api/invoices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(invoice),
    });
    if (!res.ok) throw new Error("Erro ao salvar nota fiscal no servidor");
    return res.json();
  }

  async findAll(filters?: InvoiceFilters): Promise<Invoice[]> {
    const params = new URLSearchParams();
    if (filters) {
      if (filters.startDate) params.set("startDate", filters.startDate);
      if (filters.endDate) params.set("endDate", filters.endDate);
      if (filters.emitenteCnpj) params.set("emitenteCnpj", filters.emitenteCnpj);
      if (filters.tomadorCnpj) params.set("tomadorCnpj", filters.tomadorCnpj);
      if (filters.searchValue) params.set("searchValue", filters.searchValue);
      if (filters.minValue !== undefined) params.set("minValue", String(filters.minValue));
      if (filters.maxValue !== undefined) params.set("maxValue", String(filters.maxValue));
    }
    const res = await fetch(`/api/invoices?${params.toString()}`);
    if (!res.ok) throw new Error("Erro ao carregar notas fiscais do servidor");
    return res.json();
  }

  async findById(id: string): Promise<Invoice | null> {
    const res = await fetch(`/api/invoices/${id}`);
    if (res.status === 404) return null;
    if (!res.ok) throw new Error("Erro ao buscar nota fiscal no servidor");
    return res.json();
  }

  async findByAccessKey(accessKey: string): Promise<Invoice | null> {
    const res = await fetch(`/api/invoices?accessKey=${accessKey}`);
    if (res.status === 404) return null;
    if (!res.ok) throw new Error("Erro ao buscar nota fiscal pela chave");
    const list: Invoice[] = await res.json();
    return list.length > 0 ? list[0] : null;
  }

  async delete(id: string): Promise<boolean> {
    const res = await fetch(`/api/invoices?id=${id}`, {
      method: "DELETE",
    });
    if (!res.ok) return false;
    const result = await res.json();
    return !!result.success;
  }

  async getStats(filters?: InvoiceFilters): Promise<DashboardStats> {
    const params = new URLSearchParams();
    if (filters) {
      if (filters.startDate) params.set("startDate", filters.startDate);
      if (filters.endDate) params.set("endDate", filters.endDate);
      if (filters.emitenteCnpj) params.set("emitenteCnpj", filters.emitenteCnpj);
      if (filters.tomadorCnpj) params.set("tomadorCnpj", filters.tomadorCnpj);
      if (filters.searchValue) params.set("searchValue", filters.searchValue);
      if (filters.minValue !== undefined) params.set("minValue", String(filters.minValue));
      if (filters.maxValue !== undefined) params.set("maxValue", String(filters.maxValue));
    }
    const res = await fetch(`/api/invoices/stats?${params.toString()}`);
    if (!res.ok) throw new Error("Erro ao carregar estatísticas do servidor");
    return res.json();
  }
}
