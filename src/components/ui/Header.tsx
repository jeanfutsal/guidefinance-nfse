"use client";

import { Sun, Moon, Menu, LogOut, Shield, User, ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSidebar } from "./SidebarContext";
import { GlobalSearch } from "./GlobalSearch";
import { NotificationsBell } from "./NotificationsBell";
import { authClient } from "@/lib/auth-client";

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  const [dark, setDark] = useState(true);
  const { toggleSidebar } = useSidebar();
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const [signingOut, setSigningOut] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const role = (session?.user as { role?: string } | undefined)?.role ?? "user";
  const isAdmin = role === "admin";

  // Fecha o dropdown ao clicar fora
  useEffect(() => {
    if (!menuOpen) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

  // Sincroniza com o tema aplicado antes da hidratação pelo script do layout
  useEffect(() => {
    const t = setTimeout(
      () => setDark(document.documentElement.classList.contains("dark")),
      0
    );
    return () => clearTimeout(t);
  }, []);

  function toggleTheme() {
    const html = document.documentElement;
    const isDark = !html.classList.contains("dark");
    html.classList.toggle("dark", isDark);
    html.style.colorScheme = isDark ? "dark" : "light";
    try {
      localStorage.setItem("gf-theme", isDark ? "dark" : "light");
    } catch {
      // localStorage indisponível — tema vale só para a sessão
    }
    setDark(isDark);
  }

  async function handleSignOut() {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await authClient.signOut({
        fetchOptions: {
          onSuccess: () => {
            setMenuOpen(false);
            router.push("/login");
            router.refresh();
          },
        },
      });
    } finally {
      setSigningOut(false);
    }
  }

  const initials = (session?.user?.name || session?.user?.email || "GF")
    .split(/[\s@]/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-border bg-card/60 backdrop-blur-sm sticky top-0 z-10">
      {/* Title & Hamburger button */}
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          className="md:hidden p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-all"
          title="Alternar menu"
        >
          <Menu size={20} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-foreground">{title}</h1>
          {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {/* Busca global (apenas autenticado) */}
        {session && <GlobalSearch isAdmin={isAdmin} />}

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-all"
          title="Alternar tema"
        >
          {dark ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        {/* Notifications (apenas autenticado) */}
        {session && <NotificationsBell />}

        {/* Avatar + dropdown (logado) ou CTA "Entrar" (anônimo) */}
        {session ? (
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-1 pl-0.5 pr-1.5 py-0.5 rounded-full hover:bg-secondary transition-all"
            title={session?.user?.email}
          >
            <span className="relative w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center text-xs font-bold text-white shadow">
              {initials || "GF"}
              {isAdmin && (
                <span
                  className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-amber-400 rounded-full border-2 border-card"
                  title="Administrador"
                />
              )}
            </span>
            <ChevronDown size={14} className="text-muted-foreground" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-2 w-56 glass-panel rounded-xl py-1.5 shadow-xl z-50">
              <div className="px-4 py-2.5 border-b border-border">
                <p className="text-sm font-medium text-foreground truncate">
                  {session?.user?.name || "Usuário"}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {session?.user?.email}
                </p>
                <span
                  className={`inline-block mt-1.5 text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full
                    ${isAdmin ? "bg-amber-500/15 text-amber-400" : "bg-secondary text-muted-foreground"}`}
                >
                  {isAdmin ? "Administrador" : "Usuário"}
                </span>
              </div>

              <div className="py-1">
                <button
                  onClick={() => {
                    setMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                >
                  <User size={14} />
                  Meu perfil
                </button>

                {isAdmin && (
                  <Link
                    href="/admin"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-sm text-primary hover:bg-primary/10 transition-colors font-medium"
                  >
                    <Shield size={14} />
                    Administração
                  </Link>
                )}
              </div>

              <div className="border-t border-border pt-1">
                <button
                  onClick={handleSignOut}
                  disabled={signingOut}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-error hover:bg-error/10 transition-colors disabled:opacity-60"
                >
                  <LogOut size={14} />
                  {signingOut ? "Saindo…" : "Sair"}
                </button>
              </div>
            </div>
          )}
        </div>
        ) : (
          <Link
            href="/login"
            className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
          >
            Entrar
          </Link>
        )}
      </div>
    </header>
  );
}