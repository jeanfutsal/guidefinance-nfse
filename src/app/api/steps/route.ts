import { NextRequest, NextResponse } from "next/server";
import { PrismaProcessRepository } from "@/infra/repositories/PrismaProcessRepository";
import { getSession } from "@/lib/session";

const repo = new PrismaProcessRepository();

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
    if (!body.processId || !body.title || !body.date) {
      return NextResponse.json(
        { error: "Processo, título e data são obrigatórios." },
        { status: 400 }
      );
    }
    const process = await repo.findById(body.processId);
    if (!process) {
      return NextResponse.json({ error: "Processo não encontrado." }, { status: 404 });
    }
    const step = await repo.saveStep({
      processId: body.processId,
      title: body.title,
      description: body.description,
      color: body.color,
      date: body.date,
    });
    return NextResponse.json(step, { status: 201 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erro desconhecido";
    console.error("Erro ao criar etapa:", error);
    return NextResponse.json({ error: "Erro ao criar etapa: " + msg }, { status: 500 });
  }
}
