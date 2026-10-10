import { cache } from "react";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

/**
 * Obtém a sessão do usuário atual no servidor
 * (RSC, Server Actions e Route Handlers).
 * Memoizado por request via React cache.
 */
export const getSession = cache(async () => {
  return await auth.api.getSession({
    headers: await headers(),
  });
});