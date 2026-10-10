import Link from "next/link";
import { ShieldAlert, ArrowLeft } from "lucide-react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";

export const metadata = {
  title: "403 — Acesso restrito | GuideFinance",
};

export default async function ForbiddenPage() {
  // Sem sessão, o login é o destino correto
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-error/10 border border-error/30 flex items-center justify-center mb-6">
          <ShieldAlert size={32} className="text-error" />
        </div>
        <h1 className="text-6xl font-bold text-foreground tracking-tight">403</h1>
        <p className="mt-3 text-lg font-semibold text-foreground">
          Acesso restrito
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Esta área é exclusiva para administradores. Se você acredita que isso
          é um erro, entre em contato com o responsável pelo sistema.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
        >
          <ArrowLeft size={14} />
          Voltar ao dashboard
        </Link>
      </div>
    </main>
  );
}
