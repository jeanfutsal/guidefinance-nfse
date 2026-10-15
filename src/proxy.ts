import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

// Páginas públicas (sem necessidade de sessão) — o visitante anônimo
// acessa direto o dashboard, as notas e os relatórios.
// Nunca incluir "/" na lista: a comparação de "/" é exata (ver isPublic).
const PUBLIC_PATHS = ["/login", "/notas", "/relatorios"];

/**
 * Check OTIMISTA de sessão (Next.js 16: middleware => proxy).
 * Apenas redireciona com base na existência do cookie — a validação
 * real da sessão acontece em src/app/(app)/layout.tsx e nas rotas de API.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = getSessionCookie(request);

  // "/" é público (visitante cai direto no dashboard); demais públicos exatos.
  // startsWith usa `${path}/` para não tornar tudo público a partir de "/".
  const isPublic =
    pathname === "/" ||
    PUBLIC_PATHS.some(
      (path) => pathname === path || pathname.startsWith(`${path}/`)
    );

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