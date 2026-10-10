import { notFound } from "next/navigation";
import { Header } from "@/components/ui/Header";
import { ContactForm } from "@/components/admin/ContactForm";
import { PrismaSupplierRepository } from "@/infra/repositories/PrismaSupplierRepository";

export const dynamic = "force-dynamic";

const repo = new PrismaSupplierRepository();

export default async function EditSupplierPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supplier = await repo.findById(id);
  if (!supplier) notFound();

  return (
    <div>
      <Header title="Fornecedores" subtitle={`Editar: ${supplier.razaoSocial}`} />
      <div className="p-6">
        <ContactForm
          apiBase="/api/suppliers"
          backHref="/admin/fornecedores"
          title="Editar Fornecedor"
          initial={supplier}
        />
      </div>
    </div>
  );
}
