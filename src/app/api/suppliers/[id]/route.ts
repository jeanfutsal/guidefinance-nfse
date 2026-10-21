import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { PrismaSupplierRepository } from "@/infra/repositories/PrismaSupplierRepository";

const repo = new PrismaSupplierRepository();

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }
  try {
    const { id } = await params;
    const supplier = await repo.findById(id);
    if (!supplier) {
      return NextResponse.json({ error: "Fornecedor não encontrado." }, { status: 404 });
    }
    return NextResponse.json(supplier);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erro desconhecido";
    return NextResponse.json({ error: "Erro ao buscar fornecedor: " + msg }, { status: 500 });
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
      return NextResponse.json({ error: "Fornecedor não encontrado." }, { status: 404 });
    }

    const body = await request.json();
    const updated = await repo.save(
      { ...existing, ...body, id },
      {
        changedById: session.user.id,
        changedByName: session.user.name ?? undefined,
      }
    );
    return NextResponse.json(updated);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erro desconhecido";
    return NextResponse.json({ error: "Erro ao atualizar fornecedor: " + msg }, { status: 500 });
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
    const success = await repo.delete(id, {
      changedById: session.user.id,
      changedByName: session.user.name ?? undefined,
    });
    if (!success) {
      return NextResponse.json({ error: "Fornecedor não encontrado." }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erro desconhecido";
    return NextResponse.json({ error: "Erro ao excluir fornecedor: " + msg }, { status: 500 });
  }
}