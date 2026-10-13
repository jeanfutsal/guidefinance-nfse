import { NextRequest, NextResponse } from "next/server";
import { PrismaNotificationRepository } from "@/infra/repositories/PrismaNotificationRepository";
import { getSession } from "@/lib/session";

const repo = new PrismaNotificationRepository();

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { id } = await params;
  const success = await repo.markRead(id, session.user.id);
  if (!success) {
    return NextResponse.json(
      { error: "Notificação não encontrada ou já lida." },
      { status: 404 }
    );
  }
  return NextResponse.json({ success: true });
}
