"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Zap, Loader2, AlertCircle, UserPlus } from "lucide-react";
import { authClient } from "@/lib/auth-client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  // Se já estiver autenticado, redireciona para o dashboard (evita ver login)
  useEffect(() => {
    authClient.getSession().then((res) => {
      if (res?.data?.session) {
        router.push("/");
      }
    });
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);

    try {
      const result = await authClient.signIn.email({ email, password });

      if (result.error) {
        setError(
          result.error.message ??
            "Falha na autenticação. Verifique os dados e tente novamente."
        );
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setError("Erro inesperado. Tente novamente.");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center shadow-lg">
            <Zap size={24} className="text-white" />
          </div>
          <div className="text-center">
            <h1 className="text-xl font-bold text-foreground">GuideFinance</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Gestor de NFS-e — Padrão Nacional
            </p>
          </div>
        </div>

        {/* Card */}
        <div className="glass-panel rounded-2xl p-6 sm:p-8">
          <h2 className="text-lg font-semibold text-foreground">Entrar</h2>
          <p className="text-sm text-muted-foreground mt-1 mb-6">
            Acesse o dashboard com seu e-mail e senha.
          </p>

          {error && (
            <div className="flex items-start gap-2 mb-4 rounded-lg border border-error/40 bg-error/10 px-3 py-2.5 text-sm text-error">
              <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-foreground mb-1.5"
              >
                E-mail
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="voce@exemplo.com"
                className="glass-input w-full rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-foreground mb-1.5"
              >
                Senha
              </label>
              <input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Sua senha"
                className="glass-input w-full rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground"
              />
            </div>

            <button
              type="submit"
              disabled={pending}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {pending && <Loader2 size={16} className="animate-spin" />}
              Entrar
            </button>
          </form>

          {/* Cadastro público desativado (Fase 2.1) */}
          <div className="mt-6 flex items-start gap-2 text-xs text-muted-foreground border-t border-border pt-4">
            <UserPlus size={14} className="flex-shrink-0 mt-0.5" />
            <span>
              A criação de contas é feita pelo administrador. Se você ainda não
              tem acesso, solicite seu cadastro.
            </span>
          </div>
        </div>
      </div>
    </main>
  );
}
