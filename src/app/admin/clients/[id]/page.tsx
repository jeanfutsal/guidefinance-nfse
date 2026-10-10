import { notFound } from "next/navigation";
import { Header } from "@/components/ui/Header";
import { ContactForm } from "@/components/admin/ContactForm";
import { PrismaClientRepository } from "@/infra/repositories/PrismaClientRepository";

export const dynamic = "force-dynamic";

const repo = new PrismaClientRepository();

export default async function EditClientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const client = await repo.findById(id);
  if (!client) notFound();

  return (
    <div>
      <Header title="Clientes" subtitle={`Editar: ${client.razaoSocial}`} />
      <div className="p-6">
        <ContactForm
          apiBase="/api/clients"
          backHref="/admin/clients"
          title="Editar Cliente"
          initial={client}
        />
      </div>
    </div>
  );
}
