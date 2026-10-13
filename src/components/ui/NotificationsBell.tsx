"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, Check, CheckCheck, Loader2 } from "lucide-react";
import { Notification } from "@/entities/Notification";

function formatDate(iso: string) {
  try {
    const date = new Date(iso);
    const now = Date.now();
    const diffMs = now - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return "agora";
    if (diffMin < 60) return `${diffMin} min`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h`;
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(date);
  } catch {
    return "—";
  }
}

export function NotificationsBell() {
  const router = useRouter();
  const [items, setItems] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const [markingId, setMarkingId] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications");
      if (!res.ok) return;
      const data = await res.json();
      setItems(data.notifications ?? []);
      setUnread(data.unread ?? 0);
    } catch {
      // silencioso — o sino é best-effort
    }
  }, []);

  useEffect(() => {
    const initial = setTimeout(fetchNotifications, 0);
    const interval = setInterval(fetchNotifications, 60000);
    return () => {
      clearTimeout(initial);
      clearInterval(interval);
    };
  }, [fetchNotifications]);

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

  async function markRead(id: string) {
    setMarkingId(id);
    try {
      const res = await fetch(`/api/notifications/${id}`, { method: "PATCH" });
      if (res.ok) {
        setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
        setUnread((prev) => Math.max(0, prev - 1));
      }
    } finally {
      setMarkingId(null);
    }
  }

  async function markAllRead() {
    try {
      const res = await fetch("/api/notifications/read-all", { method: "POST" });
      if (res.ok) {
        setItems((prev) => prev.map((n) => ({ ...n, read: true })));
        setUnread(0);
      }
    } catch {
      // silencioso
    }
  }

  function openNotification(n: Notification) {
    if (!n.read) void markRead(n.id);
    setOpen(false);
    // Toda notificação de ticket leva à área "Meus Tickets"
    router.push("/tickets");
  }

  const badge = unread > 9 ? "9+" : unread > 0 ? String(unread) : null;

  return (
    <div ref={rootRef} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative w-8 h-8 flex items-center justify-center rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-all"
        title={unread > 0 ? `${unread} notificação(ões) não lida(s)` : "Notificações"}
      >
        <Bell size={16} />
        {badge && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center border-2 border-card">
            {badge}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 glass-panel rounded-xl shadow-xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-border">
            <p className="text-sm font-semibold text-foreground">Notificações</p>
            {unread > 0 && (
              <button
                onClick={markAllRead}
                className="flex items-center gap-1 text-xs text-primary hover:underline"
                title="Marcar todas como lidas"
              >
                <CheckCheck size={12} />
                Marcar todas
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {items.length === 0 ? (
              <p className="px-4 py-6 text-sm text-muted-foreground text-center">
                Nenhuma notificação.
              </p>
            ) : (
              <ul className="divide-y divide-border/50">
                {items.map((n) => (
                  <li key={n.id}>
                    <button
                      onClick={() => openNotification(n)}
                      className={`w-full text-left px-4 py-3 hover:bg-secondary transition-colors flex items-start gap-2.5 ${
                        n.read ? "opacity-70" : ""
                      }`}
                    >
                      <span
                        className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${
                          n.read ? "bg-border" : "bg-primary"
                        }`}
                        aria-hidden
                      />
                      <span className="flex-1 min-w-0">
                        <span className="block text-sm font-medium text-foreground truncate">
                          {n.title}
                        </span>
                        {n.message && (
                          <span className="block text-xs text-muted-foreground line-clamp-2">
                            {n.message}
                          </span>
                        )}
                        <span className="block text-[11px] text-muted-foreground mt-0.5">
                          {formatDate(n.createdAt)}
                        </span>
                      </span>
                      {!n.read &&
                        (markingId === n.id ? (
                          <Loader2 size={12} className="animate-spin text-muted-foreground flex-shrink-0 mt-1" />
                        ) : (
                          <Check size={12} className="text-muted-foreground flex-shrink-0 mt-1" />
                        ))}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="border-t border-border">
            <button
              onClick={() => {
                setOpen(false);
                router.push("/tickets");
              }}
              className="w-full px-4 py-2.5 text-xs text-primary hover:bg-primary/10 transition-colors font-medium"
            >
              Ver meus tickets
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

