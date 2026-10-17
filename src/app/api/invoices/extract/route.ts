import { NextRequest, NextResponse } from "next/server";
import { extractInvoiceData } from "@/core/use-cases/extractInvoiceData";
import { getSession } from "@/lib/session";
import { assemblePdfPage } from "@/lib/pdfText";
import pdfParse from "pdf-parse";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }
  if (session.user.role !== "admin") {
    return NextResponse.json({ error: "Acesso restrito a administradores." }, { status: 403 });
  }

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

    // Extrai o texto do PDF (pagerender mantem os espacos visuais entre itens;
    // o padrao do pdf-parse concatena e colava nomes/descricoes)
    const pdfData = await pdfParse(buffer, {
      pagerender: async (pageData) => {
        const content = await pageData.getTextContent();
        return assemblePdfPage(content.items);
      },
    });
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

  } catch (error) {
    console.error("Erro na extração do PDF:", error);

    return NextResponse.json(
      {
        error:
          "Erro interno no servidor ao processar o arquivo PDF: " +
          (error instanceof Error ? error.message : "erro desconhecido"),
      },
      { status: 500 }
    );
  }
}