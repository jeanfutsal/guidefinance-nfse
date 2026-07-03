import { InvoiceRepository } from "../../core/repositories/InvoiceRepository";
import { PrismaInvoiceRepository } from "./PrismaInvoiceRepository";
import { IndexedDBInvoiceRepository } from "./IndexedDBInvoiceRepository";
import { HttpInvoiceRepository } from "./HttpInvoiceRepository";

export class InvoiceRepositoryProvider {
  private static serverInstance?: InvoiceRepository;
  private static localInstance?: InvoiceRepository;
  private static httpInstance?: InvoiceRepository;

  /**
   * Retorna o repositório de servidor baseado no Prisma.
   * Deve ser usado apenas no contexto do Next.js Server (API Routes ou Server Components).
   */
  static getServerRepository(): InvoiceRepository {
    if (!this.serverInstance) {
      this.serverInstance = new PrismaInvoiceRepository();
    }
    return this.serverInstance;
  }

  /**
   * Retorna o repositório adequado para o cliente (navegador).
   * @param useRemote Se true, faz requisições HTTP para a API do backend (que grava no Postgres/SQLite).
   *                  Se false, salva localmente no navegador (IndexedDB).
   */
  static getClientRepository(useRemote: boolean = false): InvoiceRepository {
    if (typeof window === "undefined") {
      return this.getServerRepository();
    }

    if (useRemote) {
      if (!this.httpInstance) {
        this.httpInstance = new HttpInvoiceRepository();
      }
      return this.httpInstance;
    }

    if (!this.localInstance) {
      this.localInstance = new IndexedDBInvoiceRepository();
    }
    return this.localInstance;
  }
}
export default InvoiceRepositoryProvider;
