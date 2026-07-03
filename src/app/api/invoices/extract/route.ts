import { NextRequest, NextResponse } from "next/server";
import { extractInvoiceData } from "@/core/use-cases/extractInvoiceData";

// Como pdf-parse usa módulos CJS com dependências de arquivo, 
// fazemos o require dinâmico no servidor para evitar problemas de compilação webpack
const { PDFParse } = require("pdf-parse");

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

    // Lê os dados binários do arquivo
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    // Instancia o parser e extrai o texto do PDF
    const parser = new PDFParse(uint8Array);
    const pdfData = await parser.getText();
    const rawText = pdfData.text;

    if (!rawText || rawText.trim() === "") {
      return NextResponse.json(
        { error: "Não foi possível extrair texto deste PDF. O arquivo pode estar corrompido ou ser composto apenas por imagens." },
        { status: 422 }
      );
    }

    // Executa a extração dos dados estruturados
    const invoiceData = extractInvoiceData(rawText);

    if (!invoiceData.accessKey) {
      return NextResponse.json(
        { 
          error: "Não foi possível identificar a Chave de Acesso da NFS-e. O arquivo enviado possui o formato/layout suportado?",
          rawTextSnippet: rawText.substring(0, 1000) // snippet para debug
        },
        { status: 422 }
      );
    }

    return NextResponse.json(invoiceData);
  } catch (error: any) {
    console.error("Erro na extração do PDF:", error);
    return NextResponse.json(
      { error: "Erro interno no servidor ao processar o arquivo PDF: " + error.message },
      { status: 500 }
    );
  }
}
