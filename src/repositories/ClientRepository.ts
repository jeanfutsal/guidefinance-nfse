import { Client } from "../entities/Client";

export interface ClientFilters {
  search?: string;
  city?: string;
  state?: string;
}

export interface ClientRepository {
  save(client: Omit<Client, "id"> & { id?: string }): Promise<Client>;
  findMany(filters?: ClientFilters): Promise<Client[]>;
  findById(id: string): Promise<Client | null>;
  findByCnpj(cnpj: string): Promise<Client | null>;
  delete(id: string): Promise<boolean>;
}