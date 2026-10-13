"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  FileText,
  Users,
  Building2,
  Workflow,
  LifeBuoy,
  CornerDownLeft,
} from "lucide-react";

interface ResultItem {
  title: string;
  subtitle?: string;
  href: string;
}

interface ResultGroup {
  label: string;
  icon: React.ComponentType<{ size?: number | string; className?: string }>;
  items: ResultItem[];
}

interface GlobalSearchProps {
  isAdmin: boolean;
}

const MAX_PER_GROUP = 4;

export function GlobalSearch({ isAdmin }: GlobalSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [groups, setGroups] = useState<ResultGroup[]>([]);
  const [open, setOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  // Fecha ao clicar fora
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Busca com debounce nas APIs existente (paralelo e tolerante a falhas)
  useEffect(() => {
    const q = query.trim();
    const timeout = setTimeout(async () => {
      if (q.length < 2) {
        setGroups([]);
        setSearching(false);
        return;
      }
      setSearching(true);
      const requests: Promise<{ group: ResultGroup | null }>[] = [];

      // Notas (todos)
      requests.push(
        fetch(`/api/invoices?searchValue=${encodeURIComponent(q)}`)
          .then((r) => (r.ok ? r.json() : []))
          .then((data: Array<{ number: string; tomadorName: string; id: string }>) => ({
            group: {
              label: "Notas Fiscais",
              icon: FileText,
              items: data.slice(0, MAX_PER_GROUP).map((n) => ({
                title: `${n.number} — ${n.tomadorName}`,
                href: `/notas?q=${encodeURIComponent(q)}`,
              })),
            } as ResultGroup,
          }))
          .catch(() => ({ group: null }))
      );

      // Tickets (admin vê todos na lista admin; comum, os seus)
      requests.push(
        fetch(`/api/tickets?search=${encodeURIComponent(q)}`)
          .then((r) => (r.ok ? r.json() : []))
          .then((data: Array<{ title: string; status: string; id: string }>) => ({
            group: {
              label: "Tickets",
              icon: LifeBuoy,
              items: data.slice(0, MAX_PER_GROUP).map((t) => ({
                title: t.title,
                subtitle: t.status.replace("_", " "),
                href: isAdmin ? "/admin/tickets" : "/tickets",
              })),
            } as ResultGroup,
          }))
          .catch(() => ({ group: null }))
      );

      if (isAdmin) {
        // Clientes
        requests.push(
          fetch(`/api/clients?search=${encodeURIComponent(q)}`)
            .then((r) => (r.ok ? r.json() : []))
            .then((data: Array<{ id: string; razaoSocial: string; cnpj: string }>) => ({
              group: {
                label: "Clientes",
                icon: Users,
                items: data.slice(0, MAX_PER_GROUP).map((c) => ({
                  title: c.razaoSocial,
                  subtitle: c.cnpj,
                  href: `/admin/clients/${c.id}`,
                })),
              } as ResultGroup,
            }))
            .catch(() => ({ group: null }))
        );
        // Fornecedores
        requests.push(
          fetch(`/api/suppliers?search=${encodeURIComponent(q)}`)
            .then((r) => (r.ok ? r.json() : []))
            .then((data: Array<{ id: string; razaoSocial: string; cnpj: string }>) => ({
              group: {
                label: "Fornecedores",
                icon: Building2,
                items: data.slice(0, MAX_PER_GROUP).map((s) => ({
                  title: s.razaoSocial,
                  subtitle: s.cnpj,
                  href: `/admin/fornecedores/${s.id}`,
                })),
              } as ResultGroup,
            }))
            .catch(() => ({ group: null }))
        );
        // Processos
        requests.push(
          fetch(`/api/processes?search=${encodeURIComponent(q)}`)
            .then((r) => (r.ok ? r.json() : []))
            .then((data: Array<{ id: string; title: string }>) => ({
              group: {
                label: "Processos",
                icon: Workflow,
                items: data.slice(0, MAX_PER_GROUP).map((p) => ({
                  title: p.title,
                  href: `/admin/processos/${p.id}`,
                })),
              } as ResultGroup,
            }))
            .catch(() => ({ group: null }))
        );
      }

      const results = await Promise.all(requests);
      const next = results
        .map((r) => r.group)
        .filter((g): g is ResultGroup => g !== null && g.items.length > 0);
      setGroups(next);
      setSearching(false);
      setOpen(true);
    }, 300);
    return () => clearTimeout(timeout);
  }, [query, isAdmin]);

  function go(href: string) {
    setOpen(false);
    setQuery("");
    router.push(href);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      setOpen(false);
    }
    if (e.key === "Enter") {
      const first = groups[0]?.items[0];
      if (first) go(first.href);
      else if (query.trim()) {
        go(`/notas?q=${encodeURIComponent(query.trim())}`);
      }
    }
  }

  const showDropdown = open && (searching || groups.length > 0 || query.trim().length >= 2);

  return (
    <div ref={rootRef} className="relative hidden sm:block">
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg glass-input text-sm w-56 focus-within:ring-2 focus-within:ring-ring transition-all">
        <Search size={14} className="text-muted-foreground flex-shrink-0" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Buscar global…"
          className="flex-1 min-w-0 bg-transparent border-0 outline-none text-foreground placeholder:text-muted-foreground text-sm"
          aria-label="Busca global"
        />
        <CornerDownLeft
          size={12}
          className="text-muted-foreground/60 flex-shrink-0"
        />
      </div>

      {showDropdown && (
        <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto glass-panel rounded-xl shadow-xl z-50 py-2">
          {searching && groups.length === 0 && (
            <p className="px-4 py-2 text-sm text-muted-foreground">Buscando…</p>
          )}

          {!searching && query.trim().length >= 2 && groups.length === 0 && (
            <p className="px-4 py-2 text-sm text-muted-foreground">
              Nenhum resultado para “{query.trim()}”.
            </p>
          )}

          {groups.map((group) => {
            const Icon = group.icon;
            return (
              <div key={group.label} className="mb-1.5 last:mb-0">
                <p className="flex items-center gap-1.5 px-4 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <Icon size={11} />
                  {group.label}
                </p>
                {group.items.map((item) => (
                  <button
                    key={`${group.label}-${item.href}-${item.title}`}
                    onClick={() => go(item.href)}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-secondary transition-colors"
                  >
                    <span className="block text-foreground truncate">{item.title}</span>
                    {item.subtitle && (
                      <span className="block text-xs text-muted-foreground truncate">
                        {item.subtitle}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

