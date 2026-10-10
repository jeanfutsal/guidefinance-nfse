"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, AlertCircle, ArrowLeft } from "lucide-react";

export interface ContactValues {
  id?: string;
  cnpj: string;
  razaoSocial: string;
  nomeFantasia?: string | null;
  email?: string | null;
  phone?: string | null;
  city?: string | null;
  state?: string | null;
  observacao?: string | null;
}

interface ContactFormProps {
  /** Rota da API: "/api/clients" ou "/api/suppliers" */
  apiBase: string;
  /** Rota de volta para a listagem */
  backHref: string;
  /** Título do card (ex.: "Novo Cliente") */
  title: string;
  /** Valores iniciais (edição) — se possuir id, faz PATCH */
  initial?: ContactValues;
}

const fieldClass =
  "glass-input w-full rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground";

export function ContactForm({ apiBase, backHref, title, initial }: ContactFormProps) {
  const router = useRouter();
  const isEdit = Boolean(initial?.id);

  const [values, setValues] = useState<ContactValues>(
    initial ?? { cnpj: "", razaoSocial: "", nomeFantasia: "", email: "", phone: "", city: "", state: "", observacao: "" }
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function set<K extends keyof ContactValues>(key: K, value: string) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);

    try {
      const url = isEdit ? `${apiBase}/${initial!.id}` : apiBase;
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

      router.push(backHref);
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
          <div>
            <label htmlFor="cnpj" className="block text-sm font-medium text-foreground mb-1.5">
              CNPJ / CPF *
            </label>
            <input
              id="cnpj"
              required
              value={values.cnpj}
              onChange={(e) => set("cnpj", e.target.value)}
              placeholder="00.000.000/0000-00"
              className={fieldClass}
            />
          </div>

          <div>
            <label htmlFor="razaoSocial" className="block text-sm font-medium text-foreground mb-1.5">
              Razão Social *
            </label>
            <input
              id="razaoSocial"
              required
              value={values.razaoSocial}
              onChange={(e) => set("razaoSocial", e.target.value)}
              placeholder="Nome razão social"
              className={fieldClass}
            />
          </div>

          <div>
            <label htmlFor="nomeFantasia" className="block text-sm font-medium text-foreground mb-1.5">
              Nome Fantasia
            </label>
            <input
              id="nomeFantasia"
              value={values.nomeFantasia ?? ""}
              onChange={(e) => set("nomeFantasia", e.target.value)}
              placeholder="Nome fantasia (opcional)"
              className={fieldClass}
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1.5">
              E-mail
            </label>
            <input
              id="email"
              type="email"
              value={values.email ?? ""}
              onChange={(e) => set("email", e.target.value)}
              placeholder="contato@empresa.com"
              className={fieldClass}
            />
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-foreground mb-1.5">
              Telefone
            </label>
            <input
              id="phone"
              value={values.phone ?? ""}
              onChange={(e) => set("phone", e.target.value)}
              placeholder="(00) 00000-0000"
              className={fieldClass}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label htmlFor="city" className="block text-sm font-medium text-foreground mb-1.5">
                Cidade
              </label>
              <input
                id="city"
                value={values.city ?? ""}
                onChange={(e) => set("city", e.target.value)}
                placeholder="Cidade"
                className={fieldClass}
              />
            </div>
            <div>
              <label htmlFor="state" className="block text-sm font-medium text-foreground mb-1.5">
                UF
              </label>
              <input
                id="state"
                maxLength={2}
                value={values.state ?? ""}
                onChange={(e) => set("state", e.target.value.toUpperCase())}
                placeholder="UF"
                className={fieldClass}
              />
            </div>
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="observacao" className="block text-sm font-medium text-foreground mb-1.5">
              Observação
            </label>
            <textarea
              id="observacao"
              rows={3}
              value={values.observacao ?? ""}
              onChange={(e) => set("observacao", e.target.value)}
              placeholder="Anotações sobre o cadastro (opcional)"
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
              {isEdit ? "Salvar alterações" : "Cadastrar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
