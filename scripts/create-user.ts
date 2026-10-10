/**
 * Cria um usuário com qualquer papel (user|admin).
 *
 * Uso:
 *   npx tsx --env-file=.env scripts/create-user.ts <email> <senha> <nome> [role]
 */
import { auth } from "../src/lib/auth";
import { prisma } from "../src/infra/db/prisma";

const [, , email, password, name, roleArg] = process.argv;

if (!email || !password || !name) {
  console.error("Uso: npx tsx --env-file=.env scripts/create-user.ts <email> <senha> <nome> [role]");
  process.exit(1);
}

const role = roleArg === "admin" ? "admin" : "user";

async function main() {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    await prisma.user.update({ where: { id: existing.id }, data: { role } });
    console.log(`OK: usuario existente atualizado para role=${role} (${email})`);
    return;
  }

  const result = await auth.api.createUser({
    body: { email, password, name, role },
  });
  console.log(`OK: usuario criado - ${result.user.email} role=${role} (id=${result.user.id})`);
}

main()
  .catch((err) => {
    console.error("ERRO:", err?.body ?? err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
