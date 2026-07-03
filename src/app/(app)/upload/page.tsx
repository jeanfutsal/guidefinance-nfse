import { Header } from "@/components/ui/Header";
import { UploadZone } from "@/components/invoice/UploadZone";
import { FileText, Info } from "lucide-react";

export default function UploadPage() {
  return (
    <div>
      <Header
        title="Upload de NFS-e"
        subtitle="Importe PDFs de Notas Fiscais de Serviço para extração automática"
      />

      <div className="p-6 max-w-3xl mx-auto space-y-6">
        {/* Info card */}
        <div className="glass-card rounded-xl p-4 border border-cyan-500/20 flex items-start gap-3">
          <Info size={16} className="text-cyan-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-muted-foreground space-y-1">
            <p className="font-medium text-foreground">Formatos suportados</p>
            <p>
              A extração é otimizada para o padrão <strong className="text-foreground">DANFSe v1.0</strong> (NFS-e Nacional) emitidas por municípios adotantes do padrão nacional.
              Dados extraídos automaticamente: Chave de Acesso, Emitente, Tomador, Valor do Serviço, Impostos (ISSQN, IRRF) e descrição do serviço.
            </p>
          </div>
        </div>

        {/* Upload area */}
        <UploadZone />

        {/* Format card */}
        <div className="glass-card rounded-xl p-5 border border-border">
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <FileText size={14} className="text-primary" />
            O que é extraído automaticamente?
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs text-muted-foreground">
            {[
              "Chave de Acesso (50 dígitos)",
              "Número da NFS-e",
              "Data de Emissão",
              "CNPJ do Emitente",
              "Razão Social do Emitente",
              "CNPJ do Tomador",
              "Razão Social do Tomador",
              "Descrição do Serviço",
              "Código de Tributação",
              "Valor Bruto do Serviço",
              "Valor Líquido",
              "Alíquota e Valor ISSQN",
              "Retenções Federais",
              "Município/UF do Emitente",
              "Município/UF do Tomador",
            ].map((field) => (
              <div key={field} className="flex items-center gap-1.5">
                <div className="w-1 h-1 rounded-full bg-primary flex-shrink-0" />
                {field}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
