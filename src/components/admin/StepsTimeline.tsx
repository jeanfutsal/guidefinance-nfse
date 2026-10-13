"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, AlertCircle, Plus, Pencil, Trash2, CalendarDays } from "lucide-react";
import { ProcessStep, STEP_COLORS } from "@/entities/ProcessStep";

interface StepsTimelineProps {
  processId: string;
  initialSteps?: ProcessStep[];
  /** Timeline somente leitura (usuário comum) */
  readOnly?: boolean;
}

const fieldClass =
  "glass-input w-full rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground";

function formatDate(iso: string) {
  try {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(new Date(iso));
  } catch {
    return "—";
  }
}

function toInputDate(iso: string) {
  try {
    return new Date(iso).toISOString().slice(0, 10);
  } catch {
    return "";
  }
}

export function StepsTimeline({ processId, initialSteps, readOnly }: StepsTimelineProps) {
  const router = useRouter();
  const [steps, setSteps] = useState<ProcessStep[]>(initialSteps ?? []);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<{
    title: string;
    description: string;
    color: string;
    date: string;
  }>({ title: "", description: "", color: STEP_COLORS[0], date: "" });
  const [pending, setPending] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function resetForm() {
    setForm({ title: "", description: "", color: STEP_COLORS[0], date: "" });
    setEditingId(null);
  }

  function startEdit(step: ProcessStep) {
    setEditingId(step.id);
    setForm({
      title: step.title,
      description: step.description ?? "",
      color: step.color,
      date: toInputDate(step.date),
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title || !form.date) return;
    setError(null);
    setPending(true);
    try {
      const url = editingId ? `/api/steps/${editingId}` : "/api/steps";
      const res = await fetch(url, {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          editingId
            ? { processId, ...form, description: form.description || null }
            : { processId, ...form, description: form.description || null }
        ),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? "Erro ao salvar etapa.");
        return;
      }
      const saved: ProcessStep = await res.json();
      setSteps((prev) => {
        const next = editingId
          ? prev.map((s) => (s.id === editingId ? saved : s))
          : [...prev, saved];
        return next.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      });
      resetForm();
      router.refresh();
    } catch {
      setError("Erro inesperado. Tente novamente.");
    } finally {
      setPending(false);
    }
  }

  async function handleDelete(id: string) {
    setError(null);
    setDeletingId(id);
    try {
      const res = await fetch(`/api/steps/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? "Erro ao excluir etapa.");
        return;
      }
      setSteps((prev) => prev.filter((s) => s.id !== id));
      if (editingId === id) resetForm();
      router.refresh();
    } catch {
      setError("Erro inesperado. Tente novamente.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-5">
      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-error/40 bg-error/10 px-3 py-2.5 text-sm text-error">
          <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Lista da timeline */}
      {steps.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {readOnly ? "Nenhuma etapa registrada." : "Nenhuma etapa ainda. Adicione a primeira."}
        </p>
      ) : (
        <div>
          {steps.map((step, i) => (
            <div key={step.id} className="group relative flex gap-3.5">
              {/* Coluna do bullet + conector */}
              <div className="flex flex-col items-center">
                <span
                  className="mt-1.5 w-3.5 h-3.5 rounded-full flex-shrink-0 border-2 border-background shadow"
                  style={{ backgroundColor: step.color }}
                />
                {i < steps.length - 1 && <span className="w-px flex-1 bg-border my-1" />}
              </div>

              {/* Conteúdo */}
              <div className={`flex-1 min-w-0 ${i < steps.length - 1 ? "pb-5" : ""}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">{step.title}</p>
                    <p className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                      <CalendarDays size={12} />
                      {formatDate(step.date)}
                    </p>
                  </div>
                  {!readOnly && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                      <button
                        onClick={() => startEdit(step)}
                        className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-all"
                        title="Editar etapa"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => handleDelete(step.id)}
                        disabled={deletingId === step.id}
                        className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-rose-500/10 text-muted-foreground hover:text-rose-400 transition-all disabled:opacity-40"
                        title="Excluir etapa"
                      >
                        {deletingId === step.id ? (
                          <Loader2 size={13} className="animate-spin" />
                        ) : (
                          <Trash2 size={13} />
                        )}
                      </button>
                    </div>
                  )}
                </div>
                {step.description && (
                  <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">
                    {step.description}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}


      {/* Formulário de adição/edição */}
      {!readOnly && (
        <form onSubmit={handleSubmit} className="border-t border-border pt-4 space-y-3">
          <p className="text-sm font-medium text-foreground">
            {editingId ? "Editar etapa" : "Nova etapa"}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3">
            <input
              required
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Título da etapa (ex.: Documento protocolado)"
              className={fieldClass}
            />
            <input
              required
              type="date"
              value={form.date}
              onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
              className={`${fieldClass} sm:w-44`}
            />
          </div>
          <textarea
            rows={2}
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="Descrição (opcional)"
            className={`${fieldClass} resize-y`}
          />
          <div className="flex flex-wrap items-center gap-2">
            {STEP_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setForm((f) => ({ ...f, color: c }))}
                className={`w-6 h-6 rounded-full transition-all ${
                  form.color === c
                    ? "ring-2 ring-foreground ring-offset-2 ring-offset-background"
                    : ""
                }`}
                style={{ backgroundColor: c }}
                title={`Cor ${c}`}
              />
            ))}
            <input
              type="color"
              value={form.color}
              onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
              className="w-6 h-6 cursor-pointer rounded-full border-0 bg-transparent p-0"
              title="Cor personalizada"
            />
          </div>
          <div className="flex justify-end gap-2">
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 rounded-lg text-sm text-muted-foreground hover:bg-secondary transition-colors"
              >
                Cancelar
              </button>
            )}
            <button
              type="submit"
              disabled={pending}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-60"
            >
              {pending ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              {editingId ? "Salvar etapa" : "Adicionar etapa"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

