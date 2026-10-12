"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Plus,
  Search,
  Trash2,
  ShieldCheck,
  ShieldOff,
  Loader2,
  AlertCircle,
  Users,
  X,
} from "lucide-react";
import { authClient } from "@/lib/auth-client";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role?: string | null;
  banned?: boolean | null;
  createdAt?: string | null;
}

const fieldClass =
  "glass-input w-full rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground";

export function UsersManager() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [listError, setListError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  // Modal de criação
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "user" as "user" | "admin",
  });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Modal de remoção
  const [removeTarget, setRemoveTarget] = useState<AdminUser | null>(null);
  const [removing, setRemoving] = useState(false);
  const [removeError, setRemoveError] = useState<string | null>(null);

  const { data: session } = authClient.useSession();
  const currentUserId = session?.user?.id;

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setListError(null);
    const { data, error } = await authClient.admin.listUsers({
      query: {
        limit: 200,
        ...(search
          ? {
              searchValue: search,
              searchField: search.includes("@") ? "email" : "name",
            }
          : {}),
      },
    });
    if (error) {
      setListError(error.message ?? "Erro ao carregar usuários.");
    } else {
      setUsers(
        (data?.users ?? []).map((u) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          role: u.role ?? null,
          banned: u.banned ?? null,
          createdAt: u.createdAt ? new Date(u.createdAt).toISOString() : null,
        }))
      );
    }
    setLoading(false);
  }, [search]);

  useEffect(() => {
    const timeout = setTimeout(fetchUsers, 300);
    return () => clearTimeout(timeout);
  }, [fetchUsers]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreateError(null);
    setCreating(true);
    try {
      const { error } = await authClient.admin.createUser({
        email: form.email,
        password: form.password,
        name: form.name,
        role: form.role,
      });
      if (error) {
        setCreateError(error.message ?? "Erro ao criar usuário.");
        return;
      }
      setCreateOpen(false);
      setForm({ name: "", email: "", password: "", role: "user" });
      fetchUsers();
    } finally {
      setCreating(false);
    }
  }

  async function handleToggleRole(user: AdminUser) {
    if (user.id === currentUserId) return;
    const newRole = user.role === "admin" ? "user" : "admin";
    setBusyId(user.id);
    try {
      const { error } = await authClient.admin.setRole({
        userId: user.id,
        role: newRole,
      });
      if (!error) {
        setUsers((prev) =>
          prev.map((u) => (u.id === user.id ? { ...u, role: newRole } : u))
        );
      }
    } finally {
      setBusyId(null);
    }
  }

  async function handleRemove() {
    if (!removeTarget) return;
    setRemoveError(null);
    setRemoving(true);
    try {
      const { error } = await authClient.admin.removeUser({
        userId: removeTarget.id,
      });
      if (error) {
        setRemoveError(error.message ?? "Erro ao remover usuário.");
        return;
      }
      setRemoveTarget(null);
      fetchUsers();
    } finally {
      setRemoving(false);
    }
  }

  function formatDate(iso?: string | null) {
    if (!iso) return "—";
    try {
      return new Intl.DateTimeFormat("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }).format(new Date(iso));
    } catch {
      return "—";
    }
  }

  return (
    <div className="space-y-6">
      {/* Barra de controles */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            size={16}
          />
          <input
            type="text"
            placeholder="Buscar por e-mail ou nome..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`${fieldClass} pl-9 pr-4`}
          />
        </div>
        <button
          onClick={() => {
            setCreateError(null);
            setCreateOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <Plus size={16} />
          Novo Usuário
        </button>
      </div>

      {listError && (
        <div className="flex items-start gap-2 rounded-lg border border-error/40 bg-error/10 px-3 py-2.5 text-sm text-error">
          <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
          <span>{listError}</span>
        </div>
      )}

      {/* Tabela */}
      <div className="glass-card rounded-xl border border-border overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
            <Loader2 size={16} className="animate-spin" /> Carregando usuários...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/30">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Nome</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">E-mail</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Papel</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Criado em</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Ações</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const isAdminUser = u.role === "admin";
                  const isSelf = u.id === currentUserId;
                  return (
                    <tr
                      key={u.id}
                      className="border-b border-border/50 hover:bg-secondary/20 transition-colors group"
                    >
                      <td className="px-4 py-3 font-medium text-foreground">
                        {u.name}
                        {isSelf && (
                          <span className="ml-2 text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded-full bg-secondary text-muted-foreground">
                            você
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${
                            isAdminUser
                              ? "bg-amber-500/15 text-amber-400"
                              : "bg-secondary text-muted-foreground"
                          }`}
                        >
                          {isAdminUser ? "Administrador" : "Usuário"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                        {formatDate(u.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleToggleRole(u)}
                            disabled={busyId === u.id || isSelf}
                            title={
                              isSelf
                                ? "Você não pode alterar seu próprio papel"
                                : isAdminUser
                                ? "Rebaixar para usuário"
                                : "Promover para administrador"
                            }
                            className={`w-7 h-7 flex items-center justify-center rounded-md transition-all disabled:opacity-30 disabled:cursor-not-allowed ${
                              isAdminUser
                                ? "hover:bg-secondary text-muted-foreground hover:text-foreground"
                                : "hover:bg-amber-500/10 text-muted-foreground hover:text-amber-400"
                            }`}
                          >
                            {busyId === u.id ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : isAdminUser ? (
                              <ShieldOff size={14} />
                            ) : (
                              <ShieldCheck size={14} />
                            )}
                          </button>
                          <button
                            onClick={() => {
                              setRemoveError(null);
                              setRemoveTarget(u);
                            }}
                            disabled={isSelf}
                            title={
                              isSelf ? "Você não pode remover a própria conta" : "Remover usuário"
                            }
                            className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-rose-500/10 text-muted-foreground hover:text-rose-400 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center">
                      <Users size={28} className="mx-auto text-muted-foreground/50 mb-2" />
                      <p className="text-muted-foreground text-sm">
                        {search ? "Nenhum usuário encontrado." : "Nenhum usuário cadastrado."}
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: criar usuário */}
      {createOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => !creating && setCreateOpen(false)}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div
            className="relative z-10 w-full max-w-md glass-panel rounded-2xl border border-border shadow-2xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground">Novo Usuário</h3>
              <button
                onClick={() => setCreateOpen(false)}
                className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-all"
              >
                <X size={14} />
              </button>
            </div>

            {createError && (
              <div className="flex items-start gap-2 mb-4 rounded-lg border border-error/40 bg-error/10 px-3 py-2.5 text-xs text-error">
                <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                <span>{createError}</span>
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label htmlFor="user-name" className="block text-sm font-medium text-foreground mb-1.5">
                  Nome *
                </label>
                <input
                  id="user-name"
                  required
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Nome completo"
                  className={fieldClass}
                />
              </div>
              <div>
                <label htmlFor="user-email" className="block text-sm font-medium text-foreground mb-1.5">
                  E-mail *
                </label>
                <input
                  id="user-email"
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="usuario@exemplo.com"
                  className={fieldClass}
                />
              </div>
              <div>
                <label htmlFor="user-password" className="block text-sm font-medium text-foreground mb-1.5">
                  Senha *
                </label>
                <input
                  id="user-password"
                  type="password"
                  required
                  minLength={8}
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  placeholder="Mínimo de 8 caracteres"
                  className={fieldClass}
                />
              </div>
              <div>
                <label htmlFor="user-role" className="block text-sm font-medium text-foreground mb-1.5">
                  Papel
                </label>
                <select
                  id="user-role"
                  value={form.role}
                  onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as "user" | "admin" }))}
                  className={fieldClass}
                >
                  <option value="user">Usuário</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCreateOpen(false)}
                  disabled={creating}
                  className="px-4 py-2.5 rounded-lg text-sm text-muted-foreground hover:bg-secondary transition-colors disabled:opacity-60"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-60"
                >
                  {creating && <Loader2 size={14} className="animate-spin" />}
                  Criar usuário
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: remover usuário */}
      {removeTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => !removing && setRemoveTarget(null)}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div
            className="relative z-10 w-full max-w-sm glass-panel rounded-2xl border border-border shadow-2xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-semibold text-foreground">Remover usuário?</h3>
            <p className="text-sm text-muted-foreground mt-2">
              A conta de <span className="text-foreground font-medium">{removeTarget.email}</span>{" "}
              será removida permanentemente. Esta ação não pode ser desfeita.
            </p>

            {removeError && (
              <div className="flex items-start gap-2 mt-3 rounded-lg border border-error/40 bg-error/10 px-3 py-2 text-xs text-error">
                <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                <span>{removeError}</span>
              </div>
            )}

            <div className="flex justify-end gap-2 mt-5">
              <button
                onClick={() => setRemoveTarget(null)}
                disabled={removing}
                className="px-4 py-2 rounded-lg text-sm text-muted-foreground hover:bg-secondary transition-colors disabled:opacity-60"
              >
                Cancelar
              </button>
              <button
                onClick={handleRemove}
                disabled={removing}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-rose-500 text-white text-sm font-medium hover:bg-rose-600 transition-colors disabled:opacity-60"
              >
                {removing && <Loader2 size={14} className="animate-spin" />}
                Remover
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

