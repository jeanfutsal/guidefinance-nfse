import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  findMany: vi.fn(),
  findById: vi.fn(),
  save: vi.fn(),
  delete: vi.fn(),
}));

vi.mock("@/lib/session", () => ({ getSession: mocks.getSession }));
vi.mock("@/infra/repositories/PrismaProcessRepository", () => ({
  PrismaProcessRepository: vi.fn(() => ({
    findMany: mocks.findMany,
    findById: mocks.findById,
    save: mocks.save,
    delete: mocks.delete,
  })),
}));

import { GET, POST } from "../route";
import { DELETE as deleteProcess, PATCH as patchProcess } from "../[id]/route";

function jsonRequest(url: string, method: string, body?: unknown) {
  return new NextRequest(url, {
    method,
    headers: { "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

const params = (id: string) => ({ params: Promise.resolve({ id }) });

const adminSession = { user: { id: "admin-1", role: "admin" } };
const userSession = { user: { id: "user-1", role: "user" } };

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/processes", () => {
  it("retorna 401 sem sessão", async () => {
    mocks.getSession.mockResolvedValue(null);
    const res = await GET(jsonRequest("http://localhost/api/processes", "GET"));
    expect(res.status).toBe(401);
  });

  it("autenticado pode listar com filtros", async () => {
    mocks.getSession.mockResolvedValue(userSession);
    mocks.findMany.mockResolvedValue([{ id: "p1" }]);
    const url = "http://localhost/api/processes?search=regular&status=aberto";

    const res = await GET(jsonRequest(url, "GET"));

    expect(res.status).toBe(200);
    expect(mocks.findMany).toHaveBeenCalledWith({ search: "regular", status: "aberto" });
  });
});

describe("POST /api/processes", () => {
  it("retorna 403 para usuário comum", async () => {
    mocks.getSession.mockResolvedValue(userSession);
    const res = await POST(
      jsonRequest("http://localhost/api/processes", "POST", { title: "Processo X" })
    );
    expect(res.status).toBe(403);
    expect(mocks.save).not.toHaveBeenCalled();
  });

  it("retorna 400 sem título mesmo para admin", async () => {
    mocks.getSession.mockResolvedValue(adminSession);
    const res = await POST(jsonRequest("http://localhost/api/processes", "POST", {}));
    expect(res.status).toBe(400);
  });

  it("admin cria processo com todos os campos", async () => {
    mocks.getSession.mockResolvedValue(adminSession);
    mocks.save.mockResolvedValue({ id: "p1" });

    const res = await POST(
      jsonRequest("http://localhost/api/processes", "POST", {
        title: "Regularização",
        description: "Detalhe",
        status: "em_andamento",
        clientId: "c1",
      })
    );

    expect(res.status).toBe(201);
    expect(mocks.save).toHaveBeenCalledWith({
      title: "Regularização",
      description: "Detalhe",
      status: "em_andamento",
      clientId: "c1",
      supplierId: undefined,
    });
  });
});

describe("PATCH/DELETE /api/processes/[id]", () => {
  it("PATCH retorna 403 para usuário comum", async () => {
    mocks.getSession.mockResolvedValue(userSession);
    const res = await patchProcess(
      jsonRequest("http://localhost/api/processes/p1", "PATCH", { title: "X" }),
      params("p1")
    );
    expect(res.status).toBe(403);
  });

  it("PATCH retorna 404 para processo inexistente", async () => {
    mocks.getSession.mockResolvedValue(adminSession);
    mocks.findById.mockResolvedValue(null);
    const res = await patchProcess(
      jsonRequest("http://localhost/api/processes/p9", "PATCH", { title: "X" }),
      params("p9")
    );
    expect(res.status).toBe(404);
  });

  it("DELETE retorna 403 para usuário comum", async () => {
    mocks.getSession.mockResolvedValue(userSession);
    const res = await deleteProcess(
      jsonRequest("http://localhost/api/processes/p1", "DELETE"),
      params("p1")
    );
    expect(res.status).toBe(403);
  });
});
