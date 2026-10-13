import { NextResponse } from "next/server";
import { PrismaNotificationRepository } from "@/infra/repositories/PrismaNotificationRepository";
import { getSession } from "@/lib/session";

const repo = new PrismaNotificationRepository();

export async function POST() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const count = await repo.markAllRead(session.user.id);
  return NextResponse.json({ success: true, count });
}
