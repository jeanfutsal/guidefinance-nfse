import { Invoice, DashboardStats } from "../entities/Invoice";

export interface InvoiceFilters {
  startDate?: string;
  endDate?: string;
  emitenteCnpj?: string;
  tomadorCnpj?: string;
  searchValue?: string; // Busca textual global (chave, nome, etc.)
  minValue?: number;
  maxValue?: number;
}

export interface InvoiceRepository {
  /**
   * Salva ou atualiza uma nota fiscal
   */
  save(invoice: Omit<Invoice, "id"> & { id?: string }): Promise<Invoice>;

  /**
   * Busca todas as notas fiscais que satisfaçam os filtros
   */
  findAll(filters?: InvoiceFilters): Promise<Invoice[]>;

  /**
   * Busca uma nota fiscal pelo ID
   */
  findById(id: string): Promise<Invoice | null>;

  /**
   * Busca uma nota fiscal pela Chave de Acesso (50 dígitos)
   */
  findByAccessKey(accessKey: string): Promise<Invoice | null>;

  /**
   * Exclui uma nota fiscal pelo ID
   */
  delete(id: string): Promise<boolean>;

  /**
   * Calcula as estatísticas consolidadas para o dashboard financeiro
   */
  getStats(filters?: InvoiceFilters): Promise<DashboardStats>;
}
