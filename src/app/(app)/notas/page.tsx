"use client";

import { useEffect, useState, useCallback } from "react";
import { Header } from "@/components/ui/Header";
import { ExportCsvButton, CsvColumn } from "@/components/ui/ExportCsvButton";
import { Invoice } from "@/core/entities/Invoice";
import {
  Search,
  Filter,
  Archive,
  ArchiveRestore,
  Eye,
  ChevronLeft,
  ChevronRight,
  X,
  FileText,
  Upload,
} from "lucide-react";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { InvoiceDetailModal } from "@/components/invoice/InvoiceDetailModal";

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

const NOTAS_CSV_COLUMNS: CsvColumn<Invoice>[] = [
  { header: "Número", value: (i) => i.number },
  { header: "Emissão", value: (i) => formatDate(i.issueDate) },
  { header: "Emitente", value: (i) => i.emitenteName },
  { header: "CNPJ Emitente", value: (i) => i.emitenteCnpj },
  { header: "Tomador", value: (i) => i.tomadorName },
  { header: "CNPJ Tomador", value: (i) => i.tomadorCnpj },
  { header: "Valor Serviço", value: (i) => i.serviceValue.toFixed(2) },
  { header: "Valor Líquido", value: (i) => i.liquidValue.toFixed(2) },
  { header: "ISSQN", value: (i) => i.issqnValue.toFixed(2) },
  { header: "Chave de Acesso", value: (i) => i.accessKey },
];

export default function NotasPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [page, setPage] = useState(1);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  // Item 13: upload é exclusivo de admin
  const { data: session } = authClient.useSession();
  const isAdmin = (session?.user as { role?: string } | undefined)?.role === "admin";


  // Inicializa a busca a partir de ?q= vindo da busca global
  useEffect(() => {
    const t = setTimeout(() => {
      const q = new URLSearchParams(window.location.search).get("q");
      if (q) setSearch(q);
    }, 0);
    return () => clearTimeout(t);
  }, []);

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("searchValue", search);
      if (showArchived) params.set("archived", "1");
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
  }, [search, showArchived]);

  useEffect(() => {
    const timeout = setTimeout(fetchInvoices, 300);
    return () => clearTimeout(timeout);
  }, [fetchInvoices]);

  async function handleArchive(id: string, archived: boolean) {
    const message = archived
      ? "Arquivar esta nota fiscal? Ela ficará oculta da listagem e do dashboard, mas poderá ser restaurada depois."
      : "Restaurar esta nota fiscal para a listagem principal?";
    if (!confirm(message)) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/invoices`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, archived }),
      });
      if (res.ok) setInvoices((prev) => prev.filter((inv) => inv.id !== id));
    } finally {
      setDeleting(null);
    }
  }

  const totalPages = Math.max(1, Math.ceil(invoices.length / PAGE_SIZE));
  const paginated = invoices.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <>
      {selectedInvoice && (
        <InvoiceDetailModal invoice={selectedInvoice} onClose={() => setSelectedInvoice(null)} />
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
            {isAdmin && (
              <button
                onClick={() => setShowArchived((v) => !v)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all border ${
                  showArchived
                    ? "bg-primary/10 text-primary border-primary/20"
                    : "border-border text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                <Archive size={14} /> {showArchived ? "Ver ativas" : "Arquivadas"}
              </button>
            )}
            <ExportCsvButton filename="notas-fiscais.csv" columns={NOTAS_CSV_COLUMNS} data={invoices} />
            {isAdmin && (
              <Link href="/upload" className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm hover:opacity-90 transition-opacity">
                <Upload size={14} /> Upload
              </Link>
            )}
          </div>

          {/* Table */}
          {loading ? (
            <div className="glass-card rounded-xl border border-border p-12 text-center text-muted-foreground text-sm">
              Carregando notas fiscais...
            </div>
          ) : invoices.length === 0 ? (
            <div className="glass-card rounded-xl border border-border p-12 text-center">
              <FileText size={40} className="text-muted-foreground mx-auto mb-3" />
              <p className="text-foreground font-medium">
                {showArchived ? "Nenhuma nota arquivada" : "Nenhuma nota fiscal encontrada"}
              </p>
              {!showArchived && (
                <p className="text-sm text-muted-foreground mt-1">
                  {isAdmin ? (
                    <>
                      {search ? "Tente outra busca ou " : ""}
                      <Link href="/upload" className="text-primary hover:underline">faça upload de PDFs</Link>
                    </>
                  ) : search ? (
                    "Tente outra busca."
                  ) : null}
                </p>
              )}
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
                        <td className="px-4 py-3 font-medium text-foreground whitespace-nowrap">
                          #{inv.number}
                          {inv.archived && (
                            <span className="ml-2 text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400 align-middle">
                              Arquivada
                            </span>
                          )}
                        </td>
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
                            {isAdmin && (showArchived ? (
                              <button
                                onClick={() => handleArchive(inv.id!, false)}
                                disabled={deleting === inv.id}
                                className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-emerald-500/10 text-muted-foreground hover:text-emerald-400 transition-all"
                                title="Restaurar nota"
                              >
                                <ArchiveRestore size={14} />
                              </button>
                            ) : (
                              <button
                                onClick={() => handleArchive(inv.id!, true)}
                                disabled={deleting === inv.id}
                                className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-amber-500/10 text-muted-foreground hover:text-amber-400 transition-all"
                                title="Arquivar nota"
                              >
                                <Archive size={14} />
                              </button>
                            ))}
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
