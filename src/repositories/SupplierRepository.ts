import { Supplier } from "../entities/Supplier";

export interface SupplierFilters {
  search?: string;
  city?: string;
  state?: string;
}

export interface SupplierRepository {
  save(supplier: Omit<Supplier, "id"> & { id?: string }): Promise<Supplier>;
  findMany(filters?: SupplierFilters): Promise<Supplier[]>;
  findById(id: string): Promise<Supplier | null>;
  findByCnpj(cnpj: string): Promise<Supplier | null>;
  delete(id: string): Promise<boolean>;
}