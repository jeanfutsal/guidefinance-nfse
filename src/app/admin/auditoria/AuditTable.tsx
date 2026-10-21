"use client";

import { useEffect, useState, useCallback } from "react";
import { Clock, Search, Filter, RefreshCw } from "lucide-react";

interface AuditLog {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  fieldName?: string;
  oldValue?: string;
  newValue?: string;
  changedById: string;
  changedByName?: string;
  changedAt: string;
}

interface AuditLogPage {
  items: AuditLog[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export default function AuditTable() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(50);
  const [search, setSearch] = useState("");
  const [entityType, setEntityType] = useState("");
  const [action, setAction] = useState("");
  const [loading, setLoading] = useState(true);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
    });
    if (search) params.set("search", search);
    if (entityType) params.set("entityType", entityType);
    if (action) params.set("action", action);

    try {
      const res = await fetch("/api/audit-logs?" + params.toString());
      if (res.ok) {
        const data: AuditLogPage = await res.json();
        setLogs(data.items);
        setTotal(data.total);
      }
    } catch {
      // erro silencioso
    } finally {
      setLoading(false);
    }
  }, [page, search, entityType, action]);

  useEffect(() => {
    const timer = setTimeout(load, 0);
    return () => clearTimeout(timer);
  }, [load]);

  return (
    <div className="glass-panel rounded-xl p-5 border border-border mb-6">
      <div className="flex flex-col md:flex-row md:items-end gap-4">
        <div className="flex items-center gap-2 w-full md:w-1/3">
          <Search size={16} className="text-muted-foreground" />
          <input
            id="searchInput"
            type="text"
            placeholder="Buscar nome, CNPJ, chave, valor…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full mt-1 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
        <div className="w-full md:w-1/4">
          <Filter size={16} className="text-muted-foreground" />
          <select
            id="entityFilter"
            value={entityType}
            onChange={(e) => {
              setEntityType(e.target.value);
              setPage(1);
            }}
            className="w-full mt-1 border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value="">Todas as entidades</option>
            <option value="Client">Clientes</option>
            <option value="Supplier">Fornecedores</option>
            <option value="Invoice">Notas Fiscais</option>
            <option value="Process">Processos</option>
            <option value="Ticket">Tickets</option>
            <option value="User">Usuários</option>
          </select>
        </div>
        <div className="w-full md:w-1/4">
          <Clock size={16} className="text-muted-foreground" />
          <select
            id="actionFilter"
            value={action}
            onChange={(e) => {
              setAction(e.target.value);
              setPage(1);
            }}
            className="w-full mt-1 border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value="">Todas as ações</option>
            <option value="CREATE">Criado</option>
            <option value="UPDATE">Alterado</option>
            <option value="DELETE">Excluído</option>
            <option value="ARCHIVE">Arquivado</option>
            <option value="RESTORE">Restaurado</option>
          </select>
        </div>
        <button
          id="refreshBtn"
          onClick={load}
          className="border border-border rounded-lg px-3 py-2 text-sm hover:bg-secondary flex items-center gap-2"
        >
          <RefreshCw size={16} /> Atualizar
        </button>
      </div>
    </div>
  );
}