import { NextRequest, NextResponse } from "next/server";
import { extractInvoiceData } from "@/core/use-cases/extractInvoiceData";

export const runtime = "nodejs";

const pdfParse = require("pdf-parse");

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "Nenhum arquivo PDF enviado." },
        { status: 400 }
      );
    }

    // Lê o arquivo PDF enviado
    const arrayBuffer = await file.arrayBuffer();

    // pdf-parse 1.1.1 trabalha com Buffer do Node
    const buffer = Buffer.from(arrayBuffer);

    // Extrai o texto do PDF
    const pdfData = await pdfParse(buffer);
    const rawText = pdfData.text;

    if (!rawText || rawText.trim() === "") {
      return NextResponse.json(
        {
          error:
            "Não foi possível extrair texto deste PDF. O arquivo pode estar corrompido ou ser composto apenas por imagens.",
        },
        { status: 422 }
      );
    }

    // Converte o texto extraído em dados da NFS-e
    const invoiceData = extractInvoiceData(rawText);

    if (!invoiceData.accessKey) {
      return NextResponse.json(
        {
          error:
            "Não foi possível identificar a Chave de Acesso da NFS-e. O arquivo enviado possui o formato/layout suportado?",
          rawTextSnippet: rawText.substring(0, 1000),
        },
        { status: 422 }
      );
    }

    return NextResponse.json(invoiceData);

  } catch (error: any) {
    console.error("Erro na extração do PDF:", error);

    return NextResponse.json(
      {
        error:
          "Erro interno no servidor ao processar o arquivo PDF: " +
          error.message,
      },
      { status: 500 }
    );
  }
}