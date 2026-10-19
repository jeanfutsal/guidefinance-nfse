"use client";

import { Invoice } from "@/core/entities/Invoice";
import { X } from "lucide-react";

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

interface InvoiceDetailModalProps {
  invoice: Invoice;
  onClose: () => void;
}

/**
 * Modal com todos os dados de uma NFS-e.
 * Extraído de /notas para reuso (ex.: explorer de clientes admin).
 */
export function InvoiceDetailModal({ invoice, onClose }: InvoiceDetailModalProps) {
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
          <button
            onClick={onClose}
            title="Fechar"
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-all"
          >
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
          ].reduce((rows: { label: string; value: string }[][], field, i) => {
            if (i % 2 === 0) rows.push([field]);
            else rows[rows.length - 1].push(field);
            return rows;
          }, []).map((row, ri) => (
            <div key={ri} className="grid grid-cols-2 gap-3">
              {row.map((field) => (
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