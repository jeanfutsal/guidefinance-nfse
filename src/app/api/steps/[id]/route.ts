import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { PrismaProcessRepository } from "@/infra/repositories/PrismaProcessRepository";

const repo = new PrismaProcessRepository();

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }
  if (session.user.role !== "admin") {
    return NextResponse.json({ error: "Acesso restrito a administradores." }, { status: 403 });
  }

  try {
    const { id } = await params;
    const body = await request.json();

    // O repositório não tem findById para steps; busca pelo processo informado ou revalida via update
    const processId: string | undefined = body.processId;
    if (!processId) {
      return NextResponse.json({ error: "processId é obrigatório." }, { status: 400 });
    }
    const process = await repo.findById(processId);
    if (!process) {
      return NextResponse.json({ error: "Processo não encontrado." }, { status: 404 });
    }
    const current = process.steps?.find((s) => s.id === id);
    if (!current) {
      return NextResponse.json({ error: "Etapa não encontrada." }, { status: 404 });
    }

    const step = await repo.saveStep({
      id,
      processId,
      title: body.title ?? current.title,
      description: body.description !== undefined ? body.description : current.description,
      color: body.color ?? current.color,
      date: body.date ?? current.date,
    });
    return NextResponse.json(step);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erro desconhecido";
    return NextResponse.json({ error: "Erro ao atualizar etapa: " + msg }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }
  if (session.user.role !== "admin") {
    return NextResponse.json({ error: "Acesso restrito a administradores." }, { status: 403 });
  }

  try {
    const { id } = await params;
    const success = await repo.deleteStep(id);
    if (!success) {
      return NextResponse.json({ error: "Etapa não encontrada." }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erro desconhecido";
    return NextResponse.json({ error: "Erro ao excluir etapa: " + msg }, { status: 500 });
  }
}
