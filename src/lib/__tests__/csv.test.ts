import { afterEach, describe, expect, it, vi } from "vitest";
import { buildCsv, downloadCsv, escapeCsvField } from "../csv";

describe("escapeCsvField", () => {
  it("sempre envolve o valor entre aspas", () => {
    expect(escapeCsvField("abc")).toBe('"abc"');
    expect(escapeCsvField(42)).toBe('"42"');
    expect(escapeCsvField(true)).toBe('"true"');
    expect(escapeCsvField(false)).toBe('"false"');
  });

  it("duplica aspas internas", () => {
    expect(escapeCsvField('ele disse "oi"')).toBe('"ele disse ""oi"""');
  });

  it("mantém vírgulas e quebras de linha dentro das aspas", () => {
    expect(escapeCsvField("a,b\nc")).toBe('"a,b\nc"');
  });

  it("null/undefined viram campo vazio", () => {
    expect(escapeCsvField(null)).toBe('""');
    expect(escapeCsvField(undefined)).toBe('""');
  });
});

describe("buildCsv", () => {
  it("gera BOM + cabeçalho + linhas separadas por CRLF", () => {
    const csv = buildCsv(["Nome", "Valor"], [["Cliente A", 10.5]]);
    expect(csv.startsWith("\uFEFF")).toBe(true);
    const body = csv.slice(1);
    expect(body).toBe('"Nome","Valor"\r\n"Cliente A","10.5"');
  });

  it("escapa campos especiais em qualquer linha", () => {
    const csv = buildCsv(["Nota"], [['chave com "aspas" e, vírgula']]);
    expect(csv.slice(1)).toBe('"Nota"\r\n"chave com ""aspas"" e, vírgula"');
  });

  it("aceita linhas vazias de dados", () => {
    const csv = buildCsv(["A"], []);
    expect(csv.slice(1)).toBe('"A"');
  });
});

describe("downloadCsv", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("cria link com filename e clica, liberando o blob", () => {
    const click = vi.fn();
    const revokeObjectURL = vi.fn();
    vi.stubGlobal("Blob", class {
      constructor(
        public parts: BlobPart[],
        public options?: BlobPropertyBag
      ) {}
    });
    vi.stubGlobal("URL", { createObjectURL: vi.fn(() => "blob:test"), revokeObjectURL });
    vi.stubGlobal("document", {
      createElement: () => ({ href: "", download: "", click }),
    });

    downloadCsv("relatorio.csv", "\uFEFF\"A\"");

    expect(click).toHaveBeenCalledOnce();
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:test");
  });
});
