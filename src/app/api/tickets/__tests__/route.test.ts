import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  findMany: vi.fn(),
  findById: vi.fn(),
  save: vi.fn(),
  delete: vi.fn(),
  createNotification: vi.fn(),
  findManyByUser: vi.fn(),
  countUnread: vi.fn(),
  markRead: vi.fn(),
  markAllRead: vi.fn(),
}));

vi.mock("@/lib/session", () => ({ getSession: mocks.getSession }));
vi.mock("@/infra/repositories/PrismaTicketRepository", () => ({
  PrismaTicketRepository: vi.fn(() => ({
    findMany: mocks.findMany,
    findById: mocks.findById,
    save: mocks.save,
    delete: mocks.delete,
  })),
}));
vi.mock("@/infra/repositories/PrismaNotificationRepository", () => ({
  PrismaNotificationRepository: vi.fn(() => ({
    create: mocks.createNotification,
    findManyByUser: mocks.findManyByUser,
    countUnread: mocks.countUnread,
    markRead: mocks.markRead,
    markAllRead: mocks.markAllRead,
  })),
}));

import { GET, POST } from "../route";
import { PATCH as patchTicket } from "../[id]/route";

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

describe("GET /api/tickets", () => {
  it("retorna 401 sem sessão", async () => {
    mocks.getSession.mockResolvedValue(null);
    const res = await GET(jsonRequest("http://localhost/api/tickets", "GET"));
    expect(res.status).toBe(401);
  });

  it("usuário comum vê apenas os próprios tickets", async () => {
    mocks.getSession.mockResolvedValue(userSession);
    mocks.findMany.mockResolvedValue([{ id: "t1" }]);

    const res = await GET(jsonRequest("http://localhost/api/tickets", "GET"));

    expect(res.status).toBe(200);
    expect(mocks.findMany).toHaveBeenCalledWith({
      search: undefined,
      status: undefined,
      userId: "user-1",
    });
    await expect(res.json()).resolves.toEqual([{ id: "t1" }]);
  });

  it("admin vê todos os tickets (sem filtro de dono)", async () => {
    mocks.getSession.mockResolvedValue(adminSession);
    mocks.findMany.mockResolvedValue([]);

    await GET(jsonRequest("http://localhost/api/tickets", "GET"));

    expect(mocks.findMany).toHaveBeenCalledWith({
      search: undefined,
      status: undefined,
      userId: undefined,
    });
  });
});

describe("POST /api/tickets", () => {
  it("retorna 401 sem sessão", async () => {
    mocks.getSession.mockResolvedValue(null);
    const res = await POST(jsonRequest("http://localhost/api/tickets", "POST", { title: "X" }));
    expect(res.status).toBe(401);
  });

  it("retorna 400 sem título", async () => {
    mocks.getSession.mockResolvedValue(userSession);
    const res = await POST(jsonRequest("http://localhost/api/tickets", "POST", {}));
    expect(res.status).toBe(400);
    expect(mocks.save).not.toHaveBeenCalled();
  });

  it("cria como dono da sessão com status aberto", async () => {
    mocks.getSession.mockResolvedValue(userSession);
    mocks.save.mockResolvedValue({ id: "t1" });

    const res = await POST(
      jsonRequest("http://localhost/api/tickets", "POST", { title: "Dúvida", priority: "alta" })
    );

    expect(res.status).toBe(201);
    expect(mocks.save).toHaveBeenCalledWith(
      expect.objectContaining({ userId: "user-1", status: "aberto", priority: "alta" })
    );
  });
});

describe("PATCH /api/tickets/[id]", () => {
  it("retorna 401 sem sessão", async () => {
    mocks.getSession.mockResolvedValue(null);
    const res = await patchTicket(
      jsonRequest("http://localhost/api/tickets/t1", "PATCH", {}),
      params("t1")
    );
    expect(res.status).toBe(401);
  });

  it("retorna 403 para usuário comum", async () => {
    mocks.getSession.mockResolvedValue(userSession);
    const res = await patchTicket(
      jsonRequest("http://localhost/api/tickets/t1", "PATCH", {}),
      params("t1")
    );
    expect(res.status).toBe(403);
    expect(mocks.save).not.toHaveBeenCalled();
  });

  it("resposta do admin cria notificação para o dono do ticket", async () => {
    mocks.getSession.mockResolvedValue(adminSession);
    mocks.findById.mockResolvedValue({
      id: "t1",
      title: "Dúvida fiscal",
      userId: "user-1",
      status: "aberto",
      priority: "media",
      description: null,
      processId: null,
      response: null,
      respondedAt: null,
    });
    mocks.save.mockImplementation(async (input) => input);
    mocks.createNotification.mockResolvedValue({});

    const res = await patchTicket(
      jsonRequest("http://localhost/api/tickets/t1", "PATCH", { response: "Resolvido!" }),
      params("t1")
    );

    expect(res.status).toBe(200);
    expect(mocks.createNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user-1",
        ticketId: "t1",
        title: 'Resposta no ticket "Dúvida fiscal"',
        message: "Resolvido!",
      })
    );
  });

  it("mudança sem resposta não gera notificação", async () => {
    mocks.getSession.mockResolvedValue(adminSession);
    mocks.findById.mockResolvedValue({
      id: "t1",
      title: "Chamado",
      userId: "user-1",
      status: "aberto",
      priority: "media",
      description: null,
      processId: null,
      response: null,
      respondedAt: null,
    });
    mocks.save.mockImplementation(async (input) => input);

    const res = await patchTicket(
      jsonRequest("http://localhost/api/tickets/t1", "PATCH", { status: "em_andamento" }),
      params("t1")
    );

    expect(res.status).toBe(200);
    expect(mocks.createNotification).not.toHaveBeenCalled();
  });
});
