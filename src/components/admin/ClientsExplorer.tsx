"use client";

import { Fragment, useCallback, useState } from "react";
import { Client } from "@/entities/Client";
import { Invoice } from "@/core/entities/Invoice";
import { RowActions } from "@/components/admin/RowActions";
import { InvoiceDetailModal } from "@/components/invoice/InvoiceDetailModal";
import {
  Search,
  ChevronDown,
  ChevronRight,
  Loader2,
  AlertCircle,
  FileText,
  Users,
  X,
} from "lucide-react";

export type ClientWithCount = Client & { invoiceCount: number };

interface ClientsExplorerProps {
  clients: ClientWithCount[];
  /** Elemento alinhado a direita da barra de busca (ex.: botao Novo). */
  actions?: React.ReactNode;
}

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

/**
 * Explorer de clientes (admin): busca instantânea por nome/CNPJ,
 * linhas expansíveis com as notas fiscais de cada cliente e modal
 * com todos os dados da nota ao clicar nela.
 */
export function ClientsExplorer({ clients, actions }: ClientsExplorerProps) {
  const [query, setQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [invoicesByClient, setInvoicesByClient] = useState<Record<string, Invoice[]>>({});
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [errorId, setErrorId] = useState<string | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  // Busca instantânea (client-side): nome, nome fantasia ou CNPJ
  const q = query.trim().toLowerCase();
  const qDigits = q.replace(/[^0-9]/g, "");
  const filtered =
    q === ""
      ? clients
      : clients.filter((c) => {
          if (c.razaoSocial.toLowerCase().includes(q)) return true;
          if (c.nomeFantasia && c.nomeFantasia.toLowerCase().includes(q)) return true;
          if (qDigits.length >= 2 && c.cnpj.replace(/[^0-9]/g, "").includes(qDigits)) return true;
          return false;
        });

  const loadInvoices = useCallback(
    async (clientId: string) => {
      setLoadingId(clientId);
      setErrorId(null);
      try {
        const res = await fetch(`/api/clients/${clientId}/invoices`);
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          setErrorId(body.error ?? "Erro ao carregar as notas deste cliente.");
          return;
        }
        const data: Invoice[] = await res.json();
        setInvoicesByClient((prev) => ({ ...prev, [clientId]: data }));
      } catch {
        setErrorId("Erro inesperado. Tente novamente.");
      } finally {
        setLoadingId(null);
      }
    },
    []
  );

  function toggle(clientId: string) {
    const next = expandedId === clientId ? null : clientId;
    setExpandedId(next);
    if (next && !invoicesByClient[next]) {
      void loadInvoices(next);
    }
  }

  return (
    <>
      {/* Barra de busca + acoes */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 max-w-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar cliente por nome ou CNPJ..."
              className="glass-input w-full pl-9 pr-9 py-2 text-sm rounded-lg text-foreground placeholder:text-muted-foreground"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                title="Limpar busca"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X size={14} />
              </button>
            )}
          </div>
          {/* Contador de resultados */}
          {q && (
            <p className="text-xs text-muted-foreground mt-1.5">
              {filtered.length === 0
                ? "Nenhum cliente encontrado"
                : `${filtered.length} cliente${filtered.length === 1 ? "" : "s"} encontrado${filtered.length === 1 ? "" : "s"}`}
            </p>
          )}
        </div>
        {actions}
      </div>

      <div className="glass-card rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/30">
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Razão Social</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">CNPJ</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground">Notas</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Cidade</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Estado</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => {
              const expanded = expandedId === c.id;
              const invoices = invoicesByClient[c.id];
              const loading = loadingId === c.id;
              return (
                <Fragment key={c.id}>
                  <tr
                    onClick={() => toggle(c.id)}
                    className="border-b border-border/50 hover:bg-secondary/20 transition-colors group cursor-pointer"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {expanded ? (
                          <ChevronDown size={14} className="text-primary flex-shrink-0" />
                        ) : (
                          <ChevronRight size={14} className="text-muted-foreground flex-shrink-0 group-hover:text-foreground" />
                        )}
                        <div className="min-w-0">
                          <span className="font-medium text-foreground block truncate" title={c.razaoSocial}>
                            {c.razaoSocial}
                          </span>
                          {c.nomeFantasia && (
                            <span className="text-xs text-muted-foreground block truncate">{c.nomeFantasia}</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{c.cnpj}</td>
                    <td className="px-4 py-3 text-right">
                      <span className="inline-flex items-center justify-center min-w-6 px-1.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                        {c.invoiceCount}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{c.city || "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{c.state || "—"}</td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end">
                        <RowActions
                          editHref={`/admin/clients/${c.id}`}
                          deleteUrl={`/api/clients/${c.id}`}
                          label={c.razaoSocial}
                        />
                      </div>
                    </td>
                  </tr>

                  {/* Painel expandido: notas do cliente */}
                  {expanded && (
                    <tr className="border-b border-border/50 bg-secondary/10">
                      <td colSpan={6} className="px-4 py-4">
                        {loading && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                            <Loader2 size={14} className="animate-spin" />
                            Carregando notas...
                          </div>
                        )}
                        {!loading && errorId && (
                          <div className="flex items-start gap-2 rounded-lg border border-error/40 bg-error/10 px-3 py-2.5 text-xs text-error">
                            <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                            <span>{errorId}</span>
                          </div>
                        )}
                        {!loading && !errorId && invoices && invoices.length === 0 && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                            <FileText size={14} />
                            Nenhuma nota fiscal encontrada para este cliente.
                          </div>
                        )}
                        {!loading && !errorId && invoices && invoices.length > 0 && (
                          <div className="rounded-lg border border-border overflow-hidden">
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="bg-secondary/30 border-b border-border">
                                  <th className="text-left px-3 py-2 font-medium text-muted-foreground">Nº NFS-e</th>
                                  <th className="text-left px-3 py-2 font-medium text-muted-foreground">Emissão</th>
                                  <th className="text-left px-3 py-2 font-medium text-muted-foreground">Serviço</th>
                                  <th className="text-right px-3 py-2 font-medium text-muted-foreground">Valor</th>
                                  <th className="text-right px-3 py-2 font-medium text-muted-foreground">Líquido</th>
                                  <th className="text-right px-3 py-2 font-medium text-muted-foreground">ISSQN</th>
                                </tr>
                              </thead>
                              <tbody>
                                {invoices.map((inv) => (
                                  <tr
                                    key={inv.id}
                                    onClick={() => setSelectedInvoice(inv)}
                                    className="border-b border-border/40 last:border-0 hover:bg-primary/5 transition-colors cursor-pointer"
                                    title="Ver todos os dados da nota"
                                  >
                                    <td className="px-3 py-2 font-medium text-foreground">{inv.number}</td>
                                    <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">{formatDate(inv.issueDate)}</td>
                                    <td className="px-3 py-2 text-muted-foreground max-w-52 truncate" title={inv.serviceDescription}>
                                      {inv.serviceDescription || "—"}
                                    </td>
                                    <td className="px-3 py-2 text-right text-indigo-400 whitespace-nowrap">{formatBRL(inv.serviceValue)}</td>
                                    <td className="px-3 py-2 text-right text-emerald-400 whitespace-nowrap">{formatBRL(inv.liquidValue)}</td>
                                    <td className="px-3 py-2 text-right text-amber-400 whitespace-nowrap">{formatBRL(inv.issqnValue)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                            <div className="flex items-center justify-end gap-2 px-3 py-2 bg-secondary/20 border-t border-border text-xs text-muted-foreground">
                              <FileText size={12} />
                              Clique em uma nota para ver todos os dados
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center">
                  <Users size={28} className="mx-auto text-muted-foreground/50 mb-2" />
                  <p className="text-muted-foreground text-sm">
                    {q ? `Nenhum cliente encontrado para "${query.trim()}".` : "Nenhum cliente cadastrado ainda."}
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal com todos os dados da nota */}
      {selectedInvoice && (
        <InvoiceDetailModal invoice={selectedInvoice} onClose={() => setSelectedInvoice(null)} />
      )}
    </>
  );
}