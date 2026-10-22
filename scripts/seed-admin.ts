/**
 * Cria o primeiro usuário administrador do GuideFinance.
 *
 * Uso:
 *   npx tsx --env-file=.env scripts/seed-admin.ts
 *
 * Variáveis obrigatórias:
 *   ADMIN_EMAIL    (ex: admin@suaempresa.com)
 *   ADMIN_PASSWORD (senha forte — não commite este valor)
 *   ADMIN_NAME     (ex: Administrador)
 *
 * Nunca deixe senha hardcoded neste arquivo.
 */
import { auth } from "../src/lib/auth";
import { prisma } from "../src/infra/db/prisma";

const email = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_PASSWORD;
const name = process.env.ADMIN_NAME ?? "Administrador";

if (!email || !password) {
  console.error("ERRO: ADMIN_EMAIL e ADMIN_PASSWORD são obrigatórios.");
  process.exitCode = 1;
  process.exit(1);
}

async function main() {
  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    if (existing.role !== "admin") {
      await prisma.user.update({ where: { id: existing.id }, data: { role: "admin" } });
      console.log(`OK: papel de admin promovido para ${email}`);
    } else {
      console.log(`OK: admin ja existe (${email})`);
    }
    return;
  }

  // auth.api.createUser e endpoint do plugin admin - nao sofre o bloqueio de sign-up
  const result = await auth.api.createUser({
    body: {
      email,
      password,
      name,
      role: "admin",
    },
  });

  console.log(`OK: admin criado - ${result.user.email} (id=${result.user.id})`);
}

main()
  .catch((err) => {
    console.error("ERRO:", err?.body ?? err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
