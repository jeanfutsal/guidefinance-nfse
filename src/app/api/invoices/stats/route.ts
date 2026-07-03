import { NextRequest, NextResponse } from "next/server";
import { InvoiceRepositoryProvider } from "@/infra/repositories/InvoiceRepositoryProvider";
import { InvoiceFilters } from "@/core/repositories/InvoiceRepository";

const repository = InvoiceRepositoryProvider.getServerRepository();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    
    const filters: InvoiceFilters = {
      startDate: searchParams.get("startDate") || undefined,
      endDate: searchParams.get("endDate") || undefined,
      emitenteCnpj: searchParams.get("emitenteCnpj") || undefined,
      tomadorCnpj: searchParams.get("tomadorCnpj") || undefined,
      searchValue: searchParams.get("searchValue") || undefined,
      minValue: searchParams.get("minValue") ? Number(searchParams.get("minValue")) : undefined,
      maxValue: searchParams.get("maxValue") ? Number(searchParams.get("maxValue")) : undefined,
    };

    const stats = await repository.getStats(filters);
    return NextResponse.json(stats);
  } catch (error: any) {
    console.error("Erro ao obter estatísticas:", error);
    return NextResponse.json(
      { error: "Erro ao compilar estatísticas financeiras: " + error.message },
      { status: 500 }
    );
  }
}
