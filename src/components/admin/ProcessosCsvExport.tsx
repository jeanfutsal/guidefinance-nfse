"use client";

import { ExportCsvButton, CsvColumn } from "@/components/ui/ExportCsvButton";
import { PROCESS_STATUS_LABELS, Process } from "@/entities/Process";

const PROCESSOS_CSV_COLUMNS: CsvColumn<Process>[] = [
  { header: "Título", value: (p) => p.title },
  {
    header: "Status",
    value: (p) => (PROCESS_STATUS_LABELS[p.status] ?? PROCESS_STATUS_LABELS.aberto).label,
  },
  { header: "Cliente", value: (p) => p.clientName ?? "" },
  { header: "Fornecedor", value: (p) => p.supplierName ?? "" },
  { header: "Etapas", value: (p) => p.steps?.length ?? 0 },
  { header: "Descrição", value: (p) => p.description ?? "" },
  {
    header: "Atualizado em",
    value: (p) =>
      new Intl.DateTimeFormat("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }).format(new Date(p.updatedAt)),
  },
];

/**
 * Exportação CSV de processos.
 * Vive num componente cliente porque o ExportCsvButton recebe colunas com
 * funções, que não podem ser passadas de Server Components (erro de
 * serialização em produção).
 */
export function ProcessosCsvExport({ processes }: { processes: Process[] }) {
  return <ExportCsvButton filename="processos.csv" columns={PROCESSOS_CSV_COLUMNS} data={processes} />;
}
