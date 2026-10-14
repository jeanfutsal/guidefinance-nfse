/**
 * Utilitários de exportação CSV (UTF-8 com BOM para Excel abrir acentos
 * corretamente; separador "," e fim de linha CRLF conforme RFC 4180).
 */

export type CsvValue = string | number | boolean | null | undefined;

/** Escapa um campo: sempre entre aspas, aspas internas duplicadas. */
export function escapeCsvField(value: CsvValue): string {
  if (value === null || value === undefined) return '""';
  const str = typeof value === "boolean" ? (value ? "true" : "false") : String(value);
  return `"${str.replace(/"/g, '""')}"`;
}

/** Monta o conteúdo CSV completo (com BOM) a partir de cabeçalho + linhas. */
export function buildCsv(headers: string[], rows: CsvValue[][]): string {
  const lines = [headers.map(escapeCsvField).join(","), ...rows.map((row) => row.map(escapeCsvField).join(","))];
  return "\uFEFF" + lines.join("\r\n");
}

/** Dispara o download do CSV no browser. */
export function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
