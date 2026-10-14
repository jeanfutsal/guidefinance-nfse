"use client";

import { Download } from "lucide-react";
import { buildCsv, downloadCsv } from "@/lib/csv";

export interface CsvColumn<T> {
  header: string;
  value: (row: T) => string | number | boolean | null | undefined;
}

interface ExportCsvButtonProps<T> {
  /** Nome do arquivo baixado (ex.: "notas-fiscais.csv") */
  filename: string;
  columns: CsvColumn<T>[];
  /** Dados já filtrados (o que o usuário vê na tela) */
  data: T[];
  /** Texto do botão (padrão: "Exportar CSV") */
  label?: string;
}

/**
 * Botão de exportação CSV de dados já carregados/filtrados na página.
 * Desabilitado quando não há linhas para exportar.
 */
export function ExportCsvButton<T>({ filename, columns, data, label = "Exportar CSV" }: ExportCsvButtonProps<T>) {
  const disabled = data.length === 0;

  function handleClick() {
    const csv = buildCsv(
      columns.map((c) => c.header),
      data.map((row) => columns.map((c) => c.value(row)))
    );
    downloadCsv(filename, csv);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      title={disabled ? "Nenhum dado para exportar" : `Exportar ${data.length} registro(s) para CSV`}
      className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
    >
      <Download size={14} /> {label}
    </button>
  );
}
