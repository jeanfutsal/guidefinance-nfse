import { NextRequest, NextResponse } from "next/server";
import { PrismaTicketRepository } from "@/infra/repositories/PrismaTicketRepository";
import { getSession } from "@/lib/session";

const repo = new PrismaTicketRepository();

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const search = searchParams.get("search") || undefined;
  const status = searchParams.get("status") || undefined;
  // Admin vê todos; usuário comum vê apenas os seus
  const userId = session.user.role === "admin" ? undefined : session.user.id;

  const tickets = await repo.findMany({ search, status, userId });
  return NextResponse.json(tickets);
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  try {
    const body = await request.json();
    if (!body.title) {
      return NextResponse.json({ error: "O título é obrigatório." }, { status: 400 });
    }
    const saved = await repo.save({
      title: body.title,
      description: body.description,
      priority: body.priority,
      processId: body.processId || null,
      userId: session.user.id,
      status: "aberto",
    });
    return NextResponse.json(saved, { status: 201 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erro desconhecido";
    console.error("Erro ao criar ticket:", error);
    return NextResponse.json({ error: "Erro ao criar ticket: " + msg }, { status: 500 });
  }
}
