import { Header } from "@/components/ui/Header";
import { ProcessForm } from "@/components/admin/ProcessForm";
import { requireAdmin } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export default function NewProcessPage() {
  requireAdmin();
  return (
    <div>
      <Header title="Processos" subtitle="Criar novo processo de acompanhamento" />
      <div className="p-6">
        <ProcessForm backHref="/admin/processos" title="Novo Processo" />
      </div>
    </div>
  );
}
