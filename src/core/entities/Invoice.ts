export interface Invoice {
  id: string;
  accessKey: string; // Chave de acesso de 50 dígitos
  number: string;     // Número da NFS-e
  issueDate: string;  // Data e hora de emissão (ex: 2026-03-17T20:35:23Z)
  competenceDate: string; // Competência da nota (ex: 12/03/2026)
  
  // Emitente (Prestador)
  emitenteCnpj: string;
  emitenteName: string;
  emitenteCity: string;
  emitenteState: string;
  
  // Tomador (Cliente)
  tomadorCnpj: string;
  tomadorName: string;
  tomadorCity: string;
  tomadorState: string;
  
  // Serviço
  serviceCode: string; // Código de tributação nacional/municipal (ex: 17.04.01)
  serviceDescription: string; // Descrição do serviço prestado
  
  // Valores e Impostos
  serviceValue: number;      // Valor bruto do serviço
  liquidValue: number;       // Valor líquido final da NFS-e
  issqnValue: number;        // Valor do ISSQN apurado
  issqnRate: number;         // Alíquota do ISSQN (%)
  issqnRetained: boolean;    // Indica se o ISSQN foi retido
  federalRetentions: number; // Somatória de IRRF, CSLL, PIS, COFINS retidos
  
  createdAt?: string;
  updatedAt?: string;
}

export interface DashboardStats {
  totalInvoiced: number;      // Faturamento bruto acumulado
  totalLiquid: number;        // Faturamento líquido acumulado
  totalTax: number;           // Total de impostos pagos (ISSQN + Federais)
  invoiceCount: number;       // Quantidade total de notas fiscais
  averageValue: number;       // Valor médio das notas (Ticket Médio)
  topClients: { name: string; value: number; count: number }[]; // Maiores clientes
  topSuppliers: { name: string; value: number; count: number }[]; // Maiores prestadores
  monthlyBilling: { month: string; value: number; tax: number }[]; // Faturamento mensal
}
