/**
 * Item de texto de um PDF conforme exposto por pdf-parse/pdf.js
 * (getTextContent), com posicionamento em unidades do espaco de trabalho.
 */
export interface PdfTextItem {
  str: string;
  transform?: number[];
  width?: number;
}

/**
 * Monta o texto de uma pagina do PDF respeitando o espacamento visual.
 *
 * O pdf-parse por padrao concatena os itens sem considerar lacunas
 * horizontais, o que gera textos como "NATHALIAROCHADONASCIMENTO".
 * Aqui: itens na mesma linha recebem um espaco quando a lacuna entre o
 * fim de um e o inicio do proximo supera ~25% da largura media de um
 * caractere (kerning intra-palavra fica abaixo do limiar; quebra de
 * coluna/tabulacao fica acima). Mudanca de Y vira quebra de linha,
 * preservando o formato "rotulo<LF>valor" que os regex de extracao usam.
 */
export function assemblePdfPage(items: PdfTextItem[]): string {
  const out: string[] = [];
  let line: string[] = [];
  let lastEndX: number | null = null;
  let lastY: number | null = null;

  const flushLine = () => {
    if (line.length > 0) out.push(line.join(""));
    line = [];
  };

  for (const it of items) {
    if (!it.str) continue;
    const x = it.transform?.[4];
    const y = it.transform?.[5];

    // Quebra de linha quando o Y muda (itens de linhas diferentes)
    if (y != null && lastY != null && Math.abs(y - lastY) > 0.5) {
      flushLine();
      lastEndX = null;
    }
    if (y != null) lastY = y;

    // Espaco quando ha lacuna horizontal clara entre itens da mesma linha.
    // Limiar 1.5pt calibrado com DANFSe reais: kerning intra-palavra fica
    // abaixo (ex: 0.55pt em "E COMERCIO"); espaco visual acima (ex: 1.59pt
    // entre data e hora; gaps de 2-6pt entre palavras).
    if (x != null && lastEndX != null && line.length > 0 && x - lastEndX > 1.5) {
      line.push(" ");
    }
    line.push(it.str);
    if (x != null && it.width != null) {
      lastEndX = x + it.width;
    } else {
      lastEndX = null;
    }
  }
  flushLine();

  return out.join("\n");
}