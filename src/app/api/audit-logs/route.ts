import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { requireAdmin } from "@/lib/permissions";
import { PrismaAuditLogRepository } from "@/infra/repositories/PrismaAuditLogRepository";

const repository = new PrismaAuditLogRepository();

export async function GET(request: NextRequest) {
  // Apenas administradores podem consultar o histórico de auditoria
  const session = await getSession();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Acesso restrito a administradores." }, { status: 403 });
  }

  try {
    const { searchParams } = request.nextUrl;

    const filters = {
      entityType: searchParams.get("entityType") || undefined,
      entityId: searchParams.get("entityId") || undefined,
      action: searchParams.get("action") || undefined,
      changedById: searchParams.get("changedById") || undefined,
      startDate: searchParams.get("startDate") || undefined,
      endDate: searchParams.get("endDate") || undefined,
      search: searchParams.get("search") || undefined,
      page: searchParams.get("page") ? Number(searchParams.get("page")) : 1,
      pageSize: searchParams.get("pageSize")
        ? Number(searchParams.get("pageSize"))
        : 50,
    };

    const result = await repository.findMany(filters);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Erro ao consultar auditoria:", error);
    return NextResponse.json(
      { error: "Erro ao consultar histórico de auditoria." },
      { status: 500 }
    );
  }
}

export async function POST() {
  // Criar logs de auditoria é feito internamente pelos repositórios, não pela API pública
  return NextResponse.json({ error: "Método não permitido." }, { status: 405 });
}