import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { PrismaClientRepository } from "@/infra/repositories/PrismaClientRepository";
import { PrismaInvoiceRepository } from "@/infra/repositories/PrismaInvoiceRepository";

const clientsRepo = new PrismaClientRepository();
const invoicesRepo = new PrismaInvoiceRepository();

/**
 * Notas fiscais de um cliente (tomador).
 * Usado pelo ClientsExplorer para preencher o painel expansível.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }
  if (session.user.role !== "admin") {
    return NextResponse.json({ error: "Acesso restrito a administradores." }, { status: 403 });
  }

  try {
    const { id } = await params;
    const client = await clientsRepo.findById(id);
    if (!client) {
      return NextResponse.json({ error: "Cliente não encontrado." }, { status: 404 });
    }

    const invoices = await invoicesRepo.findByClient({ id: client.id, cnpj: client.cnpj });
    return NextResponse.json(invoices);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erro desconhecido";
    return NextResponse.json(
      { error: "Erro ao buscar notas do cliente: " + msg },
      { status: 500 }
    );
  }
}