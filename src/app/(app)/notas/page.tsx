"use client";

import { useEffect, useState, useCallback } from "react";
import { Header } from "@/components/ui/Header";
import { Invoice } from "@/core/entities/Invoice";
import {
  Search,
  Filter,
  Download,
  Trash2,
  Eye,
  ChevronLeft,
  ChevronRight,
  X,
  FileText,
  Upload,
} from "lucide-react";
import Link from "next/link";

function formatBRL(v: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}

function formatDate(iso: string) {
  try {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit", month: "2-digit", year: "numeric",
    }).format(new Date(iso));
  } catch {
    return "—";
  }
}

const PAGE_SIZE = 10;

interface DetailModalProps {
  invoice: Invoice;
  onClose: () => void;
}

function DetailModal({ invoice, onClose }: DetailModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto glass-panel rounded-2xl border border-border shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 glass-panel border-b border-border px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <div>
            <h2 className="font-bold text-foreground">NFS-e nº {invoice.number}</h2>
            <p className="text-xs text-muted-foreground">Chave: {invoice.accessKey}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-all">
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Valores */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-lg bg-indigo-500/5 border border-indigo-500/10 text-center">
              <p className="text-xs text-muted-foreground">Valor do Serviço</p>
              <p className="text-lg font-bold text-indigo-400 mt-0.5">{formatBRL(invoice.serviceValue)}</p>
            </div>
            <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10 text-center">
              <p className="text-xs text-muted-foreground">Valor Líquido</p>
              <p className="text-lg font-bold text-emerald-400 mt-0.5">{formatBRL(invoice.liquidValue)}</p>
            </div>
            <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/10 text-center">
              <p className="text-xs text-muted-foreground">ISSQN</p>
              <p className="text-lg font-bold text-amber-400 mt-0.5">{formatBRL(invoice.issqnValue)}</p>
            </div>
          </div>

          {/* Grid de campos */}
          {[
            { label: "Emissão", value: formatDate(invoice.issueDate) },
            { label: "Competência", value: invoice.competenceDate },
            { label: "CNPJ Emitente", value: invoice.emitenteCnpj },
            { label: "Emitente", value: invoice.emitenteName },
            { label: "Município Emitente", value: `${invoice.emitenteCity} - ${invoice.emitenteState}` },
            { label: "CNPJ Tomador", value: invoice.tomadorCnpj },
            { label: "Tomador", value: invoice.tomadorName },
            { label: "Município Tomador", value: `${invoice.tomadorCity} - ${invoice.tomadorState}` },
            { label: "Código Tributação", value: invoice.serviceCode || "—" },
            { label: "Alíquota ISSQN", value: invoice.issqnRate > 0 ? `${invoice.issqnRate}%` : "—" },
            { label: "ISSQN Retido", value: invoice.issqnRetained ? "Sim" : "Não" },
            { label: "Retenções Federais", value: formatBRL(invoice.federalRetentions) },
          ].reduce((rows: any[], field, i) => {
            if (i % 2 === 0) rows.push([field]);
            else rows[rows.length - 1].push(field);
            return rows;
          }, []).map((row, ri) => (
            <div key={ri} className="grid grid-cols-2 gap-3">
              {row.map((field: any) => (
                <div key={field.label}>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">{field.label}</p>
                  <p className="text-sm text-foreground font-medium mt-0.5 break-words">{field.value || "—"}</p>
                </div>
              ))}
            </div>
          ))}

          {/* Descrição do serviço */}
          {invoice.serviceDescription && (
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Descrição do Serviço</p>
              <p className="text-sm text-foreground bg-secondary/50 rounded-lg p-3 leading-relaxed">{invoice.serviceDescription}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function NotasPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [page, setPage] = useState(1);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("searchValue", search);
      const res = await fetch(`/api/invoices?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setInvoices(data);
        setPage(1);
      }
    } catch (err) {
      console.error("Erro ao carregar notas:", err);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const timeout = setTimeout(fetchInvoices, 300);
    return () => clearTimeout(timeout);
  }, [fetchInvoices]);

  async function handleDelete(id: string) {
    if (!confirm("Excluir esta nota fiscal? Esta ação não pode ser desfeita.")) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/invoices?id=${id}`, { method: "DELETE" });
      if (res.ok) setInvoices((prev) => prev.filter((inv) => inv.id !== id));
    } finally {
      setDeleting(null);
    }
  }

  function exportCSV() {
    const headers = ["Número", "Emissão", "Emitente", "CNPJ Emitente", "Tomador", "CNPJ Tomador", "Valor Serviço", "Valor Líquido", "ISSQN", "Chave de Acesso"];
    const rows = invoices.map((inv) => [
      inv.number, formatDate(inv.issueDate), inv.emitenteName, inv.emitenteCnpj,
      inv.tomadorName, inv.tomadorCnpj,
      inv.serviceValue.toFixed(2), inv.liquidValue.toFixed(2), inv.issqnValue.toFixed(2),
      inv.accessKey,
    ]);
    const csv = [headers, ...rows].map((r) => r.map((v) => `"${v}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "notas-fiscais.csv"; a.click();
  }

  const totalPages = Math.max(1, Math.ceil(invoices.length / PAGE_SIZE));
  const paginated = invoices.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <>
      {selectedInvoice && (
        <DetailModal invoice={selectedInvoice} onClose={() => setSelectedInvoice(null)} />
      )}

      <div>
        <Header title="Notas Fiscais" subtitle={`${invoices.length} nota${invoices.length !== 1 ? "s" : ""} cadastrada${invoices.length !== 1 ? "s" : ""}`} />

        <div className="p-6 space-y-4">
          {/* Controls */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex-1 min-w-48 relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar por CNPJ, nome, número, chave..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-2 rounded-lg glass-input text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  <X size={12} />
                </button>
              )}
            </div>
            <button className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground text-sm transition-all border border-border">
              <Filter size={14} /> Filtros
            </button>
            {invoices.length > 0 && (
              <button onClick={exportCSV} className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-all">
                <Download size={14} /> Exportar CSV
              </button>
            )}
            <Link href="/upload" className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm hover:opacity-90 transition-opacity">
              <Upload size={14} /> Upload
            </Link>
          </div>

          {/* Table */}
          {loading ? (
            <div className="glass-card rounded-xl border border-border p-12 text-center text-muted-foreground text-sm">
              Carregando notas fiscais...
            </div>
          ) : invoices.length === 0 ? (
            <div className="glass-card rounded-xl border border-border p-12 text-center">
              <FileText size={40} className="text-muted-foreground mx-auto mb-3" />
              <p className="text-foreground font-medium">Nenhuma nota fiscal encontrada</p>
              <p className="text-sm text-muted-foreground mt-1">
                {search ? "Tente outra busca ou " : ""}
                <Link href="/upload" className="text-primary hover:underline">faça upload de PDFs</Link>
              </p>
            </div>
          ) : (
            <div className="glass-card rounded-xl border border-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      {["Nº", "Emissão", "Emitente", "Tomador", "Valor", "Líquido", "ISSQN", ""].map((h) => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {paginated.map((inv) => (
                      <tr key={inv.id} className="hover:bg-secondary/30 transition-colors group">
                        <td className="px-4 py-3 font-medium text-foreground whitespace-nowrap">#{inv.number}</td>
                        <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{formatDate(inv.issueDate)}</td>
                        <td className="px-4 py-3 max-w-36 truncate" title={inv.emitenteName}>
                          <span className="text-foreground">{inv.emitenteName}</span>
                          <br />
                          <span className="text-xs text-muted-foreground">{inv.emitenteCnpj}</span>
                        </td>
                        <td className="px-4 py-3 max-w-36 truncate" title={inv.tomadorName}>
                          <span className="text-foreground">{inv.tomadorName}</span>
                          <br />
                          <span className="text-xs text-muted-foreground">{inv.tomadorCnpj}</span>
                        </td>
                        <td className="px-4 py-3 font-medium text-indigo-400 whitespace-nowrap">{formatBRL(inv.serviceValue)}</td>
                        <td className="px-4 py-3 font-medium text-emerald-400 whitespace-nowrap">{formatBRL(inv.liquidValue)}</td>
                        <td className="px-4 py-3 text-amber-400 whitespace-nowrap">{formatBRL(inv.issqnValue)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => setSelectedInvoice(inv)}
                              className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-all"
                              title="Ver detalhes"
                            >
                              <Eye size={14} />
                            </button>
                            <button
                              onClick={() => handleDelete(inv.id!)}
                              disabled={deleting === inv.id}
                              className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-rose-500/10 text-muted-foreground hover:text-rose-400 transition-all"
                              title="Excluir nota"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-border text-sm text-muted-foreground">
                  <span>
                    {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, invoices.length)} de {invoices.length}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-secondary disabled:opacity-30 transition-all"
                    >
                      <ChevronLeft size={14} />
                    </button>
                    <span className="px-2">
                      {page} / {totalPages}
                    </span>
                    <button
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-secondary disabled:opacity-30 transition-all"
                    >
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
