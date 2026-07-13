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
      minValue: searchParams.get("minValue")
        ? Number(searchParams.get("minValue"))
        : undefined,
      maxValue: searchParams.get("maxValue")
        ? Number(searchParams.get("maxValue"))
        : undefined,
    };

    const invoices = await repository.findAll(filters);
    return NextResponse.json(invoices);
  } catch (error: any) {
    console.error("Erro ao listar notas fiscais:", error);

    return NextResponse.json(
      {
        error: "Erro ao buscar notas fiscais: " + error.message,
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    console.log("========== NOTA RECEBIDA ==========");
    console.log(JSON.stringify(body, null, 2));
    console.log("===================================");

    const camposObrigatorios = {
      accessKey: !!body.accessKey,
      number: !!body.number,
      emitenteCnpj: !!body.emitenteCnpj,
      tomadorCnpj: !!body.tomadorCnpj,
    };

    console.log("Validação:", camposObrigatorios);

    if (
      !body.accessKey ||
      !body.number ||
      !body.emitenteCnpj ||
      !body.tomadorCnpj
    ) {
      return NextResponse.json(
        {
          error: "Dados obrigatórios da nota fiscal ausentes.",
          received: {
            accessKey: body.accessKey ?? null,
            number: body.number ?? null,
            emitenteCnpj: body.emitenteCnpj ?? null,
            tomadorCnpj: body.tomadorCnpj ?? null,
          },
        },
        { status: 400 }
      );
    }

    const savedInvoice = await repository.save(body);

    return NextResponse.json(savedInvoice);
  } catch (error: any) {
    console.error("Erro ao salvar nota fiscal:", error);

    return NextResponse.json(
      {
        error: "Erro ao registrar nota fiscal: " + error.message,
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        {
          error: "ID da nota fiscal não informado.",
        },
        { status: 400 }
      );
    }

    const success = await repository.delete(id);

    if (!success) {
      return NextResponse.json(
        {
          error:
            "Não foi possível excluir a nota fiscal. Registro não encontrado.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Erro ao excluir nota fiscal:", error);

    return NextResponse.json(
      {
        error: "Erro ao remover nota fiscal: " + error.message,
      },
      { status: 500 }
    );
  }
}