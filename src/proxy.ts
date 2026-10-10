import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

// Páginas públicas (sem necessidade de sessão)
const PUBLIC_PATHS = ["/login"];

/**
 * Check OTIMISTA de sessão (Next.js 16: middleware => proxy).
 * Apenas redireciona com base na existência do cookie — a validação
 * real da sessão acontece em src/app/(app)/layout.tsx e nas rotas de API.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = getSessionCookie(request);

  const isPublic = PUBLIC_PATHS.some((path) => pathname.startsWith(path));

  if (!sessionCookie && !isPublic) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (sessionCookie && pathname === "/login") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Rotas /api são protegidas individualmente (retornam 401 em vez de redirect)
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};