/**
 * Declaração de tipos para pdf-parse@1.1.1 (o pacote não publica .d.ts).
 */
declare module "pdf-parse" {
  interface PdfParseResult {
    text: string;
    numpages: number;
    numrender: number;
    info: Record<string, unknown>;
    metadata: unknown;
    version: string;
  }

  /** Página do pdf.js exposta pelo callback pagerender. */
  interface PdfParsePage {
    getTextContent(): Promise<{
      items: { str: string; transform?: number[]; width?: number }[];
    }>;
  }

  interface PdfParseOptions {
    /** Permite montar o texto da página com lógica própria (ex.: espaçamento). */
    pagerender?: (pageData: PdfParsePage) => Promise<string>;
  }

  function pdfParse(buffer: Buffer, options?: PdfParseOptions): Promise<PdfParseResult>;
  export default pdfParse;
}