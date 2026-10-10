import { Header } from "@/components/ui/Header";
import { ContactForm } from "@/components/admin/ContactForm";

export const dynamic = "force-dynamic";

export default function NewSupplierPage() {
  return (
    <div>
      <Header title="Fornecedores" subtitle="Cadastrar novo fornecedor (emitente)" />
      <div className="p-6">
        <ContactForm
          apiBase="/api/suppliers"
          backHref="/admin/fornecedores"
          title="Novo Fornecedor"
        />
      </div>
    </div>
  );
}
