"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Ticket,
  Loader2,
  AlertCircle,
  Trash2,
  MessageSquare,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  Ticket as TicketType,
  TicketStatus,
  TICKET_STATUSES,
  TICKET_STATUS_LABELS,
  TICKET_PRIORITY_LABELS,
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

export function TicketsAdmin() {
  const router = useRouter();
  const [tickets, setTickets] = useState<TicketType[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [responseDraft, setResponseDraft] = useState("");
  const [removeTarget, setRemoveTarget] = useState<TicketType | null>(null);
  const [removing, setRemoving] = useState(false);
  const [removeError, setRemoveError] = useState<string | null>(null);

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
      setTickets(await res.json());
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

  async function patchTicket(id: string, body: Record<string, unknown>) {
    setBusyId(id);
    setError(null);
    try {
      const res = await fetch(`/api/tickets/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Erro ao atualizar ticket.");
        return;
      }
      const updated: TicketType = await res.json();
      setTickets((prev) => prev.map((t) => (t.id === id ? updated : t)));
    } catch {
      setError("Erro inesperado. Tente novamente.");
    } finally {
      setBusyId(null);
    }
  }

  function handleStatusChange(t: TicketType, status: TicketStatus) {
    patchTicket(t.id, { status });
  }

  function handleRespond(t: TicketType) {
    if (!responseDraft.trim()) return;
    patchTicket(t.id, {
      response: responseDraft,
      status: t.status === "aberto" || t.status === "em_andamento" ? "respondido" : t.status,
    }).then(() => setResponseDraft(""));
  }

  async function handleRemove() {
    if (!removeTarget) return;
    setRemoveError(null);
    setRemoving(true);
    try {
      const res = await fetch(`/api/tickets/${removeTarget.id}`, { method: "DELETE" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setRemoveError(body.error ?? "Erro ao remover ticket.");
        return;
      }
      setRemoveTarget(null);
      router.refresh();
      fetchTickets();
    } catch {
      setRemoveError("Erro inesperado. Tente novamente.");
    } finally {
      setRemoving(false);
    }
  }

  function toggleExpand(t: TicketType) {
    if (expandedId === t.id) {
      setExpandedId(null);
    } else {
      setExpandedId(t.id);
      setResponseDraft(t.response ?? "");
    }
  }

  const filtered = tickets.filter(
    (t) =>
      !search ||
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      (t.userEmail ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (t.userName ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="relative max-w-sm">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          size={16}
        />
        <input
          type="text"
          placeholder="Buscar por assunto, nome ou e-mail..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={`${fieldClass} pl-9 pr-4`}
        />
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
              {search ? "Nenhum ticket encontrado." : "Nenhum chamado aberto."}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-border/50">
            {filtered.map((t) => {
              const priority =
                TICKET_PRIORITY_LABELS[t.priority] ?? TICKET_PRIORITY_LABELS.media;
              const expanded = expandedId === t.id;
              return (
                <li key={t.id}>
                  <div className="flex items-center gap-3 px-4 py-3 hover:bg-secondary/20 transition-colors">
                    <button
                      onClick={() => toggleExpand(t)}
                      className="flex-1 min-w-0 flex items-center gap-3 text-left"
                    >
                      <Ticket size={16} className="text-muted-foreground flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{t.title}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {t.userName || "—"} · {t.userEmail || "—"} · {formatDate(t.createdAt)}
                          {t.processTitle ? ` · Processo: ${t.processTitle}` : ""}
                        </p>
                      </div>
                      <span
                        className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full flex-shrink-0 ${priority.color}`}
                      >
                        {priority.label}
                      </span>
                    </button>

                    <select
                      value={t.status}
                      onChange={(e) => handleStatusChange(t, e.target.value as TicketStatus)}
                      disabled={busyId === t.id}
                      className={`${fieldClass} !w-auto !py-1.5 text-xs`}
                      title="Alterar status"
                    >
                      {TICKET_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {TICKET_STATUS_LABELS[s].label}
                        </option>
                      ))}
                    </select>

                    <button
                      onClick={() => {
                        setRemoveError(null);
                        setRemoveTarget(t);
                      }}
                      className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-rose-500/10 text-muted-foreground hover:text-rose-400 transition-all flex-shrink-0"
                      title="Excluir ticket"
                    >
                      <Trash2 size={14} />
                    </button>

                    <button
                      onClick={() => toggleExpand(t)}
                      className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-all flex-shrink-0"
                      title={expanded ? "Recolher" : "Detalhes / responder"}
                    >
                      {expanded ? (
                        <ChevronUp size={14} />
                      ) : (
                        <ChevronDown size={14} />
                      )}
                    </button>
                  </div>


                  {expanded && (
                    <div className="px-4 pb-4 pl-12 space-y-3">
                      {t.description && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-1">
                            Descrição do solicitante
                          </p>
                          <p className="text-sm text-foreground whitespace-pre-wrap">
                            {t.description}
                          </p>
                        </div>
                      )}

                      <div>
                        <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-1.5">
                          <MessageSquare size={12} />
                          Responder
                          {t.respondedAt && (
                            <span className="font-normal">
                              · última resposta em {formatDate(t.respondedAt)}
                            </span>
                          )}
                        </p>
                        <textarea
                          rows={3}
                          value={responseDraft}
                          onChange={(e) => setResponseDraft(e.target.value)}
                          placeholder="Escreva a resposta para o solicitante..."
                          className={`${fieldClass} resize-y`}
                        />
                        <div className="flex justify-end mt-2">
                          <button
                            onClick={() => handleRespond(t)}
                            disabled={busyId === t.id || !responseDraft.trim()}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-60"
                          >
                            {busyId === t.id && (
                              <Loader2 size={14} className="animate-spin" />
                            )}
                            Enviar resposta
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Modal: remover ticket */}
      {removeTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => !removing && setRemoveTarget(null)}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div
            className="relative z-10 w-full max-w-sm glass-panel rounded-2xl border border-border shadow-2xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-semibold text-foreground">Remover ticket?</h3>
            <p className="text-sm text-muted-foreground mt-2">
              O chamado <span className="text-foreground font-medium">&ldquo;{removeTarget.title}&rdquo;</span>{" "}
              será removido permanentemente.
            </p>

            {removeError && (
              <div className="flex items-start gap-2 mt-3 rounded-lg border border-error/40 bg-error/10 px-3 py-2 text-xs text-error">
                <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                <span>{removeError}</span>
              </div>
            )}

            <div className="flex justify-end gap-2 mt-5">
              <button
                onClick={() => setRemoveTarget(null)}
                disabled={removing}
                className="px-4 py-2 rounded-lg text-sm text-muted-foreground hover:bg-secondary transition-colors disabled:opacity-60"
              >
                Cancelar
              </button>
              <button
                onClick={handleRemove}
                disabled={removing}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-rose-500 text-white text-sm font-medium hover:bg-rose-600 transition-colors disabled:opacity-60"
              >
                {removing && <Loader2 size={14} className="animate-spin" />}
                Remover
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

