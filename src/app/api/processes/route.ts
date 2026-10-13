import { NextRequest, NextResponse } from "next/server";
import { PrismaProcessRepository } from "@/infra/repositories/PrismaProcessRepository";
import { getSession } from "@/lib/session";

const repo = new PrismaProcessRepository();

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const search = searchParams.get("search") || undefined;
  const status = searchParams.get("status") || undefined;

  const processes = await repo.findMany({ search, status });
  return NextResponse.json(processes);
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }
  if (session.user.role !== "admin") {
    return NextResponse.json({ error: "Acesso restrito a administradores." }, { status: 403 });
  }

  try {
    const body = await request.json();
    if (!body.title) {
      return NextResponse.json({ error: "O título é obrigatório." }, { status: 400 });
    }
    const saved = await repo.save({
      title: body.title,
      description: body.description,
      status: body.status,
      clientId: body.clientId,
      supplierId: body.supplierId,
    });
    return NextResponse.json(saved, { status: 201 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erro desconhecido";
    console.error("Erro ao criar processo:", error);
    return NextResponse.json({ error: "Erro ao criar processo: " + msg }, { status: 500 });
  }
}
