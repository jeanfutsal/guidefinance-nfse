import { describe, expect, it } from "vitest";
import { assemblePdfPage } from "../pdfText";

describe("assemblePdfPage", () => {
  // Coordenadas reais extraidas de uma NFS-e (DANFSe Curitiba)
  it("insere espacos entre palavras da mesma linha quando ha lacuna", () => {
    const items = [
      { str: "61.869.912", transform: [9, 0, 0, 9, 14.17, 681.07], width: 40.02 },
      { str: "NATHALIA", transform: [9, 0, 0, 9, 56.34, 681.07], width: 39.08 },
      { str: "ROCHA", transform: [9, 0, 0, 9, 97.58, 681.07], width: 28.87 },
      { str: "DO", transform: [9, 0, 0, 9, 128.6, 681.07], width: 11.99 },
      { str: "NASCIMENTO", transform: [9, 0, 0, 9, 142.72, 681.07], width: 53.29 },
    ];
    expect(assemblePdfPage(items)).toBe(
      "61.869.912 NATHALIA ROCHA DO NASCIMENTO"
    );
  });

  it("nao insere espaco em kerning intra-palavra (lacuna pequena)", () => {
    const items = [
      { str: "PRE", transform: [9, 0, 0, 9, 14.17, 595.65], width: 15 },
      { str: "VIA", transform: [9, 0, 0, 9, 29.82, 595.65], width: 12 },
    ];
    expect(assemblePdfPage(items)).toBe("PREVIA");
  });

  it("vira quebra de linha quando o Y muda (rotulo/valor)", () => {
    const items = [
      { str: "Nome/ Nome Empresarial", transform: [9, 0, 0, 9, 14.17, 689.91], width: 81.49 },
      { str: "NATHALIA ROCHA", transform: [9, 0, 0, 9, 14.17, 681.07], width: 70 },
    ];
    expect(assemblePdfPage(items)).toBe(
      "Nome/ Nome Empresarial\nNATHALIA ROCHA"
    );
  });

  it("mantem data e hora com espaco (gaps reais de 1.59pt)", () => {
    const items = [
      { str: "17/03/2026", transform: [9, 0, 0, 9, 14.17, 548.36], width: 47.94 },
      { str: "20:35:23", transform: [9, 0, 0, 9, 63.7, 548.36], width: 34.69 },
    ];
    expect(assemblePdfPage(items)).toBe("17/03/2026 20:35:23");
  });

  it("ignora itens vazios e concatena itens sem transform na mesma linha", () => {
    const items = [
      { str: "", transform: [9, 0, 0, 9, 14, 600] },
      { str: "SemCoord", width: 10 },
      { str: "Fim" },
    ];
    expect(assemblePdfPage(items)).toBe("SemCoordFim");
  });
});