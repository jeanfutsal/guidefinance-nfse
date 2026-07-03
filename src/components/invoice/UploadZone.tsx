"use client";

import { useCallback, useState } from "react";
import { Upload, FileText, CheckCircle, XCircle, Loader2, AlertCircle } from "lucide-react";

interface UploadResult {
  fileName: string;
  status: "success" | "error" | "duplicate";
  message?: string;
  data?: any;
}

export function UploadZone() {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState<UploadResult[]>([]);

  const processFiles = useCallback(async (files: File[]) => {
    const pdfs = files.filter((f) => f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf"));
    if (pdfs.length === 0) {
      alert("Selecione arquivos PDF válidos.");
      return;
    }

    setUploading(true);
    setResults([]);

    const newResults: UploadResult[] = [];

    for (const file of pdfs) {
      try {
        // 1. Extrair dados via API
        const formData = new FormData();
        formData.append("file", file);
        const extractRes = await fetch("/api/invoices/extract", {
          method: "POST",
          body: formData,
        });
        const extractData = await extractRes.json();

        if (!extractRes.ok) {
          newResults.push({
            fileName: file.name,
            status: "error",
            message: extractData.error || "Erro ao processar o PDF",
          });
          continue;
        }

        // 2. Salvar no banco
        const saveRes = await fetch("/api/invoices", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(extractData),
        });
        const saveData = await saveRes.json();

        if (saveRes.ok) {
          newResults.push({
            fileName: file.name,
            status: "success",
            message: `NFS-e nº ${extractData.number} salva com sucesso`,
            data: saveData,
          });
        } else {
          newResults.push({
            fileName: file.name,
            status: "error",
            message: saveData.error || "Erro ao salvar a nota",
          });
        }
      } catch (err: any) {
        newResults.push({
          fileName: file.name,
          status: "error",
          message: err.message || "Erro desconhecido",
        });
      }
    }

    setResults(newResults);
    setUploading(false);
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      const files = Array.from(e.dataTransfer.files);
      processFiles(files);
    },
    [processFiles]
  );

  const onFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      processFiles(files);
      e.target.value = "";
    },
    [processFiles]
  );

  return (
    <div className="space-y-6">
      {/* Drop Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-12 transition-all duration-300 cursor-pointer text-center
          ${isDragging
            ? "border-primary bg-primary/5 scale-[1.01]"
            : "border-border hover:border-primary/50 hover:bg-primary/[0.02]"
          }`}
        onClick={() => document.getElementById("file-input")?.click()}
      >
        <input
          id="file-input"
          type="file"
          accept=".pdf,application/pdf"
          multiple
          className="hidden"
          onChange={onFileSelect}
        />

        {/* Animated icon */}
        <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-all duration-300
          ${isDragging ? "bg-primary/20 scale-110" : "bg-primary/10"}`}>
          {uploading ? (
            <Loader2 className="text-primary animate-spin" size={28} />
          ) : (
            <Upload className={`text-primary transition-transform duration-300 ${isDragging ? "scale-125" : ""}`} size={28} />
          )}
        </div>

        {/* Animated rings when dragging */}
        {isDragging && (
          <>
            <div className="absolute inset-4 rounded-xl border border-primary/30 animate-ping" />
            <div className="absolute inset-8 rounded-xl border border-primary/20 animate-ping animation-delay-150" />
          </>
        )}

        <h3 className="text-lg font-semibold text-foreground mb-1">
          {uploading ? "Processando arquivos..." : isDragging ? "Solte os arquivos aqui!" : "Arraste e solte os PDFs aqui"}
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          {uploading
            ? "Extraindo dados das Notas Fiscais…"
            : "ou clique para selecionar arquivos"}
        </p>

        {!uploading && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <FileText size={12} />
            <span>NFS-e · DANFSe · Padrão Nacional · Múltiplos arquivos</span>
          </div>
        )}
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-foreground">
            Resultado do processamento ({results.length} arquivo{results.length !== 1 ? "s" : ""})
          </h3>

          <div className="space-y-2">
            {results.map((r, i) => (
              <div
                key={i}
                className={`flex items-start gap-3 p-3 rounded-lg border text-sm transition-all
                  ${r.status === "success" ? "border-emerald-500/20 bg-emerald-500/5" : ""}
                  ${r.status === "error" ? "border-rose-500/20 bg-rose-500/5" : ""}
                  ${r.status === "duplicate" ? "border-amber-500/20 bg-amber-500/5" : ""}`}
              >
                <div className="flex-shrink-0 mt-0.5">
                  {r.status === "success" && <CheckCircle size={16} className="text-emerald-400" />}
                  {r.status === "error" && <XCircle size={16} className="text-rose-400" />}
                  {r.status === "duplicate" && <AlertCircle size={16} className="text-amber-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">{r.fileName}</p>
                  {r.message && (
                    <p className={`text-xs mt-0.5
                      ${r.status === "success" ? "text-emerald-400" : ""}
                      ${r.status === "error" ? "text-rose-400" : ""}
                      ${r.status === "duplicate" ? "text-amber-400" : ""}`}>
                      {r.message}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {results.some((r) => r.status === "success") && (
            <div className="flex gap-2 pt-2">
              <a
                href="/notas"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
              >
                <FileText size={14} />
                Ver Notas Fiscais
              </a>
              <button
                onClick={() => setResults([])}
                className="px-4 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
              >
                Limpar resultados
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
