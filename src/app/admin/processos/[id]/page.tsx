import { notFound } from "next/navigation";
import { Header } from "@/components/ui/Header";
import { ProcessForm } from "@/components/admin/ProcessForm";
import { StepsTimeline } from "@/components/admin/StepsTimeline";
import { PrismaProcessRepository } from "@/infra/repositories/PrismaProcessRepository";
import { requireAdmin } from "@/lib/permissions";
import { PROCESS_STATUS_LABELS } from "@/entities/Process";

export const dynamic = "force-dynamic";

const repo = new PrismaProcessRepository();

export default async function ProcessDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const process = await repo.findById(id);
  if (!process) notFound();

  const badge = PROCESS_STATUS_LABELS[process.status] ?? PROCESS_STATUS_LABELS.aberto;

  return (
    <div>
      <Header title="Processos" subtitle={process.title} />
      <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <div className="space-y-6">
          <ProcessForm
            backHref="/admin/processos"
            title="Editar Processo"
            initial={process}
          />
        </div>

        <div className="glass-card rounded-xl border border-border p-6">
          <div className="flex items-center justify-between gap-3 mb-5">
            <h2 className="font-semibold text-foreground">Timeline do processo</h2>
            <span
              className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${badge.color}`}
            >
              {badge.label}
            </span>
          </div>
          <StepsTimeline processId={process.id} initialSteps={process.steps ?? []} />
        </div>
      </div>
    </div>
  );
}
