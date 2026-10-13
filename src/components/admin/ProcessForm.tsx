"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, AlertCircle, ArrowLeft } from "lucide-react";
import { Process, PROCESS_STATUSES, PROCESS_STATUS_LABELS } from "@/entities/Process";

interface NamedItem {
  id: string;
  razaoSocial: string;
}

export interface ProcessValues {
  id?: string;
  title: string;
  description?: string | null;
  status: string;
  clientId?: string | null;
  supplierId?: string | null;
}

interface ProcessFormProps {
  backHref: string;
  title: string;
  initial?: Process;
}

const fieldClass =
  "glass-input w-full rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground";

export function ProcessForm({ backHref, title, initial }: ProcessFormProps) {
  const router = useRouter();
  const isEdit = Boolean(initial?.id);

  const [values, setValues] = useState<ProcessValues>({
    title: initial?.title ?? "",
    description: initial?.description ?? "",
    status: initial?.status ?? "aberto",
    clientId: initial?.clientId ?? null,
    supplierId: initial?.supplierId ?? null,
  });
  const [clients, setClients] = useState<NamedItem[]>([]);
  const [suppliers, setSuppliers] = useState<NamedItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    async function load() {
      const [c, s] = await Promise.all([
        fetch("/api/clients").then((r) => (r.ok ? r.json() : [])),
        fetch("/api/suppliers").then((r) => (r.ok ? r.json() : [])),
      ]);
      if (Array.isArray(c)) setClients(c);
      if (Array.isArray(s)) setSuppliers(s);
    }
    load();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const url = isEdit ? `/api/processes/${initial!.id}` : "/api/processes";
      const res = await fetch(url, {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? "Erro ao salvar. Verifique os dados.");
        return;
      }
      const saved: Process = await res.json();
      // Na criação, leva direto para a timeline do novo processo
      router.push(isEdit ? backHref : `/admin/processos/${saved.id}`);
      router.refresh();
    } catch {
      setError("Erro inesperado. Tente novamente.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <Link
        href={backHref}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
      >
        <ArrowLeft size={14} />
        Voltar
      </Link>

      <div className="glass-card rounded-xl border border-border p-6">
        <h2 className="font-semibold text-foreground">{title}</h2>

        {error && (
          <div className="flex items-start gap-2 mt-4 rounded-lg border border-error/40 bg-error/10 px-3 py-2.5 text-sm text-error">
            <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label htmlFor="process-title" className="block text-sm font-medium text-foreground mb-1.5">
              Título *
            </label>
            <input
              id="process-title"
              required
              value={values.title}
              onChange={(e) => setValues((v) => ({ ...v, title: e.target.value }))}
              placeholder="Ex.: Regularização de NFS-e - Cliente X"
              className={fieldClass}
            />
          </div>

          <div>
            <label htmlFor="process-status" className="block text-sm font-medium text-foreground mb-1.5">
              Status
            </label>
            <select
              id="process-status"
              value={values.status}
              onChange={(e) => setValues((v) => ({ ...v, status: e.target.value }))}
              className={fieldClass}
            >
              {PROCESS_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {PROCESS_STATUS_LABELS[s].label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="process-client" className="block text-sm font-medium text-foreground mb-1.5">
              Cliente (opcional)
            </label>
            <select
              id="process-client"
              value={values.clientId ?? ""}
              onChange={(e) => setValues((v) => ({ ...v, clientId: e.target.value || null }))}
              className={fieldClass}
            >
              <option value="">— Sem cliente —</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.razaoSocial}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="process-supplier" className="block text-sm font-medium text-foreground mb-1.5">
              Fornecedor (opcional)
            </label>
            <select
              id="process-supplier"
              value={values.supplierId ?? ""}
              onChange={(e) => setValues((v) => ({ ...v, supplierId: e.target.value || null }))}
              className={fieldClass}
            >
              <option value="">— Sem fornecedor —</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.razaoSocial}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="process-description" className="block text-sm font-medium text-foreground mb-1.5">
              Descrição
            </label>
            <textarea
              id="process-description"
              rows={3}
              value={values.description ?? ""}
              onChange={(e) => setValues((v) => ({ ...v, description: e.target.value }))}
              placeholder="Detalhes sobre o processo (opcional)"
              className={`${fieldClass} resize-y`}
            />
          </div>

          <div className="sm:col-span-2 flex justify-end gap-3 pt-2">
            <Link
              href={backHref}
              className="px-4 py-2.5 rounded-lg text-sm text-muted-foreground hover:bg-secondary transition-colors"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={pending}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-60"
            >
              {pending && <Loader2 size={14} className="animate-spin" />}
              {isEdit ? "Salvar alterações" : "Criar processo"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

