import { describe, expect, it } from "vitest";
import { PROCESS_STATUSES, PROCESS_STATUS_LABELS } from "../Process";
import { STEP_COLORS } from "../ProcessStep";
import {
  TICKET_PRIORITIES,
  TICKET_PRIORITY_LABELS,
  TICKET_STATUSES,
  TICKET_STATUS_LABELS,
} from "../Ticket";

describe("catálogos de domínio (Fase 2.3)", () => {
  it("processos: define exatamente os5 status conhecidos", () => {
    expect([...PROCESS_STATUSES]).toEqual([
      "aberto",
      "em_andamento",
      "aguardando",
      "concluido",
      "cancelado",
    ]);
  });

  it("processos: labels cobrem exatamente os status definidos", () => {
    expect(Object.keys(PROCESS_STATUS_LABELS).sort()).toEqual([...PROCESS_STATUSES].sort());
  });

  it("processos: cores de badge são únicas", () => {
    const colors = Object.values(PROCESS_STATUS_LABELS).map((s) => s.color);
    expect(new Set(colors).size).toBe(colors.length);
  });

  it("tickets:4 status e3 prioridades com labels completos", () => {
    expect([...TICKET_STATUSES]).toEqual(["aberto", "em_andamento", "respondido", "fechado"]);
    expect([...TICKET_PRIORITIES]).toEqual(["baixa", "media", "alta"]);
    expect(Object.keys(TICKET_STATUS_LABELS).sort()).toEqual([...TICKET_STATUSES].sort());
    expect(Object.keys(TICKET_PRIORITY_LABELS).sort()).toEqual([...TICKET_PRIORITIES].sort());
  });

  it("steps: cores predefinidas são hex válidos de6 dígitos", () => {
    expect(STEP_COLORS.length).toBeGreaterThan(0);
    for (const color of STEP_COLORS) {
      expect(color).toMatch(/^#[0-9a-fA-F]{6}$/);
    }
  });
});
