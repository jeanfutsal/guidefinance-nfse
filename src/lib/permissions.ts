import { redirect } from "next/navigation";
import { getSession } from "./session";

/**
 * Exige sessão ativa e papel "admin".
 * - Sem sessão -> redirect /login
 * - Sem papel admin -> redirect /403
 */
export async function requireAdmin() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }
  if (session.user.role !== "admin") {
    redirect("/403");
  }
  return session;
}

/** Retorna o papel do usuário atual ou null se não autenticado. */
export async function getRole(): Promise<"admin" | "user" | null> {
  const session = await getSession();
  if (!session) return null;
  return (session.user.role as "admin" | "user") ?? "user";
}

/** true se o usuário atual é admin (usado para condicionar botões na UI). */
export async function isAdmin(): Promise<boolean> {
  return (await getRole()) === "admin";
}
