import { NextResponse } from "next/server";
import { PrismaNotificationRepository } from "@/infra/repositories/PrismaNotificationRepository";
import { getSession } from "@/lib/session";

const repo = new PrismaNotificationRepository();

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const [notifications, unread] = await Promise.all([
    repo.findManyByUser(session.user.id),
    repo.countUnread(session.user.id),
  ]);
  return NextResponse.json({ notifications, unread });
}
