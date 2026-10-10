export interface Client {
  id: string;
  cnpj: string;
  razaoSocial: string;
  nomeFantasia?: string;
  email?: string;
  phone?: string;
  city?: string;
  state?: string;
  observacao?: string;
  createdAt: string;
  updatedAt: string;
}