import { requireAdmin } from "@/lib/permissions";
import Link from "next/link";
import { DatabaseZap } from "lucide-react";
import AuditTable from "./AuditTable";

export const dynamic = "force-dynamic";

export default async function AuditoriaPage() {
  await requireAdmin();

  return (
    <div className="p-6">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <DatabaseZap size={24} className="text-indigo-500" />
            Histórico de Alterações
          </h1>
          <p className="text-muted-foreground mt-1">
            Auditoria de criações, alterações, exclusões, arquivamentos e restaurações
          </p>
        </div>
        <Link
          href="/admin"
          className="glass-panel px-4 py-2 rounded-lg border border-border text-sm hover:bg-secondary"
        >
          ← Voltar ao painel
        </Link>
      </header>

      <AuditTable />
    </div>
  );
}