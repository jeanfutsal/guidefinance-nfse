import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { PrismaProcessRepository } from "@/infra/repositories/PrismaProcessRepository";

const repo = new PrismaProcessRepository();

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  try {
    const { id } = await params;
    const process = await repo.findById(id);
    if (!process) {
      return NextResponse.json({ error: "Processo não encontrado." }, { status: 404 });
    }
    return NextResponse.json(process);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erro desconhecido";
    return NextResponse.json({ error: "Erro ao buscar processo: " + msg }, { status: 500 });
  }
}

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
    const existing = await repo.findById(id);
    if (!existing) {
      return NextResponse.json({ error: "Processo não encontrado." }, { status: 404 });
    }

    const body = await request.json();
    const updated = await repo.save({
      id,
      title: body.title ?? existing.title,
      description: body.description !== undefined ? body.description : existing.description,
      status: body.status ?? existing.status,
      clientId: body.clientId !== undefined ? body.clientId : existing.clientId,
      supplierId: body.supplierId !== undefined ? body.supplierId : existing.supplierId,
    });
    return NextResponse.json(updated);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erro desconhecido";
    return NextResponse.json({ error: "Erro ao atualizar processo: " + msg }, { status: 500 });
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
    const success = await repo.delete(id);
    if (!success) {
      return NextResponse.json({ error: "Processo não encontrado." }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erro desconhecido";
    return NextResponse.json({ error: "Erro ao excluir processo: " + msg }, { status: 500 });
  }
}
