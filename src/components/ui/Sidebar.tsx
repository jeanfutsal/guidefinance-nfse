"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Upload,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Zap,
  X,
  Shield,
  Users,
  LifeBuoy,
  DatabaseZap,
} from "lucide-react";
import { useSidebar } from "./SidebarContext";
import { authClient } from "@/lib/auth-client";



// Item exibido apenas para usuários com papel admin
const adminNavItem = { href: "/admin", icon: Shield, label: "Administração" };
const usersNavItem = { href: "/admin/usuarios", icon: Users, label: "Usuários" };
const auditoriaNavItem = {
  href: "/admin/auditoria",
  icon: DatabaseZap,
  label: "Auditoria",
};

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const { isMobileOpen, closeSidebar } = useSidebar();
  const { data: session } = authClient.useSession();
  const isAdmin = (session?.user as { role?: string } | undefined)?.role === "admin";

  // Upload e Administração são exclusivos de admin (item 13)
  const items = [
    { href: "/", icon: LayoutDashboard, label: "Dashboard" },
    ...(isAdmin ? [{ href: "/upload", icon: Upload, label: "Upload NFS-e" }] : []),
    { href: "/notas", icon: FileText, label: "Notas Fiscais" },
    // Tickets exige sessão (protegido no proxy) — esconde para o visitante anônimo
    ...(session ? [{ href: "/tickets", icon: LifeBuoy, label: "Tickets" }] : []),
    { href: "/relatorios", icon: BarChart3, label: "Relatórios" },
    ...(isAdmin ? [adminNavItem, usersNavItem, auditoriaNavItem] : []),
  ];

  return (
    <>
      {/* Backdrop for mobile view */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300"
          onClick={closeSidebar}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r border-border bg-card transition-all duration-300 ease-in-out md:relative md:translate-x-0
          ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
          ${collapsed ? "md:w-16" : "md:w-60"} w-60`}
        style={{ minHeight: "100vh" }}
      >
        {/* Logo and Mobile Close Header */}
        <div className="flex items-center justify-between px-4 py-5 border-b border-border overflow-hidden">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center shadow-lg">
              <Zap size={16} className="text-white" />
            </div>
            {(!collapsed || isMobileOpen) && (
              <div className="flex flex-col min-w-0">
                <span className="font-bold text-sm text-foreground truncate">GuideFinance</span>
                <span className="text-xs text-muted-foreground truncate">Gestor NFS-e</span>
              </div>
            )}
          </div>

          {/* Close button for mobile menu */}
          <button
            onClick={closeSidebar}
            className="md:hidden p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-all"
            title="Fechar menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-2 py-4 space-y-1">
          {items.map(({ href, icon: Icon, label }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                onClick={closeSidebar}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group
                  ${isActive
                    ? "bg-primary/10 text-primary border border-primary/20"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  }
                  ${collapsed ? "md:justify-center" : ""}`}
                title={collapsed ? label : undefined}
              >
                <Icon
                  size={18}
                  className={`flex-shrink-0 transition-colors ${isActive ? "text-primary" : "group-hover:text-foreground"}`}
                />
                {(!collapsed || isMobileOpen) && (
                  <span className="text-sm font-medium truncate">{label}</span>
                )}
                {isActive && (!collapsed || isMobileOpen) && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Collapse toggle (hidden on mobile) */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-6 w-6 h-6 rounded-full bg-card border border-border hidden md:flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-all z-10 shadow-sm"
        >
          {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>

        {/* Footer */}
        {(!collapsed || isMobileOpen) && (
          <div className="px-4 py-3 border-t border-border">
            <p className="text-xs text-muted-foreground">v1.0.0 · NFS-e Padrão Nacional</p>
          </div>
        )}
      </aside>
    </>
  );
}
