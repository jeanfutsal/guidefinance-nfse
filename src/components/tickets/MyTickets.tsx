"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Plus,
  Search,
  Ticket,
  Loader2,
  AlertCircle,
  X,
  MessageSquare,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  Ticket as TicketType,
  TICKET_STATUS_LABELS,
  TICKET_PRIORITY_LABELS,
  TICKET_PRIORITIES,
} from "@/entities/Ticket";

const fieldClass =
  "glass-input w-full rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground";

function formatDate(iso: string) {
  try {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return "—";
  }
}

export function MyTickets() {
  const [tickets, setTickets] = useState<TicketType[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Modal de criação
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", priority: "media" });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/tickets");
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? "Erro ao carregar tickets.");
        return;
      }
      const data: TicketType[] = await res.json();
      setTickets(data);
    } catch {
      setError("Erro inesperado. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(fetchTickets, 0);
    return () => clearTimeout(t);
  }, [fetchTickets]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreateError(null);
    setCreating(true);
    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, description: form.description || null }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setCreateError(body.error ?? "Erro ao abrir ticket.");
        return;
      }
      setCreateOpen(false);
      setForm({ title: "", description: "", priority: "media" });
      fetchTickets();
    } catch {
      setCreateError("Erro inesperado. Tente novamente.");
    } finally {
      setCreating(false);
    }
  }

  const filtered = tickets.filter(
    (t) =>
      !search ||
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      (t.description ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            size={16}
          />
          <input
            type="text"
            placeholder="Buscar nos meus tickets..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`${fieldClass} pl-9 pr-4`}
          />
        </div>
        <button
          onClick={() => {
            setCreateError(null);
            setCreateOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <Plus size={16} />
          Abrir Chamado
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-error/40 bg-error/10 px-3 py-2.5 text-sm text-error">
          <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div className="glass-card rounded-xl border border-border">
        {loading ? (
          <div className="p-12 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
            <Loader2 size={16} className="animate-spin" /> Carregando tickets...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center">
            <Ticket size={28} className="mx-auto text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground">
              {search ? "Nenhum ticket encontrado." : "Você ainda não abriu nenhum chamado."}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-border/50">
            {filtered.map((t) => {
              const status = TICKET_STATUS_LABELS[t.status] ?? TICKET_STATUS_LABELS.aberto;
              const priority =
                TICKET_PRIORITY_LABELS[t.priority] ?? TICKET_PRIORITY_LABELS.media;
              const expanded = expandedId === t.id;
              return (
                <li key={t.id}>
                  <button
                    onClick={() => setExpandedId(expanded ? null : t.id)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-secondary/20 transition-colors"
                  >
                    <Ticket size={16} className="text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{t.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(t.createdAt)}
                        {t.processTitle ? ` · Processo: ${t.processTitle}` : ""}
                      </p>
                    </div>
                    <span
                      className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full flex-shrink-0 ${priority.color}`}
                    >
                      {priority.label}
                    </span>
                    <span
                      className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full flex-shrink-0 ${status.color}`}
                    >
                      {status.label}
                    </span>
                    {expanded ? (
                      <ChevronUp size={16} className="text-muted-foreground flex-shrink-0" />
                    ) : (
                      <ChevronDown size={16} className="text-muted-foreground flex-shrink-0" />
                    )}
                  </button>

                  {expanded && (
                    <div className="px-4 pb-4 pl-12 space-y-3">
                      {t.description && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-1">
                            Descrição
                          </p>
                          <p className="text-sm text-foreground whitespace-pre-wrap">
                            {t.description}
                          </p>
                        </div>
                      )}
                      {t.response ? (
                        <div className="rounded-lg border border-cyan-500/30 bg-cyan-500/5 p-3">
                          <p className="flex items-center gap-1.5 text-xs font-medium text-cyan-400 mb-1">
                            <MessageSquare size={12} /> Resposta da equipe
                            {t.respondedAt && (
                              <span className="text-muted-foreground font-normal">
                                · {formatDate(t.respondedAt)}
                              </span>
                            )}
                          </p>
                          <p className="text-sm text-foreground whitespace-pre-wrap">
                            {t.response}
                          </p>
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground">
                          Aguardando resposta da equipe.
                        </p>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>


      {/* Modal: abrir chamado */}
      {createOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => !creating && setCreateOpen(false)}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div
            className="relative z-10 w-full max-w-md glass-panel rounded-2xl border border-border shadow-2xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground">Abrir Chamado</h3>
              <button
                onClick={() => setCreateOpen(false)}
                className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-all"
              >
                <X size={14} />
              </button>
            </div>

            {createError && (
              <div className="flex items-start gap-2 mb-4 rounded-lg border border-error/40 bg-error/10 px-3 py-2.5 text-xs text-error">
                <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                <span>{createError}</span>
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label
                  htmlFor="ticket-title"
                  className="block text-sm font-medium text-foreground mb-1.5"
                >
                  Assunto *
                </label>
                <input
                  id="ticket-title"
                  required
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="Resumo do problema ou dúvida"
                  className={fieldClass}
                />
              </div>
              <div>
                <label
                  htmlFor="ticket-priority"
                  className="block text-sm font-medium text-foreground mb-1.5"
                >
                  Prioridade
                </label>
                <select
                  id="ticket-priority"
                  value={form.priority}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      priority: e.target.value as typeof f.priority,
                    }))
                  }
                  className={fieldClass}
                >
                  {TICKET_PRIORITIES.map((p) => (
                    <option key={p} value={p}>
                      {TICKET_PRIORITY_LABELS[p].label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  htmlFor="ticket-description"
                  className="block text-sm font-medium text-foreground mb-1.5"
                >
                  Descrição
                </label>
                <textarea
                  id="ticket-description"
                  rows={4}
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Detalhe o máximo possível (opcional)"
                  className={`${fieldClass} resize-y`}
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCreateOpen(false)}
                  disabled={creating}
                  className="px-4 py-2.5 rounded-lg text-sm text-muted-foreground hover:bg-secondary transition-colors disabled:opacity-60"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-60"
                >
                  {creating && <Loader2 size={14} className="animate-spin" />}
                  Enviar chamado
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

