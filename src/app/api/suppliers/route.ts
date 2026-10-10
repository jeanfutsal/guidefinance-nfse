import { NextRequest, NextResponse } from "next/server";
import { PrismaSupplierRepository } from "@/infra/repositories/PrismaSupplierRepository";
import { getSession } from "@/lib/session";

const repo = new PrismaSupplierRepository();

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const search = searchParams.get("search") || undefined;
  const city = searchParams.get("city") || undefined;
  const state = searchParams.get("state") || undefined;

  const suppliers = await repo.findMany({ search, city, state });
  return NextResponse.json(suppliers);
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
    if (!body.cnpj || !body.razaoSocial) {
      return NextResponse.json({ error: "CNPJ e Razão Social são obrigatórios." }, { status: 400 });
    }
    const saved = await repo.save(body);
    return NextResponse.json(saved, { status: 201 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erro desconhecido";
    console.error("Erro ao criar fornecedor:", error);
    return NextResponse.json({ error: "Erro ao criar fornecedor: " + msg }, { status: 500 });
  }
}