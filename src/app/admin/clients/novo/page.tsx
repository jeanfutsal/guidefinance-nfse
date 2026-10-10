import { Header } from "@/components/ui/Header";
import { ContactForm } from "@/components/admin/ContactForm";

export const dynamic = "force-dynamic";

export default function NewClientPage() {
  return (
    <div>
      <Header title="Clientes" subtitle="Cadastrar novo cliente (tomador)" />
      <div className="p-6">
        <ContactForm
          apiBase="/api/clients"
          backHref="/admin/clients"
          title="Novo Cliente"
        />
      </div>
    </div>
  );
}
