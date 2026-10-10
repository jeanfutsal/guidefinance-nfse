"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Edit, Trash2, Loader2, AlertCircle } from "lucide-react";

interface RowActionsProps {
  editHref: string;
  deleteUrl: string;
  /** Nome do registro para a mensagem de confirmação */
  label: string;
}

/**
 * Botões de Editar/Excluir de linha em listagens admin.
 * Exclusão abre modal de confirmação e chama a API DELETE.
 */
export function RowActions({ editHref, deleteUrl, label }: RowActionsProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(deleteUrl, { method: "DELETE" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? "Erro ao excluir.");
        return;
      }
      setOpen(false);
      router.refresh();
    } catch {
      setError("Erro inesperado. Tente novamente.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <div className="flex items-center justify-end gap-1">
        <Link
          href={editHref}
          className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-all"
          title="Editar"
        >
          <Edit size={14} />
        </Link>
        <button
          onClick={() => {
            setError(null);
            setOpen(true);
          }}
          className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-rose-500/10 text-muted-foreground hover:text-rose-400 transition-all"
          title="Excluir"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => !deleting && setOpen(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div
            className="relative z-10 w-full max-w-sm glass-panel rounded-2xl border border-border shadow-2xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-semibold text-foreground">Excluir registro?</h3>
            <p className="text-sm text-muted-foreground mt-2">
              Tem certeza que deseja excluir <span className="text-foreground font-medium">{label}</span>?
              Esta ação não pode ser desfeita.
            </p>

            {error && (
              <div className="flex items-start gap-2 mt-3 rounded-lg border border-error/40 bg-error/10 px-3 py-2 text-xs text-error">
                <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex justify-end gap-2 mt-5">
              <button
                onClick={() => setOpen(false)}
                disabled={deleting}
                className="px-4 py-2 rounded-lg text-sm text-muted-foreground hover:bg-secondary transition-colors disabled:opacity-60"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-rose-500 text-white text-sm font-medium hover:bg-rose-600 transition-colors disabled:opacity-60"
              >
                {deleting && <Loader2 size={14} className="animate-spin" />}
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
