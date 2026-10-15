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

  function pdfParse(buffer: Buffer): Promise<PdfParseResult>;
  export default pdfParse;
}
