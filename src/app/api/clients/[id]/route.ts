import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { PrismaClientRepository } from "@/infra/repositories/PrismaClientRepository";

const repo = new PrismaClientRepository();

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  try {
    const { id } = await params;
    const client = await repo.findById(id);
    if (!client) {
      return NextResponse.json({ error: "Cliente não encontrado." }, { status: 404 });
    }
    return NextResponse.json(client);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erro desconhecido";
    return NextResponse.json({ error: "Erro ao buscar cliente: " + msg }, { status: 500 });
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
      return NextResponse.json({ error: "Cliente não encontrado." }, { status: 404 });
    }

    const body = await request.json();
    const updated = await repo.save({ ...existing, ...body, id });
    return NextResponse.json(updated);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erro desconhecido";
    return NextResponse.json({ error: "Erro ao atualizar cliente: " + msg }, { status: 500 });
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
      return NextResponse.json({ error: "Cliente não encontrado." }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erro desconhecido";
    return NextResponse.json({ error: "Erro ao excluir cliente: " + msg }, { status: 500 });
  }
}